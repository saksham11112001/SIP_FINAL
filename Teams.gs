// =============================================================================
//  Teams.gs  |  Team member CRUD + performance analytics
//  Roles: Admin | Team Leader | Team Member
//
//  CHANGES:
//    1. Team Leader added as a valid, first-class role
//    2. Mobile Number field added (col index 7, sheet col 8)
//    3. addTeamMember / updateTeamMember accept mobile param
//    4. getTeams() reads mobile field with backward-compat fallback
//    5. getTeamPerformance() returns mobile in member object
//    6. addTeamMember() auto-grants Editor access to spreadsheet for valid emails
//       — only if email is valid and not already an editor
//       — errors are logged but never interrupt user flow
//    7. deleteTeamMember() now revokes Editor access when a member is removed
//    8. updateTeamMember() handles email change: revokes old, grants new
//       — old email only revoked if no other team member shares it
// =============================================================================

function getTeams() {
  var result = cached(CACHE_KEYS.TEAMS, CACHE_TTL.TEAMS, function () {
    try {
      var data = sheetValues(getSheet(SHEET_NAMES.TEAMS));
      var teams = [];
      for (var i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        teams.push({
          id: String(data[i][0]),
          name: String(data[i][1] || ""),
          role: String(data[i][2] || "Staff"),
          email: String(data[i][3] || ""),
          createdDate: String(data[i][4] || ""),
          active: data[i][5],
          createdBy: String(data[i][6] || ""),
          mobile: String(data[i][7] || ""), // col 8 — backward compat: empty for old rows
        });
      }
      return teams;
    } catch (e) {
      return [];
    }
  });

  // Fallback: direct read if cache miss or empty
  if (!result || result.length === 0) {
    try {
      var sheet = getSheet(SHEET_NAMES.TEAMS);
      if (sheet) {
        var data2 = sheet.getDataRange().getValues();
        var teams2 = [];
        for (var i = 1; i < data2.length; i++) {
          if (!data2[i][0]) continue;
          teams2.push({
            id: String(data2[i][0]),
            name: String(data2[i][1] || ""),
            role: String(data2[i][2] || "Staff"),
            email: String(data2[i][3] || ""),
            createdDate: String(data2[i][4] || ""),
            active: data2[i][5],
            createdBy: String(data2[i][6] || ""),
            mobile: String(data2[i][7] || ""),
          });
        }
        if (teams2.length > 0) {
          try {
            CacheService.getScriptCache().put(
              CACHE_KEYS.TEAMS,
              JSON.stringify(teams2),
              CACHE_TTL.TEAMS,
            );
          } catch (e2) {}
          return teams2;
        }
      }
    } catch (e) {
      Logger.log("getTeams direct fallback error: " + e.message);
    }
  }

  return result || [];
}

// ─────────────────────────────────────────────────────────────────────────────
//  AUTO-GRANT EDITOR ACCESS
//
//  Called after a new team member row is appended.
//  Grants Editor access to the active spreadsheet for the new member's email.
//
//  Safety checks:
//    1. Email must be a plausible address (contains @ and a dot after @)
//    2. Email must not already be in the spreadsheet's editor list
//    3. All errors are caught and logged — the calling function is NOT affected
//
//  Note: This requires the script to have been authorized with the
//  "spreadsheets.currentonly" (or broader) OAuth scope, which is automatically
//  requested when SpreadsheetApp is used. No additional setup is needed.
// ─────────────────────────────────────────────────────────────────────────────

function _grantEditorAccess_(email) {
  try {
    if (!email) return;
    var trimmed = email.trim().toLowerCase();

    // Basic email validation: must contain @ with a domain containing a dot
    if (!trimmed || trimmed.indexOf("@") === -1) return;
    var parts = trimmed.split("@");
    if (
      parts.length !== 2 ||
      parts[0].length === 0 ||
      parts[1].indexOf(".") === -1
    )
      return;

    var ss = getSpreadsheet();

    // Check if this email already has access (editor or owner) to avoid duplicate grants
    var editors = ss.getEditors();
    for (var i = 0; i < editors.length; i++) {
      if (editors[i].getEmail().toLowerCase() === trimmed) {
        Logger.log(
          "_grantEditorAccess_: " +
            trimmed +
            " is already an editor — skipping.",
        );
        return;
      }
    }

    // Also skip if they are the owner
    try {
      var owner = ss.getOwner();
      if (owner && owner.getEmail().toLowerCase() === trimmed) {
        Logger.log(
          "_grantEditorAccess_: " + trimmed + " is the owner — skipping.",
        );
        return;
      }
    } catch (ownerErr) {
      Logger.log("_grantEditorAccess_: owner check error: " + ownerErr.message);
    }

    // Grant Editor access
    ss.addEditor(trimmed);
    Logger.log("_grantEditorAccess_: ✅ Editor access granted to " + trimmed);
  } catch (e) {
    // Non-fatal: log the error but do not throw
    Logger.log('_grantEditorAccess_ error for "' + email + '": ' + e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  REVOKE EDITOR ACCESS
//
//  Called when a team member is deleted, or when their email changes.
//  Removes the email from the spreadsheet's editor list silently.
//
//  Safety checks:
//    1. Email must be valid
//    2. Will never revoke the spreadsheet OWNER (would throw anyway)
//    3. Skips silently if the email is not currently an editor
//    4. All errors caught and logged — calling function is never affected
// ─────────────────────────────────────────────────────────────────────────────

function _revokeEditorAccess_(email) {
  try {
    if (!email) return;
    var trimmed = email.trim().toLowerCase();
    if (!trimmed || trimmed.indexOf("@") === -1) return;
    var parts = trimmed.split("@");
    if (parts.length !== 2 || parts[0].length === 0 || parts[1].indexOf(".") === -1) return;

    var ss = getSpreadsheet();

    // Never revoke the spreadsheet owner — that would throw anyway but let's be explicit
    try {
      var owner = ss.getOwner();
      if (owner && owner.getEmail().toLowerCase() === trimmed) {
        Logger.log("_revokeEditorAccess_: " + trimmed + " is the owner — skipping.");
        return;
      }
    } catch (ownerErr) {
      Logger.log("_revokeEditorAccess_: owner check error: " + ownerErr.message);
    }

    // Confirm they are currently an editor before attempting removal
    var editors = ss.getEditors();
    var isEditor = false;
    for (var i = 0; i < editors.length; i++) {
      if (editors[i].getEmail().toLowerCase() === trimmed) { isEditor = true; break; }
    }
    if (!isEditor) {
      Logger.log("_revokeEditorAccess_: " + trimmed + " is not an editor — nothing to revoke.");
      return;
    }

    ss.removeEditor(trimmed);
    Logger.log("_revokeEditorAccess_: ✅ Editor access revoked from " + trimmed);
  } catch (e) {
    // Non-fatal — log but never propagate
    Logger.log('_revokeEditorAccess_ error for "' + email + '": ' + e.message);
  }
}

function addTeamMember(name, role, email, mobile) {
  try {
    clearCache([CACHE_KEYS.TEAMS]);
    var sheet = getSheet(SHEET_NAMES.TEAMS);
    var user = getCurrentUser();
    if (user.role !== "Admin") {
      return {
        success: false,
        error: "Only an Admin can add team members.",
      };
    }
    var id = "MEMBER_" + new Date().getTime();
    sheet.appendRow([
      id,
      name,
      role,
      email,
      new Date(),
      true,
      user.email || user.name,
      mobile || "",
    ]);
    clearCache([CACHE_KEYS.TEAMS]);
    logAudit(
      user.name,
      "CREATE_MEMBER",
      "Team Member",
      id,
      'Added: "' + name + '" as ' + role,
    );

    // Auto-grant editor access to the spreadsheet for this new member.
    // Called AFTER the row is appended so the main operation always completes first.
    // Errors inside _grantEditorAccess_ are caught and logged — never propagated.
    if (email) {
      _grantEditorAccess_(email);
    }

    return { success: true, memberId: id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function updateTeamMember(id, name, role, email, mobile) {
  try {
    clearCache([CACHE_KEYS.TEAMS]);
    var sheet = getSheet(SHEET_NAMES.TEAMS);
    var data = sheetValues(sheet);
    var user = getCurrentUser();
    if (user.role !== "Admin") {
      return {
        success: false,
        error: "Only an Admin can update team members.",
      };
    }
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(id)) continue;

      // Capture old email BEFORE the update so we can compare
      var oldEmail = String(data[i][3] || "").trim().toLowerCase();
      var newEmail = (email || "").trim().toLowerCase();

      // Write cols 2-5: Name, Role, Email, (skip Created Date + Active + CreatedBy), Mobile at col 8
      sheet.getRange(i + 1, 2, 1, 3).setValues([[name, role, email]]);
      sheet.getRange(i + 1, 8).setValue(mobile || "");
      clearCache([CACHE_KEYS.TEAMS]);
      logAudit(
        user.name,
        "UPDATE_MEMBER",
        "Team Member",
        id,
        'Updated: "' + name + '"',
      );

      // ── Handle email change: revoke old access, grant new access ─────────────
      if (oldEmail !== newEmail) {
        // Grant the new email — _grantEditorAccess_ skips if already an editor
        if (newEmail) _grantEditorAccess_(email);

        // Only revoke the old email if no OTHER team member still uses it
        if (oldEmail) {
          var oldEmailStillUsed = false;
          for (var j = 1; j < data.length; j++) {
            if (j === i) continue; // skip the current member's (now-stale) row
            if (String(data[j][3] || "").trim().toLowerCase() === oldEmail) {
              oldEmailStillUsed = true;
              break;
            }
          }
          if (!oldEmailStillUsed) {
            _revokeEditorAccess_(oldEmail);
          } else {
            Logger.log("updateTeamMember: old email " + oldEmail + " still used by another member — access kept.");
          }
        }
      }

      return { success: true };
    }
    return { success: false, error: "Member not found." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function deleteTeamMember(id) {
  try {
    clearCache([CACHE_KEYS.TEAMS]);
    var sheet = getSheet(SHEET_NAMES.TEAMS);
    var data = sheetValues(sheet);
    var user = getCurrentUser();
    if (user.role !== "Admin") {
      return {
        success: false,
        error: "Only an Admin can remove team members.",
      };
    }
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(id)) continue;
      var name        = String(data[i][1] || "");
      var emailToRevoke = String(data[i][3] || "").trim().toLowerCase();

      // Check if any OTHER row shares the same email before revoking
      // (guards against two members sharing an email address)
      var emailUsedElsewhere = false;
      if (emailToRevoke) {
        for (var j = 1; j < data.length; j++) {
          if (j === i) continue;
          if (String(data[j][3] || "").trim().toLowerCase() === emailToRevoke) {
            emailUsedElsewhere = true;
            break;
          }
        }
      }

      sheet.deleteRow(i + 1);
      clearCache([CACHE_KEYS.TEAMS]);
      logAudit(
        user.name,
        "DELETE_MEMBER",
        "Team Member",
        id,
        'Removed: "' + name + '"',
      );

      // Revoke editor access — only if this was the sole row for that email
      if (emailToRevoke && !emailUsedElsewhere) {
        _revokeEditorAccess_(emailToRevoke);
      } else if (emailUsedElsewhere) {
        Logger.log("deleteTeamMember: " + emailToRevoke + " shared by another member — access kept.");
      }

      return { success: true };
    }
    return { success: false, error: "Member not found." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  PERFORMANCE ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

function getTeamPerformance(periodMonths) {
  periodMonths = periodMonths || 0;
  try {
    var teams = getTeams();
    var tasks = getTasks();
    var projects = getProjects();
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var cutoff = null;
    if (periodMonths > 0) {
      cutoff = new Date(today);
      cutoff.setMonth(cutoff.getMonth() - periodMonths);
      cutoff.setHours(0, 0, 0, 0);
    }

    function _inPeriod(dateStr) {
      if (!cutoff) return true;
      var d = parseDateLoose_(dateStr);
      return d && d >= cutoff;
    }

    return teams.map(function (member) {
      var nameLower = (member.name || "").toLowerCase();

      var memberTasks = tasks.filter(function (t) {
        if ((t.assignedTo || "").toLowerCase() !== nameLower) return false;
        if (cutoff) {
          var within =
            _inPeriod(t.dueDate) ||
            _inPeriod(t.createdDate) ||
            _inPeriod(t.completedDate);
          if (!within) return false;
        }
        return true;
      });

      var total = memberTasks.length;
      var approved = memberTasks.filter(function (t) {
        return t.status === "Completed" && t.approvalStatus === "Approved";
      }).length;
      var pending = memberTasks.filter(function (t) {
        return t.status !== "Completed";
      }).length;
      var inProgress = memberTasks.filter(function (t) {
        return t.status === "In Progress";
      }).length;
      var overdue = memberTasks.filter(function (t) {
        if (t.status === "Completed") return false;
        var d = parseDateLoose_(t.dueDate);
        return d && d < today;
      }).length;
      var pendingApproval = memberTasks.filter(function (t) {
        return t.status === "Completed" && t.approvalStatus === "Pending TL";
      }).length;

      var rate = total > 0 ? Math.round((approved / total) * 100) : 0;

      // Collect project IDs where this member has at least one task
      var taskProjectIds = {};
      memberTasks.forEach(function (t) {
        if (t.projectId) taskProjectIds[t.projectId] = true;
      });

      var memberProjects = projects
        .filter(function (p) {
          var members = (p.teamMembers || "").split(",").map(function (s) {
            return s.trim().toLowerCase();
          });
          return (
            members.indexOf(nameLower) !== -1 ||
            (p.manager || "").toLowerCase() === nameLower ||
            (p.teamLead || "").toLowerCase() === nameLower ||
            taskProjectIds[p.id] === true
          );
        })
        .map(function (p) {
          return { id: p.id, name: p.name, status: p.status };
        });

      var workloadStatus =
        pending > 8 ? "busy" : pending > 3 ? "moderate" : "available";

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        email: member.email,
        mobile: member.mobile || "",
        totalTasks: total,
        approvedTasks: approved,
        pendingTasks: pending,
        inProgressTasks: inProgress,
        overdueTasks: overdue,
        pendingApproval: pendingApproval,
        completionRate: rate,
        workloadStatus: workloadStatus,
        projects: memberProjects,
      };
    });
  } catch (e) {
    Logger.log("getTeamPerformance error: " + e.message);
    return [];
  }
}
