// =============================================================================
//  Code.gs  |  Main entry point + configuration + shared utilities
//
//  AUTH STRATEGY — THREE-LAYER, MAXIMUM RESILIENCE:
//
//  Layer 1: CacheService.getUserCache() — per-user, 5 min TTL
//           Fast, zero sheet reads on reloads. Immune to shared-cache failures.
//
//  Layer 2: PropertiesService.getUserProperties() — per-user, PERSISTENT
//           Survives cache eviction entirely. 4-hour validity stamp.
//           This is the key layer that prevents intermittent denials.
//
//  Layer 3: Direct sheet read (sheet.getDataRange().getValues())
//           Raw, uncached, bypasses all caching. Used when both caches miss.
//           Falls back to getTeams() if direct read also returns empty.
//
//  ROLES: Admin | Team Leader | Team Member
//  "Team Lead" on a PROJECT = per-project designation, not a member role.
//  Backward-compat: "Manager" in sheet → normalised to "Admin"
//                   "Staff"   in sheet → normalised to "Team Member"
//
//  APPROVAL FLOW (single-stage):
//    Team Member completes task → Pending TL
//    Team Leader (project lead) approves → Approved
//    Admin can approve at any stage (override)
// =============================================================================

var SPREADSHEET_ID = "19PaR6XwGmeCPOIJuSKFLEGPDL76s-Ebu7o1KrYuVVlw";

var SHEET_NAMES = {
  PROJECTS   : "Projects",
  TASKS      : "Tasks",
  CLIENTS    : "Clients",
  TEAMS      : "Teams",
  AUDIT      : "AuditLog",
  EMAIL_LOG  : "EmailLog",
  ATTACHMENTS: "Attachments",
};

var TASK_COL = {
  ID: 0,
  PROJECT_ID: 1,
  NAME: 2,
  ASSIGNED_TO: 3,
  DUE_DATE: 4,
  STATUS: 5,
  PRIORITY: 6,
  NOTES: 7,
  CREATED_DATE: 8,
  COMPLETED_DATE: 9,
  CREATED_BY: 10,
  APPROVAL_STATUS: 11,
  APPROVAL_REMARKS: 12,
  APPROVED_BY: 13,
  APPROVED_DATE: 14,
  FREQUENCY: 15,
  DAY_OF_WEEK: 16,
  TASK_APPROVER: 17,   // name of the designated approver; empty = use project lead
};

var PROJ_COL = {
  ID: 0,
  NAME: 1,
  CLIENT: 2,
  START_DATE: 3,
  DEADLINE: 4,
  CLIENT_TYPE: 5,
  MANAGER: 6,
  TEAM_MEMBERS: 7,
  TEAM_LEAD: 8,
  STATUS: 9,
  CREATED_DATE: 10,
  CREATED_BY: 11,
  HOLD_START_DATE: 12, // internal-only; not exposed to UI
};

// =============================================================================
//  WEB APP ENTRY POINT
// =============================================================================

function doGet(e) {
  // PERT share temporarily disabled
  // var pertToken = e && e.parameter && e.parameter.pert;
  // if (pertToken) return _servePertShare_(pertToken);

  var tpl = HtmlService.createTemplateFromFile("Index");
  return tpl
    .evaluate()
    .setTitle("Secret Ingredient — Project Tracker")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =============================================================================
//  SPREADSHEET ACCESS
// =============================================================================

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

// =============================================================================
//  SETUP — Run ONCE from Apps Script editor after first deploy
// =============================================================================

function setupSheets() {
  var ss = getSpreadsheet();

  var projHdrs = [
    "ID",
    "Name",
    "Client",
    "Start Date",
    "Deadline",
    "Client Type",
    "Manager",
    "Team Members",
    "Team Lead",
    "Status",
    "Created Date",
    "Created By",
  ];
  var ps = ss.getSheetByName(SHEET_NAMES.PROJECTS);
  if (!ps) {
    ps = ss.insertSheet(SHEET_NAMES.PROJECTS);
    ps.getRange(1, 1, 1, projHdrs.length).setValues([projHdrs]);
  } else {
    var cols = ps.getLastColumn();
    if (cols === 11) {
      ps.insertColumnBefore(9);
      ps.getRange(1, 9).setValue("Team Lead");
    } else if (cols < 12)
      ps.getRange(1, 1, 1, projHdrs.length).setValues([projHdrs]);
  }

  var taskHdrs = [
    "ID",
    "Project ID",
    "Name",
    "Assigned To",
    "Due Date",
    "Status",
    "Priority",
    "Notes",
    "Created Date",
    "Completed Date",
    "Created By",
    "Approval Status",
    "Approval Remarks",
    "Approved By",
    "Approved Date",
  ];
  var ts = ss.getSheetByName(SHEET_NAMES.TASKS);
  if (!ts) {
    ts = ss.insertSheet(SHEET_NAMES.TASKS);
    ts.getRange(1, 1, 1, taskHdrs.length).setValues([taskHdrs]);
  } else {
    var tcols = ts.getLastColumn();
    if (tcols < 15) {
      [
        "Approval Status",
        "Approval Remarks",
        "Approved By",
        "Approved Date",
      ].forEach(function (h, i) {
        ts.getRange(1, 12 + i).setValue(h);
      });
    }
    if (tcols < 16) ts.getRange(1, 16).setValue("Frequency");
    if (tcols < 17) ts.getRange(1, 17).setValue("Day Of Week");
    if (tcols < 18) ts.getRange(1, 18).setValue("Task Approver");
  }

  _ensureSheet(ss, SHEET_NAMES.CLIENTS, [
    "ID",
    "Name",
    "Type",
    "Created Date",
    "Active",
    "Created By",
  ]);
  // Teams sheet: added Mobile column (col 8, index 7) — backward compatible (old rows just have empty col 8)
  _ensureSheet(ss, SHEET_NAMES.TEAMS, [
    "ID",
    "Name",
    "Role",
    "Email",
    "Created Date",
    "Active",
    "Created By",
    "Mobile",
  ]);
  _ensureSheet(ss, SHEET_NAMES.AUDIT, [
    "Timestamp",
    "User",
    "Action",
    "Entity Type",
    "Entity ID",
    "Details",
  ]);
  _ensureSheet(ss, SHEET_NAMES.EMAIL_LOG, [
    "Task ID",
    "Email Type",
    "Recipient",
    "Sent Date",
    "Escalation Level",
    "Notes",
  ]);
  _ensureSheet(ss, SHEET_NAMES.ATTACHMENTS, [
    "ID",
    "Task ID",
    "Project ID",
    "File Name",
    "Drive File ID",
    "View URL",
    "Uploaded By",
    "Uploaded Date",
  ]);

  return { success: true, message: "All sheets ready." };
}

function _ensureSheet(ss, name, headers) {
  if (!ss.getSheetByName(name)) {
    ss.insertSheet(name).getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

// =============================================================================
//  USER SESSION — THREE-LAYER RESILIENT AUTH
// =============================================================================

// Layer 3a: Direct uncached read from Teams sheet
function _readTeamsDirectly_() {
  try {
    var sheet = getSheet(SHEET_NAMES.TEAMS);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var teams = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      teams.push({
        id: String(data[i][0]),
        name: String(data[i][1] || ""),
        role: String(data[i][2] || "Staff"),
        email: String(data[i][3] || "")
          .trim()
          .toLowerCase(),
      });
    }
    return teams;
  } catch (e) {
    Logger.log("_readTeamsDirectly_ error: " + e.message);
    return [];
  }
}

function getCurrentUser() {
  // ── Step 1: Get the visiting user's Google email ──────────────────────────
  var email = "";
  try {
    email = (Session.getActiveUser().getEmail() || "").trim();
  } catch (e) {}

  // Cold-start recovery
  if (!email) {
    try {
      Utilities.sleep(400);
      email = (Session.getActiveUser().getEmail() || "").trim();
    } catch (e2) {}
  }

  if (!email) {
    return {
      email: "",
      name: "Unknown",
      role: "",
      accessDenied: true,
      reason:
        "Your Google account email could not be detected. " +
        "This sometimes happens on first load — please refresh the page. " +
        "If it persists, ensure you are signed into Google and the app is " +
        'deployed as \"Anyone within domain\".',
    };
  }

  var emailLower = email.toLowerCase();

  // ── Layer 1: CacheService.getUserCache() ──────────────────────────────────
  try {
    var uCache = CacheService.getUserCache();
    var cached1 = uCache ? uCache.get("auth_v5") : null;
    if (cached1) {
      var obj1 = JSON.parse(cached1);
      if (
        obj1 &&
        obj1.email &&
        obj1.email.toLowerCase() === emailLower &&
        obj1.role
      ) {
        return {
          email: email,
          name: obj1.name,
          role: obj1.role,
          accessDenied: false,
          reason: "",
        };
      }
    }
  } catch (e) {
    Logger.log("UserCache read (non-fatal): " + e.message);
  }

  // ── Layer 2: PropertiesService.getUserProperties() ────────────────────────
  try {
    var uprops = PropertiesService.getUserProperties();
    var cached2 = uprops ? uprops.getProperty("auth_v5") : null;
    if (cached2) {
      var obj2 = JSON.parse(cached2);
      if (
        obj2 &&
        obj2.email &&
        obj2.email.toLowerCase() === emailLower &&
        obj2.role
      ) {
        var age = (new Date().getTime() - (obj2.ts || 0)) / 1000 / 3600;
        if (age < 4) {
          try {
            CacheService.getUserCache().put(
              "auth_v5",
              JSON.stringify(obj2),
              300,
            );
          } catch (e2) {}
          return {
            email: email,
            name: obj2.name,
            role: obj2.role,
            accessDenied: false,
            reason: "",
          };
        }
      }
    }
  } catch (e) {
    Logger.log("UserProperties read (non-fatal): " + e.message);
  }

  // ── Layer 3: Live sheet read ───────────────────────────────────────────────
  var teams = _readTeamsDirectly_();

  if (teams.length === 0) {
    try {
      var t2 = getTeams();
      if (t2 && t2.length > 0) {
        teams = t2.map(function (m) {
          return {
            id: m.id,
            name: m.name,
            role: m.role,
            email: (m.email || "").toLowerCase(),
          };
        });
      }
    } catch (e) {
      Logger.log("getTeams fallback: " + e.message);
    }
  }

  var match = null;
  for (var i = 0; i < teams.length; i++) {
    if (teams[i].email === emailLower) {
      match = teams[i];
      break;
    }
  }

  if (match) {
    var result = {
      email: email,
      name: match.name,
      role: _normaliseRole(match.role),
      accessDenied: false,
      reason: "",
      ts: new Date().getTime(),
    };
    try {
      CacheService.getUserCache().put("auth_v5", JSON.stringify(result), 300);
    } catch (e) {}
    try {
      PropertiesService.getUserProperties().setProperty(
        "auth_v5",
        JSON.stringify(result),
      );
    } catch (e) {}
    return result;
  }

  return {
    email: email,
    name: email.split("@")[0],
    role: "",
    accessDenied: true,
    reason:
      "Your account (" +
      email +
      ") is not registered in this system. " +
      "Ask your administrator to add your email to the Teams sheet.",
  };
}

function _requireRole(roles) {
  var user = getCurrentUser();
  if (user.accessDenied) throw new Error("Access denied: " + user.reason);
  if (roles && roles.indexOf(user.role) === -1) {
    throw new Error("Permission denied. Requires: " + roles.join(" or ") + ".");
  }
  return user;
}

// Roles: Admin | Team Leader | Team Member
// Backward-compat: 'Manager' → 'Admin', 'Staff' → 'Team Member'
function _normaliseRole(r) {
  r = String(r || "").trim();
  if (r === "Admin") return "Admin";
  if (r === "Manager") return "Admin"; // legacy
  if (r === "Team Leader" || r === "TeamLeader" || r === "Team Lead")
    return "Team Leader";
  if (r === "Team Member" || r === "TeamMember") return "Team Member";
  if (r === "Staff") return "Team Member"; // legacy
  return "Team Member";
}

// =============================================================================
//  AUDIT LOG
// =============================================================================

function logAudit(user, action, entityType, entityId, details) {
  try {
    getSheet(SHEET_NAMES.AUDIT).appendRow([
      new Date(),
      user,
      action,
      entityType,
      entityId,
      details,
    ]);
  } catch (e) {
    Logger.log("Audit error: " + e.message);
  }
}

function getAuditLog() {
  _requireRole(['Admin']);
  try {
    var data = sheetDisplayValues(getSheet(SHEET_NAMES.AUDIT));
    var logs = [];
    for (var i = data.length - 1; i >= 1; i--) {
      logs.push({
        timestamp: data[i][0],
        user: data[i][1],
        action: data[i][2],
        entityType: data[i][3],
        entityId: data[i][4],
        details: data[i][5],
      });
      if (logs.length >= 200) break;
    }
    return logs;
  } catch (e) {
    return [];
  }
}

// =============================================================================
//  DATE HELPER
// =============================================================================

function parseDateLoose_(s) {
  s = String(s || "").trim();
  if (!s) return null;
  var d = new Date(s);
  if (!isNaN(d.getTime())) {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  var m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    var a = +m[1],
      b = +m[2],
      y = +m[3];
    if (y < 100) y += 2000;
    var dd = a > 12 ? a : b,
      mm = a > 12 ? b : a;
    var r = new Date(y, mm - 1, dd);
    if (!isNaN(r.getTime())) {
      r.setHours(0, 0, 0, 0);
      return r;
    }
  }
  return null;
}

// =============================================================================
//  SHEET PROTECTION
//
//  Run setupSheetProtection() ONCE from the Apps Script editor after first deploy.
//  This locks every data sheet so only the script owner can edit directly.
//  Team members with Editor access to the spreadsheet will see a "Protected range"
//  warning if they try to type into any cell — they must use the web app instead.
//
//  IMPORTANT — Web App execution mode:
//    This works best when the web app is deployed as "Execute as: Me (owner)".
//    In that mode the web app's server functions run as the owner and bypass
//    protection automatically. If deployed as "Execute as: User accessing the
//    web app", the protection will also block the app's write operations for
//    non-owner users — switch to "Execute as: Me" if that happens.
//
//  Two-layer defence:
//    Layer 1: setupSheetProtection()  — Google Sheets native protection (blocks UI edits)
//    Layer 2: onEdit trigger          — validates and reverts any edit that slips through
// =============================================================================

/**
 * Run once from Apps Script editor.
 * Protects every data sheet so only the spreadsheet owner can edit directly.
 */
function setupSheetProtection() {
  var ss = getSpreadsheet();
  var sheetsToProtect = [
    SHEET_NAMES.PROJECTS,
    SHEET_NAMES.TASKS,
    SHEET_NAMES.TEAMS,
    SHEET_NAMES.CLIENTS,
    SHEET_NAMES.AUDIT,
    SHEET_NAMES.EMAIL_LOG,
    SHEET_NAMES.ATTACHMENTS,
  ];

  var done = [], skipped = [];

  sheetsToProtect.forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) { skipped.push(name); return; }

    // Remove any existing sheet-level protections first (clean slate)
    sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET)
         .forEach(function (p) { p.remove(); });

    // Protect the whole sheet
    var prot = sheet.protect()
      .setDescription("Secret Ingredient App — use the web app to make changes");

    // Remove all editors from the exception list (only the owner is always exempt)
    var editors = prot.getEditors();
    if (editors.length) prot.removeEditors(editors);

    // Disable Workspace domain-wide editing if applicable
    try { if (prot.canDomainEdit()) prot.setDomainEdit(false); } catch (e) {}

    done.push(name);
    Logger.log("✅ Protected: " + name);
  });

  if (skipped.length) Logger.log("⚠ Not found, skipped: " + skipped.join(", "));
  Logger.log("setupSheetProtection complete. " + done.length + " sheet(s) protected.");
  return { success: true, protected: done, skipped: skipped };
}

/**
 * Diagnostic — run any time to see current access and protection state.
 * Results appear in Apps Script → Execution log.
 */
function auditSheetAccess() {
  var ss = getSpreadsheet();
  Logger.log("════ SHEET ACCESS AUDIT ════");
  Logger.log("Spreadsheet : " + ss.getName());
  try { Logger.log("Owner       : " + ss.getOwner().getEmail()); } catch (e) {}

  var editors = ss.getEditors();
  Logger.log("Editors (" + editors.length + "):");
  editors.forEach(function (u) { Logger.log("  • " + u.getEmail()); });

  Logger.log("");
  Logger.log("Sheet protections:");
  ss.getSheets().forEach(function (sheet) {
    var prots = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    if (prots.length === 0) {
      Logger.log("  ⚠  " + sheet.getName() + " — UNPROTECTED");
    } else {
      var exceptions = prots[0].getEditors().map(function (u) { return u.getEmail(); });
      Logger.log("  🔒 " + sheet.getName() + " — Protected" +
        (exceptions.length ? " | Exceptions: " + exceptions.join(", ") : " | Owner-only"));
    }
  });
  Logger.log("════ END AUDIT ════");
}

// =============================================================================
//  onEdit  (installable trigger — SECOND LAYER of defence)
//
//  This trigger fires on every direct cell edit in the spreadsheet.
//  It dispatches to a sheet-specific handler that:
//    • Admins    → allowed on all sheets
//    • Team Leaders → allowed on their lead project's tasks + project row
//    • Team Members → allowed only to edit Status/Notes of their own tasks
//    • Anyone else  → edit is reverted immediately
//
//  SETUP: This must run as an INSTALLABLE trigger (not a simple onEdit).
//  Go to Apps Script → Triggers → + Add Trigger → onEdit → From spreadsheet
//  → On edit. An installable trigger has the owner's OAuth scope which is
//  needed to read the Teams sheet and modify sharing.
// =============================================================================

function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var sheetName = e.range.getSheet().getName();

    // Teams sheet: auto-grant editor access when an email is typed in directly
    if (sheetName === SHEET_NAMES.TEAMS)    { _onEditTeams_(e);    return; }

    // Tasks / Projects: validate against the app's authorisation rules
    if (sheetName === SHEET_NAMES.TASKS)    { _onEditTasks_(e);    return; }
    if (sheetName === SHEET_NAMES.PROJECTS) { _onEditProjects_(e); return; }

    // All other sheets (Clients, Audit, EmailLog, Attachments) — Admin-only direct edits
    _revertIfNotAdmin_(e);
  } catch (err) {
    Logger.log("onEdit error: " + (err && err.message ? err.message : err));
  }
}

// ── Handler: Teams sheet ──────────────────────────────────────────────────────
// Preserved from original: auto-grant editor access when email column is edited.

function _onEditTeams_(e) {
  try {
    var sheet = e.range.getSheet();
    if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var emailCol = _findHeaderIndex_(headers, "email"); // 0-based
    if (emailCol === -1) return;
    if (e.range.getColumn() !== emailCol + 1) return;
    var email = (e.value || "").toString().trim();
    if (!email || !_isValidEmail_(email)) return;
    _grantEditorAccess_(email);
  } catch (err) {
    Logger.log("_onEditTeams_ error: " + err.message);
  }
}

// ── Handler: Tasks sheet ──────────────────────────────────────────────────────
//  Admin        : can edit any cell
//  Team Leader  : can edit any cell in tasks belonging to their lead projects;
//                 can also edit tasks assigned to themselves
//  Team Member  : can edit ONLY Status (col 6) and Notes (col 8) of their own tasks
//  Anyone else  : edit reverted

function _onEditTasks_(e) {
  var editorEmail = _getEditorEmail_(e);
  if (!editorEmail) { _revertEdit_(e, "anonymous editor on Tasks"); return; }

  var member = _findTeamMemberByEmail_(editorEmail);
  if (!member) { _revertEdit_(e, "not registered in Teams"); return; }

  var role = _normaliseRole(member.role);
  if (role === "Admin") return; // full access

  var row = e.range.getRow();
  if (row === 1) { _revertEdit_(e, "attempted header edit on Tasks"); return; }

  // Read the task row to check ownership
  var sheet = e.range.getSheet();
  var lastCol = Math.max(sheet.getLastColumn(), 18);
  var taskRow  = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
  var projectId  = String(taskRow[TASK_COL.PROJECT_ID]  || "");
  var assignedTo = String(taskRow[TASK_COL.ASSIGNED_TO] || "").trim().toLowerCase();
  var isAssignee = (assignedTo === member.name.toLowerCase());

  if (role === "Team Leader") {
    // TL can edit any task in projects they lead
    if (_isProjectLeadServer_(projectId, { email: editorEmail })) return;
    // TL can also update tasks assigned to themselves in other projects
    if (isAssignee) return;
    _revertEdit_(e, "TL is not lead of project " + projectId);
    return;
  }

  if (role === "Team Member") {
    if (!isAssignee) { _revertEdit_(e, "TM editing someone else's task"); return; }
    // Team Members may only change Status and Notes
    var editedCol = e.range.getColumn() - 1; // convert to 0-based TASK_COL index
    var allowed   = [TASK_COL.STATUS, TASK_COL.NOTES];
    if (allowed.indexOf(editedCol) === -1) {
      _revertEdit_(e, "TM tried to edit col " + editedCol + " (only Status/Notes allowed)");
      return;
    }
    return;
  }

  _revertEdit_(e, "unrecognised role: " + role);
}

// ── Handler: Projects sheet ───────────────────────────────────────────────────
//  Admin        : can edit any cell
//  Team Leader  : can edit any cell in their own lead project row
//  Team Member  : no direct project edits allowed

function _onEditProjects_(e) {
  var editorEmail = _getEditorEmail_(e);
  if (!editorEmail) { _revertEdit_(e, "anonymous editor on Projects"); return; }

  var member = _findTeamMemberByEmail_(editorEmail);
  if (!member) { _revertEdit_(e, "not registered in Teams"); return; }

  var role = _normaliseRole(member.role);
  if (role === "Admin") return;

  var row = e.range.getRow();
  if (row === 1) { _revertEdit_(e, "attempted header edit on Projects"); return; }

  if (role === "Team Leader") {
    var sheet  = e.range.getSheet();
    var lastCol = Math.max(sheet.getLastColumn(), 13);
    var projRow  = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
    var projId   = String(projRow[PROJ_COL.ID] || "");
    if (_isProjectLeadServer_(projId, { email: editorEmail })) return;
    _revertEdit_(e, "TL is not lead of project " + projId);
    return;
  }

  _revertEdit_(e, "Team Member cannot edit Projects directly");
}

// ── Handler: all other sheets (Clients, Audit, EmailLog, Attachments) ─────────

function _revertIfNotAdmin_(e) {
  var editorEmail = _getEditorEmail_(e);
  var member = editorEmail ? _findTeamMemberByEmail_(editorEmail) : null;
  if (!member || _normaliseRole(member.role) !== "Admin") {
    _revertEdit_(e, "non-Admin direct edit on " + e.range.getSheet().getName());
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Returns the editing user's email (lowercased), or '' if unavailable. */
function _getEditorEmail_(e) {
  try { return (e.user && e.user.email) ? e.user.email.trim().toLowerCase() : ""; }
  catch (err) { return ""; }
}

/**
 * Looks up a team member by email in the Teams sheet (raw read, no cache).
 * Returns { id, name, role } or null if not found.
 */
function _findTeamMemberByEmail_(emailLower) {
  try {
    var data = getSheet(SHEET_NAMES.TEAMS).getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      if (String(data[i][3] || "").trim().toLowerCase() === emailLower) {
        return {
          id:   String(data[i][0]),
          name: String(data[i][1] || ""),
          role: String(data[i][2] || ""),
        };
      }
    }
  } catch (err) {
    Logger.log("_findTeamMemberByEmail_ error: " + err.message);
  }
  return null;
}

/**
 * Reverts a cell (or clears a range) to its pre-edit value and logs the attempt.
 * For single-cell edits: e.oldValue is the previous value (may be undefined for blank).
 * For multi-cell pastes: range is cleared (protection should have caught this first).
 */
function _revertEdit_(e, reason) {
  try {
    var range      = e.range;
    var userEmail  = _getEditorEmail_(e) || "unknown";
    var sheetName  = range.getSheet().getName();

    if (range.getNumRows() === 1 && range.getNumColumns() === 1) {
      // Single cell — restore old value precisely
      range.setValue(e.oldValue !== undefined ? e.oldValue : "");
    } else {
      // Multi-cell paste — clear the pasted content
      // (We can't recover individual old values; protection is the real guard here)
      range.clearContent();
    }

    Logger.log(
      "⚠ DIRECT EDIT BLOCKED" +
      " | user=" + userEmail +
      " | sheet=" + sheetName +
      " | range=" + range.getA1Notation() +
      (reason ? " | reason=" + reason : "")
    );
  } catch (err) {
    Logger.log("_revertEdit_ error: " + err.message);
  }
}

/**
 * OPTIONAL: Run manually to grant access to all emails already present in Teams sheet.
 * Useful after you add many rows at once.
 */
function syncTeamEditors() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("Teams");
  if (!sheet) throw new Error('Sheet "Teams" not found.');

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  var headers = data[0];
  var emailCol = _findHeaderIndex_(headers, "email");
  if (emailCol === -1)
    throw new Error('Column header "Email" not found in Teams sheet.');

  var emails = {};
  for (var i = 1; i < data.length; i++) {
    var email = (data[i][emailCol] || "").toString().trim();
    if (email && _isValidEmail_(email)) emails[email.toLowerCase()] = email;
  }

  Object.keys(emails).forEach(function (k) {
    _grantEditorAccess_(emails[k]);
  });

  Logger.log("syncTeamEditors complete.");
}

/** Finds a header name (case-insensitive, trimmed). Returns 0-based index or -1. */
function _findHeaderIndex_(headers, nameLower) {
  nameLower = (nameLower || "").toString().trim().toLowerCase();
  for (var i = 0; i < headers.length; i++) {
    if ((headers[i] || "").toString().trim().toLowerCase() === nameLower)
      return i;
  }
  return -1;
}

/** Basic email validation */
function _isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").toString().trim());
}

// =============================================================================
//  CACHE RESET  — run clearAllCaches() from the Apps Script editor any time
//
//  Clears EVERY cache layer so the app re-reads fresh data from the sheet:
//    • CacheService.getScriptCache()  — shared 5-min app data cache
//    • CacheService.getUserCache()    — per-user 5-min auth cache (all users)
//    • PropertiesService.getUserProperties() — 4-hour auth persistence
//    • PropertiesService.getScriptProperties() — any script-level stored values
//
//  When to run:
//    ✅ After changing SPREADSHEET_ID to a new sheet
//    ✅ After adding / removing / changing team member emails or roles
//    ✅ When the app is serving stale or duplicate data
//    ✅ After cleaning up duplicate rows in the sheet
// =============================================================================

function clearAllCaches() {
  var cleared = [];

  // 1. Script-level cache (shared across all users — holds projects, tasks, etc.)
  try {
    CacheService.getScriptCache().removeAll([
      'projects', 'tasks', 'clients', 'teams',
      'PROJ', 'TASK', 'CLI', 'TEAM',           // alternate key forms
    ]);
    // Nuclear option: flush everything in one shot
    CacheService.getScriptCache().removeAll(Object.keys(
      CacheService.getScriptCache().getAll(['projects','tasks','clients','teams']) || {}
    ));
    cleared.push('ScriptCache');
  } catch (e) {
    Logger.log('ScriptCache clear (non-fatal): ' + e.message);
  }

  // 2. Per-user cache and properties for the RUNNING user (the admin clearing caches)
  try {
    CacheService.getUserCache().remove('auth_v5');
    cleared.push('UserCache.auth_v5');
  } catch (e) {
    Logger.log('UserCache clear (non-fatal): ' + e.message);
  }

  try {
    PropertiesService.getUserProperties().deleteProperty('auth_v5');
    cleared.push('UserProperties.auth_v5');
  } catch (e) {
    Logger.log('UserProperties clear (non-fatal): ' + e.message);
  }

  // 3. Script properties (any cached IDs or config stored by Attachments.gs etc.)
  try {
    var sp = PropertiesService.getScriptProperties();
    var all = sp.getProperties();
    // Only delete cache-style keys, not permanent config like DRIVE_FOLDER_ID
    Object.keys(all).forEach(function(k) {
      if (k.indexOf('cache_') === 0 || k.indexOf('CACHE_') === 0) {
        sp.deleteProperty(k);
        cleared.push('ScriptProperties.' + k);
      }
    });
  } catch (e) {
    Logger.log('ScriptProperties clear (non-fatal): ' + e.message);
  }

  Logger.log('✅ clearAllCaches complete. Cleared: ' + cleared.join(', '));
  Logger.log('ℹ️  Other users\' auth caches (UserCache / UserProperties) will expire');
  Logger.log('   naturally within 5 min (UserCache) and 4 hours (UserProperties).');
  Logger.log('   Ask team members to do a hard refresh (Ctrl+Shift+R) to force re-auth.');
  return { success: true, cleared: cleared };
}

// =============================================================================
//  TRIGGER SETUP  — run this once after changing SPREADSHEET_ID
//
//  Removes all existing onEdit triggers and creates a fresh one pointing at
//  the spreadsheet currently set in SPREADSHEET_ID. This is needed whenever
//  you switch to a new Google Sheet.
// =============================================================================

function setupTrigger() {
  // 1. Delete any existing onEdit triggers for this script
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "onEdit") {
      ScriptApp.deleteTrigger(t);
      Logger.log("Deleted old onEdit trigger.");
    }
  });

  // 2. Create a fresh installable onEdit trigger for the new spreadsheet
  ScriptApp.newTrigger("onEdit")
    .forSpreadsheet(getSpreadsheet())
    .onEdit()
    .create();

  Logger.log("✅ onEdit trigger created for: " + getSpreadsheet().getName() +
             " (" + getSpreadsheet().getId() + ")");
  return { success: true };
}

// =============================================================================
//  PUBLIC PERT SHARE  — TEMPORARILY DISABLED
//  Uncomment this entire section to re-enable PERT chart sharing.
// =============================================================================

/*
function generatePertLink(projectId) {
  _requireRole(['Admin', 'Team Leader']);
  if (!projectId) throw new Error('Project ID required');
  var token = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('pert_' + token, projectId);
  var url = ScriptApp.getService().getUrl() + '?pert=' + token;
  Logger.log('PERT link generated for project ' + projectId + ' | token: ' + token);
  return { success: true, url: url };
}

function _servePertShare_(token) {
  var projectId = PropertiesService.getScriptProperties().getProperty('pert_' + token);
  if (!projectId) {
    return HtmlService.createHtmlOutput(
      '<!doctype html><html><head><meta charset="UTF-8">' +
      '<title>Link Not Found — Secret Ingredient</title>' +
      '<style>*{box-sizing:border-box}body{font-family:sans-serif;display:flex;align-items:center;' +
      'justify-content:center;min-height:100vh;margin:0;background:#f1f5f9}' +
      '.box{text-align:center;padding:48px 40px;background:#fff;border-radius:16px;' +
      'box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:420px;width:100%}' +
      'h2{color:#dc2626;margin:0 0 12px;font-size:22px}p{color:#6b7280;margin:0;line-height:1.6}</style></head>' +
      '<body><div class="box"><div style="font-size:48px;margin-bottom:16px">&#128683;</div>' +
      '<h2>Link Not Found</h2>' +
      '<p>This PERT share link is invalid or has expired.<br>Ask the project team to generate a new link.</p>' +
      '</div></body></html>'
    ).setTitle('PERT Chart — Not Found');
  }
  var tpl = HtmlService.createTemplateFromFile('PertShare');
  tpl.pertToken = token;
  tpl.projectId = projectId;
  return tpl.evaluate()
    .setTitle('PERT Chart — Secret Ingredient')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getPertShareData(token) {
  if (!token) return { error: 'No token provided' };
  var projectId = PropertiesService.getScriptProperties().getProperty('pert_' + token);
  if (!projectId) return { error: 'Invalid or expired link' };

  var projSheet = getSheet(SHEET_NAMES.PROJECTS);
  var taskSheet = getSheet(SHEET_NAMES.TASKS);
  if (!projSheet || !taskSheet) return { error: 'Data unavailable — please contact the project team' };

  var projData = sheetDisplayValues(projSheet);
  var project  = null;
  for (var i = 1; i < projData.length; i++) {
    if (String(projData[i][PROJ_COL.ID]) === projectId) {
      project = {
        id:        String(projData[i][PROJ_COL.ID]        || ''),
        name:      String(projData[i][PROJ_COL.NAME]       || ''),
        client:    String(projData[i][PROJ_COL.CLIENT]     || ''),
        startDate: String(projData[i][PROJ_COL.START_DATE] || ''),
        deadline:  String(projData[i][PROJ_COL.DEADLINE]   || ''),
        status:    String(projData[i][PROJ_COL.STATUS]     || ''),
        manager:   String(projData[i][PROJ_COL.MANAGER]    || ''),
        teamLead:  String(projData[i][PROJ_COL.TEAM_LEAD]  || ''),
      };
      break;
    }
  }
  if (!project) return { error: 'Project not found' };

  var taskData = sheetDisplayValues(taskSheet);
  var tasks    = [];
  for (var i = 1; i < taskData.length; i++) {
    if (!taskData[i][TASK_COL.ID]) continue;
    if (String(taskData[i][TASK_COL.PROJECT_ID]) !== projectId) continue;
    tasks.push({
      id:             String(taskData[i][TASK_COL.ID]              || ''),
      name:           String(taskData[i][TASK_COL.NAME]            || ''),
      assignedTo:     String(taskData[i][TASK_COL.ASSIGNED_TO]     || ''),
      dueDate:        String(taskData[i][TASK_COL.DUE_DATE]        || ''),
      status:         String(taskData[i][TASK_COL.STATUS]          || ''),
      priority:       String(taskData[i][TASK_COL.PRIORITY]        || ''),
      approvalStatus: String(taskData[i][TASK_COL.APPROVAL_STATUS] || ''),
    });
  }
  return { project: project, tasks: tasks };
}
*/