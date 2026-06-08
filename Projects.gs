// =============================================================================
//  Projects.gs  |  Project CRUD + auto-complete + filtered read
//
//  CHANGES IN THIS VERSION:
//    1. getProjects()           — reads PROJ_COL.TEAM_LEAD (col 8)
//    2. addProject()            — accepts teamLead param; stores at col 9
//    3. updateProject()         — writes 9 cols (added teamLead)
//    4. addProjectWithTasks()   — creates project then bulk-creates tasks
//    5. recomputeProjectStatus()— auto-sets project to Completed when all tasks
//                                 approved; skips if project is On Hold
//    6. getFilteredProjects()   — server-side filter by manager/TL/status
//    7. getCompletedProjects()  — active projects explicitly excluded
//    8. toggleProjectHold()     — ENHANCED:
//         On Hold   → records Hold Start Date (col 13) on the project row
//         Resume    → reads Hold Start Date, calculates hold duration,
//                     shifts due dates of all One Time non-Completed tasks in
//                     the project forward by that many days, clears the date
//         Safe:     holds never double-shift because holdStartDate is cleared
//                   on resume and re-written fresh on the next hold
//    9. _shiftOneTimeDueDates_()— NEW internal helper for date shifting
//   10. Valid statuses now include 'On Hold'
// =============================================================================

var VALID_PROJECT_STATUSES = ["Active", "On Hold", "Completed"];

// ─────────────────────────────────────────────────────────────────────────────
//  PERMISSION HELPER
//  Returns true if `user` is the designated team lead of the given project.
//  Checks against PROJ_COL.TEAM_LEAD (stored as email).
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  Returns true if `user` is the FIRST name in project.teamMembers (Second Person).
//  Second Person gets the same full-edit access as the Project Lead.
// ─────────────────────────────────────────────────────────────────────────────
function _isProjectSecondPerson_(projectId, user) {
  if (!projectId || !user) return false;
  try {
    var projects = getProjects();
    var userName  = (user.name  || '').trim().toLowerCase();
    var userEmail = (user.email || '').trim().toLowerCase();
    for (var i = 0; i < projects.length; i++) {
      if (String(projects[i].id) !== String(projectId)) continue;
      var members = (projects[i].teamMembers || '').split(',');
      if (!members.length) return false;
      var first = members[0].trim().toLowerCase();
      return first.length > 0 && (first === userName || first === userEmail);
    }
  } catch (e) {
    Logger.log('_isProjectSecondPerson_ error: ' + e.message);
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Returns true if `user` is ANY member of the project (teamLead OR teamMembers).
//  Used for "can add tasks" — every project member is allowed.
// ─────────────────────────────────────────────────────────────────────────────
function _isProjectMember_(projectId, user) {
  if (!projectId || !user) return false;
  try {
    var projects = getProjects();
    var userName  = (user.name  || '').trim().toLowerCase();
    var userEmail = (user.email || '').trim().toLowerCase();
    for (var i = 0; i < projects.length; i++) {
      if (String(projects[i].id) !== String(projectId)) continue;
      var p = projects[i];
      // teamLead is stored as email
      if (userEmail && (p.teamLead || '').trim().toLowerCase() === userEmail) return true;
      // teamMembers is stored as comma-separated names (or emails)
      var members = (p.teamMembers || '').split(',');
      for (var j = 0; j < members.length; j++) {
        var m = members[j].trim().toLowerCase();
        if (m && (m === userName || m === userEmail)) return true;
      }
    }
  } catch (e) {
    Logger.log('_isProjectMember_ error: ' + e.message);
  }
  return false;
}

function _isProjectLeadServer_(projectId, user) {
  if (!projectId || !user || !user.email) return false;
  try {
    var projects = getProjects();
    var userEmail = (user.email || "").trim().toLowerCase();
    for (var i = 0; i < projects.length; i++) {
      if (String(projects[i].id) === String(projectId)) {
        return (projects[i].teamLead || "").trim().toLowerCase() === userEmail;
      }
    }
  } catch (e) {
    Logger.log("_isProjectLeadServer_ error: " + e.message);
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
//  READ  (cached)
// ─────────────────────────────────────────────────────────────────────────────

function getProjects() {
  return cached(CACHE_KEYS.PROJECTS, CACHE_TTL.PROJECTS, function () {
    try {
      var data = sheetDisplayValues(getSheet(SHEET_NAMES.PROJECTS));
      var projects = [];
      for (var i = 1; i < data.length; i++) {
        var r = data[i];
        if (!r[PROJ_COL.ID]) continue;
        projects.push({
          id: r[PROJ_COL.ID],
          name: r[PROJ_COL.NAME],
          client: r[PROJ_COL.CLIENT],
          startDate: r[PROJ_COL.START_DATE],
          deadline: r[PROJ_COL.DEADLINE],
          clientType: r[PROJ_COL.CLIENT_TYPE],
          manager: r[PROJ_COL.MANAGER],
          teamMembers: r[PROJ_COL.TEAM_MEMBERS],
          teamLead: r[PROJ_COL.TEAM_LEAD] || "",
          status: r[PROJ_COL.STATUS] || "Active",
          createdDate: r[PROJ_COL.CREATED_DATE],
          createdBy: r[PROJ_COL.CREATED_BY],
          // Note: HOLD_START_DATE (col 12) is internal-only; not exposed to UI
        });
      }
      return projects;
    } catch (e) {
      Logger.log("getProjects error: " + e.message);
      return [];
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  SERVER-SIDE FILTERED READ
// ─────────────────────────────────────────────────────────────────────────────

function getFilteredProjects(filters) {
  try {
    filters = filters || {};
    var all = getProjects();

    return all.filter(function (p) {
      if (
        filters.manager &&
        (p.manager || "").toLowerCase() !==
          (filters.manager || "").toLowerCase()
      )
        return false;
      if (
        filters.teamLead &&
        (p.teamLead || "").toLowerCase() !==
          (filters.teamLead || "").toLowerCase()
      )
        return false;
      if (filters.status && p.status !== filters.status) return false;
      return true;
    });
  } catch (e) {
    Logger.log("getFilteredProjects error: " + e.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE  (single project, no tasks)
// ─────────────────────────────────────────────────────────────────────────────

function addProject(
  name,
  client,
  startDate,
  deadline,
  clientType,
  manager,
  teamMembers,
  teamLead,
) {
  try {
    clearCache([CACHE_KEYS.PROJECTS]);

    var sheet = getSheet(SHEET_NAMES.PROJECTS);
    var user = getCurrentUser();
    if (user.role !== "Admin" && user.role !== "Team Leader") {
      return {
        success: false,
        error: "Only an Admin or Team Leader can create projects.",
      };
    }
    var id = "PROJ_" + new Date().getTime();

    sheet.appendRow([
      id,
      name,
      client,
      startDate,
      deadline,
      clientType,
      manager,
      teamMembers || "",
      teamLead || "",
      "Active",
      new Date(),
      user.email || user.name,
      "", // col 13: Hold Start Date — empty on creation
    ]);

    logAudit(
      user.name,
      "CREATE_PROJECT",
      "Project",
      id,
      'Created: "' + name + '"',
    );
    return { success: true, projectId: id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE PROJECT + BULK TASKS
// ─────────────────────────────────────────────────────────────────────────────

function addProjectWithTasks(projectData, taskList) {
  try {
    var projResult = addProject(
      projectData.name,
      projectData.client,
      projectData.startDate,
      projectData.deadline,
      projectData.clientType,
      projectData.manager,
      projectData.teamMembers,
      projectData.teamLead,
    );
    if (!projResult.success) return projResult;

    var projectId = projResult.projectId;

    if (taskList && taskList.length > 0) {
      var taskResult = addTasksBulk(projectId, taskList);
      if (!taskResult.success) {
        return {
          success: true,
          projectId: projectId,
          taskWarning: taskResult.error,
        };
      }
    }

    return { success: true, projectId: projectId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE — 9 data columns
// ─────────────────────────────────────────────────────────────────────────────

function updateProject(
  id,
  name,
  client,
  startDate,
  deadline,
  clientType,
  manager,
  teamMembers,
  status,
  teamLead,
) {
  try {
    clearCache([CACHE_KEYS.PROJECTS, CACHE_KEYS.TASKS]);

    var sheet = getSheet(SHEET_NAMES.PROJECTS);
    var data = sheetValues(sheet);
    var user = getCurrentUser();
    if (user.role !== "Admin" && !(user.role === "Team Leader" && _isProjectLeadServer_(id, user))) {
      return {
        success: false,
        error: "Only an Admin or the project's Team Lead can update this project.",
      };
    }

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][PROJ_COL.ID]) !== String(id)) continue;
      var row = i + 1;

      sheet
        .getRange(row, 2, 1, 9)
        .setValues([
          [
            name,
            client,
            startDate,
            deadline,
            clientType,
            manager,
            teamMembers || "",
            teamLead || "",
            status,
          ],
        ]);

      logAudit(
        user.name,
        "UPDATE_PROJECT",
        "Project",
        id,
        '"' + name + '" → ' + status,
      );
      return { success: true };
    }
    return { success: false, error: "Project not found." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  HOLD / RESTART TOGGLE
//
//  Allowed for: Manager | Team Leader
//
//  On Hold:
//    • Sets project status to 'On Hold'
//    • Records today's date in HOLD_START_DATE (col 13)
//    • Email reminders are paused automatically (EmailAlerts checks onHoldSet)
//
//  Resume (On Hold → Active):
//    • Reads HOLD_START_DATE; calculates hold duration in days
//    • Shifts all One Time, non-Completed tasks' due dates forward by that count
//    • Daily / Alternate Days / Weekly tasks are NOT shifted (no due date)
//    • Completed tasks are NOT shifted (already done)
//    • Clears HOLD_START_DATE (prevents double-shift if held again)
//    • Clears task cache (due dates changed)
//
//  Multiple Hold/Resume cycles are safe:
//    Each resume uses ONLY the current hold's start date (cleared after use).
//    A fresh hold start date is recorded on each new hold.
// ─────────────────────────────────────────────────────────────────────────────

function toggleProjectHold(projectId) {
  try {
    var user = getCurrentUser();
    if (user.role !== "Admin" && !(user.role === "Team Leader" && _isProjectLeadServer_(projectId, user))) {
      return {
        success: false,
        error: "Only an Admin or the project's Team Lead can hold/restart this project.",
      };
    }

    clearCache([CACHE_KEYS.PROJECTS]);

    var sheet = getSheet(SHEET_NAMES.PROJECTS);
    var data = sheetValues(sheet);
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][PROJ_COL.ID]) !== String(projectId)) continue;

      var row = i + 1;
      var currStatus = String(data[i][PROJ_COL.STATUS] || "Active");
      var projName = String(data[i][PROJ_COL.NAME] || "");
      var holdStartRaw = data[i][PROJ_COL.HOLD_START_DATE] || "";

      var newStatus = currStatus === "On Hold" ? "Active" : "On Hold";

      // ── Write new status ───────────────────────────────────────────────────
      sheet.getRange(row, PROJ_COL.STATUS + 1).setValue(newStatus);

      if (newStatus === "On Hold") {
        // ── Going on Hold: record today as the hold start date ────────────────
        sheet.getRange(row, PROJ_COL.HOLD_START_DATE + 1).setValue(today);
        logAudit(
          user.name,
          "PROJECT_ON_HOLD",
          "Project",
          projectId,
          '"' +
            projName +
            '" → On Hold (hold started ' +
            _ymdProject_(today) +
            ")",
        );
      } else {
        // ── Resuming: shift One Time task due dates by hold duration ──────────
        var holdStartDate = holdStartRaw
          ? parseDateLoose_(String(holdStartRaw))
          : null;

        if (holdStartDate) {
          var holdDays = Math.max(
            0,
            Math.round((today - holdStartDate) / 86400000),
          );
          if (holdDays > 0) {
            _shiftOneTimeDueDates_(projectId, holdDays);
            logAudit(
              user.name,
              "HOLD_DATE_SHIFT",
              "Project",
              projectId,
              '"' +
                projName +
                '" resumed — ' +
                holdDays +
                " day(s) added to One Time task due dates",
            );
          }
        }

        // Clear the hold start date so future holds start fresh
        sheet.getRange(row, PROJ_COL.HOLD_START_DATE + 1).setValue("");
        logAudit(
          user.name,
          "PROJECT_RESTARTED",
          "Project",
          projectId,
          '"' + projName + '" → Active',
        );
      }

      clearCache([CACHE_KEYS.PROJECTS]);
      return { success: true, newStatus: newStatus };
    }
    return { success: false, error: "Project not found." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  _shiftOneTimeDueDates_  (internal)
//
//  Shifts the due date of every One Time, non-Completed task in the given
//  project forward by holdDays calendar days.
//
//  Skipped tasks:
//    • frequency !== 'One Time'  (Daily / Alternate Days / Weekly — no due date)
//    • status === 'Completed'    (already done; no need to shift)
//    • no dueDate set            (nothing to shift)
//    • dueDate cannot be parsed  (defensive — skip rather than corrupt)
// ─────────────────────────────────────────────────────────────────────────────

function _shiftOneTimeDueDates_(projectId, holdDays) {
  if (!holdDays || holdDays <= 0) return;
  try {
    var taskSheet = getSheet(SHEET_NAMES.TASKS);
    var taskData = taskSheet.getDataRange().getValues();
    var tz = Session.getScriptTimeZone();

    for (var j = 1; j < taskData.length; j++) {
      var row = taskData[j];

      // Only tasks in this project
      if (String(row[TASK_COL.PROJECT_ID]) !== String(projectId)) continue;

      // Only One Time tasks (blank frequency defaults to One Time)
      var freq = _normaliseFrequency(row[TASK_COL.FREQUENCY]);
      if (freq !== "One Time") continue;

      // Skip completed tasks
      var status = _normaliseStatus(row[TASK_COL.STATUS]);
      if (status === "Completed") continue;

      // Must have a parseable due date
      var dueDateStr = String(row[TASK_COL.DUE_DATE] || "").trim();
      if (!dueDateStr) continue;
      var dueDate = parseDateLoose_(dueDateStr);
      if (!dueDate) continue;

      // Shift forward by holdDays
      dueDate.setDate(dueDate.getDate() + holdDays);
      var newDueDateStr = Utilities.formatDate(dueDate, tz, "dd/MM/yyyy");
      taskSheet.getRange(j + 1, TASK_COL.DUE_DATE + 1).setValue(newDueDateStr);
    }

    // Task cache must be cleared since due dates changed
    clearCache([CACHE_KEYS.TASKS]);
  } catch (e) {
    Logger.log("_shiftOneTimeDueDates_ error: " + e.message);
  }
}

/** Simple yyyy-MM-dd formatter for audit log messages (avoids tz issues). */
function _ymdProject_(d) {
  var mm = ("0" + (d.getMonth() + 1)).slice(-2);
  var dd = ("0" + d.getDate()).slice(-2);
  return d.getFullYear() + "-" + mm + "-" + dd;
}

// ─────────────────────────────────────────────────────────────────────────────
//  AUTO-COMPLETE PROJECT STATUS
//  Called after any task status/approval change.
//  Skips On Hold projects — they should not auto-transition.
// ─────────────────────────────────────────────────────────────────────────────

function recomputeProjectStatus(projectId) {
  if (!projectId) return;
  try {
    var projSheet = getSheet(SHEET_NAMES.PROJECTS);
    var projData = sheetValues(projSheet);

    var projRow = -1;
    var projName = "";
    var currStatus = "";
    for (var i = 1; i < projData.length; i++) {
      if (String(projData[i][PROJ_COL.ID]) === String(projectId)) {
        projRow = i + 1;
        projName = String(projData[i][PROJ_COL.NAME] || "");
        currStatus = String(projData[i][PROJ_COL.STATUS] || "Active");
        break;
      }
    }
    if (projRow === -1) return;

    // Do NOT auto-transition a project that is deliberately On Hold
    if (currStatus === "On Hold") return;

    var taskData = sheetValues(getSheet(SHEET_NAMES.TASKS));
    var projTasks = [];
    for (var j = 1; j < taskData.length; j++) {
      if (String(taskData[j][TASK_COL.PROJECT_ID]) !== String(projectId)) continue;
      // Ongoing tasks run for the life of the project — exclude from completion check
      var freq = _normaliseFrequency(String(taskData[j][TASK_COL.FREQUENCY] || ""));
      if (freq === "Ongoing") continue;
      projTasks.push({
        status: String(taskData[j][TASK_COL.STATUS] || ""),
        approvalStatus: String(taskData[j][TASK_COL.APPROVAL_STATUS] || ""),
      });
    }

    if (projTasks.length === 0) return;

    var allApproved = projTasks.every(function (t) {
      return t.status === "Completed" && t.approvalStatus === "Approved";
    });

    var newStatus = allApproved ? "Completed" : "Active";

    if (newStatus !== currStatus) {
      projSheet.getRange(projRow, PROJ_COL.STATUS + 1).setValue(newStatus);
      clearCache([CACHE_KEYS.PROJECTS]);

      var user = getCurrentUser();
      logAudit(
        user.name,
        "AUTO_STATUS",
        "Project",
        projectId,
        '"' + projName + '" auto-set to ' + newStatus,
      );
    }
  } catch (e) {
    Logger.log("recomputeProjectStatus error: " + e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  REORDER PROJECTS
//  Receives the full ordered list of project IDs and rewrites the sheet rows
//  in that order.  Any project not in the list is appended at the end.
// ─────────────────────────────────────────────────────────────────────────────

function setProjectOrder(orderedProjectIds) {
  try {
    var user = getCurrentUser();
    if (user.role !== 'Admin') {
      return { success: false, error: 'Only an Admin can reorder projects.' };
    }
    if (!orderedProjectIds || orderedProjectIds.length === 0) {
      return { success: false, error: 'No project IDs provided.' };
    }

    clearCache([CACHE_KEYS.PROJECTS]);
    var sheet   = getSheet(SHEET_NAMES.PROJECTS);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2) return { success: true };

    // Read raw values (not display values — avoids date string issues)
    var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    // Build id → row map
    var rowMap = {};
    rows.forEach(function(row) {
      var id = String(row[PROJ_COL.ID] || '').trim();
      if (id) rowMap[id] = row;
    });

    // New order: requested IDs first, then any remaining
    var newRows = [];
    orderedProjectIds.forEach(function(id) {
      if (rowMap[id]) { newRows.push(rowMap[id]); delete rowMap[id]; }
    });
    Object.keys(rowMap).forEach(function(id) { newRows.push(rowMap[id]); });

    if (newRows.length > 0) {
      sheet.getRange(2, 1, newRows.length, lastCol).setValues(newRows);
    }

    clearCache([CACHE_KEYS.PROJECTS]);
    logAudit(user.name, 'REORDER_PROJECTS', 'Project', 'BULK',
      orderedProjectIds.length + ' projects reordered');
    return { success: true };
  } catch (e) {
    Logger.log('setProjectOrder error: ' + e.message);
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE PROJECT
// ─────────────────────────────────────────────────────────────────────────────

function deleteProject(id) {
  try {
    clearCache([CACHE_KEYS.PROJECTS]);
    var sheet = getSheet(SHEET_NAMES.PROJECTS);
    var data = sheetValues(sheet);
    var user = getCurrentUser();
    if (user.role !== "Admin") {
      return {
        success: false,
        error: "Only an Admin can delete projects.",
      };
    }

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][PROJ_COL.ID]) !== String(id)) continue;
      var name = String(data[i][PROJ_COL.NAME] || "");
      sheet.deleteRow(i + 1);
      logAudit(
        user.name,
        "DELETE_PROJECT",
        "Project",
        id,
        'Deleted: "' + name + '"',
      );
      return { success: true };
    }
    return { success: false, error: "Project not found." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPLETED PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

function getCompletedProjects() {
  try {
    var projects = getProjects();
    var tasks = getTasks();

    return projects
      .filter(function (p) {
        if (p.status === "Completed") return true;
        var pTasks = tasks.filter(function (t) {
          return t.projectId === p.id;
        });
        return (
          pTasks.length > 0 &&
          pTasks.every(function (t) {
            return t.status === "Completed" && t.approvalStatus === "Approved";
          })
        );
      })
      .map(function (p) {
        var pTasks = tasks.filter(function (t) {
          return t.projectId === p.id;
        });
        var doneTasks = pTasks.filter(function (t) {
          return t.status === "Completed";
        });
        var latestDate = doneTasks.reduce(function (latest, t) {
          var d = parseDateLoose_(t.completedDate);
          return d && (!latest || d > latest) ? d : latest;
        }, null);
        var deadlineDate = parseDateLoose_(p.deadline);
        var deliveredOnTime =
          deadlineDate && latestDate ? latestDate <= deadlineDate : null;
        return Object.assign({}, p, {
          totalTasks: pTasks.length,
          completedTasks: doneTasks.length,
          completedDate: latestDate
            ? Utilities.formatDate(
                latestDate,
                Session.getScriptTimeZone(),
                "dd MMM yyyy",
              )
            : "",
          deliveredOnTime: deliveredOnTime,
        });
      })
      .sort(function (a, b) {
        var da = parseDateLoose_(a.completedDate);
        var db = parseDateLoose_(b.completedDate);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db - da;
      });
  } catch (e) {
    Logger.log("getCompletedProjects error: " + e.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  GLOBAL SEARCH  (projects + tasks)
// ─────────────────────────────────────────────────────────────────────────────

function searchProjectsAndTasks(query) {
  try {
    var q = (query || "").toLowerCase();
    var projects = getProjects();
    var tasks = getTasks();

    var matchProj = projects
      .filter(function (p) {
        return (
          (p.name || "").toLowerCase().indexOf(q) !== -1 ||
          (p.client || "").toLowerCase().indexOf(q) !== -1 ||
          (p.manager || "").toLowerCase().indexOf(q) !== -1
        );
      })
      .slice(0, 8);

    var projMap = {};
    projects.forEach(function (p) {
      projMap[p.id] = p;
    });

    var matchTasks = tasks
      .filter(function (t) {
        return (
          (t.name || "").toLowerCase().indexOf(q) !== -1 ||
          (t.assignedTo || "").toLowerCase().indexOf(q) !== -1 ||
          (t.notes || "").toLowerCase().indexOf(q) !== -1
        );
      })
      .slice(0, 8)
      .map(function (t) {
        var p = projMap[t.projectId];
        return Object.assign({}, t, { projectName: p ? p.name : t.projectId });
      });

    return { projects: matchProj, tasks: matchTasks };
  } catch (e) {
    return { projects: [], tasks: [] };
  }
}
