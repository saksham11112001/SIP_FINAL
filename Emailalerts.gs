// ─── LOGO INLINE IMAGE ───────────────────────────────────────────────────────
// Embedded as a CID inline image so all email clients (Gmail, Outlook, Apple
// Mail) render it reliably. Base64 data → Blob → passed via inlineImages param.
var _LOGO_B64_ =
  "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";

function _getLogoBlob_() {
  var bytes = Utilities.base64Decode(_LOGO_B64_);
  return Utilities.newBlob(bytes, "image/png", "si-logo.png");
}

// =============================================================================
//  EmailAlerts.gs  |  Intelligent Email Reminder + Escalation Engine
//
//  TRIGGER SCHEDULE (configure once via setupAllEmailTriggers()):
//    • sendDailyReminders()   → Every day at 9:00 AM
//    • sendWeeklySummary()    → Every Monday at 7:00 AM
//
//  REMINDER LOGIC:
//    A) Task due within 0–7 days  → DAILY reminder to assignee
//    B) Task due in 8+ days       → WEEKLY reminder to assignee (Mondays only)
//    C) Task 2+ days overdue      → ONE-TIME escalation to Team Leader + Manager
//
//  DEDUPLICATION (EmailLog sheet):
//    Every sent email is logged as: TaskID | EmailType | Recipient | SentDate
//    Before sending, the log is checked — no duplicate on same day/type/recipient.
//    Escalation: logged once so it never fires again for the same task.
//
//  SAFETY GUARDS (all checked before any send):
//    • status === 'Completed'        → skip
//    • missing dueDate               → skip
//    • project.status === 'On Hold'  → skip (no reminder, no escalation)
//
//  EMAIL_LOG SHEET COLUMNS:
//    1: Task ID  |  2: Email Type  |  3: Recipient  |  4: Sent Date  |  5: Notes
// =============================================================================

var EMAIL_CONFIG = {
  APP_NAME: "Secret Ingredient — Project Tracker",
  BRAND_COLOR: "#1e3a5f",
  ACCENT: "#3182ce",
  TIMEZONE: Session.getScriptTimeZone(),
};

// =============================================================================
//  TRIGGER MANAGEMENT
// =============================================================================

/**
 * Run ONCE from the Apps Script editor to register all automated triggers.
 * Safely removes any existing email triggers first to prevent duplicates.
 */
function setupAllEmailTriggers() {
  _clearEmailTriggers_();

  ScriptApp.newTrigger("sendDailyReminders")
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  ScriptApp.newTrigger("sendWeeklySummary")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(7)
    .create();

  // Watchdog: runs every 6 hours and alerts admins if the daily trigger has gone silent
  ScriptApp.newTrigger("checkEmailTriggerHealth")
    .timeBased()
    .everyHours(6)
    .create();

  Logger.log(
    "✅ Triggers created: sendDailyReminders (9am daily), sendWeeklySummary (Mon 7am), checkEmailTriggerHealth (every 6h)",
  );
  return { success: true, message: "Email triggers configured successfully." };
}

function removeAllEmailTriggers() {
  var n = _clearEmailTriggers_();
  return { success: true, message: "Removed " + n + " trigger(s)." };
}

function getEmailTriggerStatus() {
  var fns = ["sendDailyReminders", "sendWeeklySummary", "checkEmailTriggerHealth"];
  var active = {};
  fns.forEach(function (fn) { active[fn] = false; });
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (active.hasOwnProperty(t.getHandlerFunction()))
      active[t.getHandlerFunction()] = true;
  });
  return {
    triggers: active,
    allActive: fns.every(function (fn) { return active[fn]; }),
  };
}

// =============================================================================
//  WATCHDOG — checkEmailTriggerHealth()
//
//  Runs every 6 hours (registered by setupAllEmailTriggers).
//  Reads the AuditLog directly (no cache) to find the most recent
//  DAILY_REMINDERS entry. If none exists in the last 26 hours AND it is
//  already past 10:00 AM (meaning the 9 AM trigger should have fired),
//  sends an alert email to all Admins.
//
//  This catches:
//    • OAuth token expiration      (trigger fails before any code runs)
//    • Silent runtime crashes      (trigger ran but threw an unhandled error)
//    • Trigger accidentally deleted
//    • Any other silent failure
//
//  NOTE: Because the watchdog and the main triggers share the same OAuth
//  token, if OAuth fully expires the watchdog will also fail — at that
//  point Google itself sends an authorization-failure email to the script
//  owner. Enable that in Apps Script → Project Settings → Notifications.
// =============================================================================

function checkEmailTriggerHealth() {
  try {
    var now = new Date();
    var hour = now.getHours(); // script timezone

    // Only check after 10 AM — the 9 AM trigger should have run by then.
    if (hour < 10) return;

    // Read AuditLog directly (no cache — must be raw for reliability).
    var ss     = SpreadsheetApp.openById(SPREADSHEET_ID);
    var audit  = ss.getSheetByName(SHEET_NAMES.AUDIT);
    if (!audit) return;

    var rows = audit.getDataRange().getValues();
    var cutoff = new Date(now.getTime() - 26 * 60 * 60 * 1000); // 26 hours ago

    // Search backwards for the most recent DAILY_REMINDERS entry.
    var lastRun = null;
    for (var i = rows.length - 1; i >= 1; i--) {
      // AuditLog columns: Timestamp | User | Action | Entity | ID | Notes
      // logAudit() action is "DAILY_REMINDERS"
      if (String(rows[i][2] || '').trim() === 'DAILY_REMINDERS') {
        var ts = rows[i][0];
        lastRun = ts instanceof Date ? ts : new Date(ts);
        break;
      }
    }

    if (!lastRun || lastRun < cutoff) {
      var missedHours = lastRun
        ? Math.round((now - lastRun) / 3600000)
        : null;
      _sendAdminErrorAlert_(
        "sendDailyReminders (MISSED RUN)",
        lastRun
          ? "The daily email trigger has not run in " + missedHours + " hours. Last run: " + lastRun.toLocaleString() + ". This usually means the OAuth token has expired or the trigger was deleted."
          : "No DAILY_REMINDERS entry found in the AuditLog at all. The trigger may never have run or the log may have been cleared."
      );
    }
  } catch (e) {
    Logger.log("checkEmailTriggerHealth error: " + e.message);
    // Do not recurse into _sendAdminErrorAlert_ here — avoid alert loops.
  }
}

// =============================================================================
//  ADMIN ERROR ALERT
//
//  Reads the Teams sheet RAW (no cache, no helper functions) so it works
//  even when the cache layer, getCurrentUser(), or other utilities are broken.
//  Sends a styled HTML email to every Admin on the team.
// =============================================================================

// Alert emails go to this address only — change here if needed.
var ALERT_RECIPIENT = 'saksham.gpt2001@gmail.com';

function _sendAdminErrorAlert_(fnName, errMsg) {
  try {
    var now     = new Date();
    var timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd MMM yyyy, hh:mm a");
    var subject = '🚨 SI Tracker Alert: Automated trigger failed — ' + fnName;

    var body =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:0;background:#f1f5f9;font-family:Helvetica Neue,Arial,sans-serif;">' +
      '<div style="max-width:620px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">' +

      // Header
      '<div style="background:linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%);padding:24px 28px 20px;">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">' +
      '<img src="cid:siLogo" alt="SI" style="width:40px;height:40px;border-radius:10px;">' +
      '<div>' +
      '<div style="color:rgba(255,255,255,.65);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">Secret Ingredient</div>' +
      '<div style="color:#fff;font-size:14px;font-weight:700;">Project Tracker — System Alert</div>' +
      '</div></div>' +
      '<h1 style="color:#fff;font-size:17px;font-weight:700;margin:0 0 4px;">🚨 Automated Trigger Failed</h1>' +
      '<p style="color:rgba(255,255,255,.75);font-size:12px;margin:0;">Detected at ' + timeStr + '</p>' +
      '</div>' +

      // Body
      '<div style="padding:24px 28px;">' +

      // Alert box
      '<div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">' +
      '<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#991b1b;">Function: <code style="background:#fee2e2;padding:2px 7px;border-radius:4px;font-size:12px;">' + fnName + '</code></p>' +
      '<p style="margin:0;font-size:13px;color:#7f1d1d;line-height:1.6;">' + (errMsg || 'An unknown error occurred.') + '</p>' +
      '</div>' +

      // Fix steps
      '<h3 style="font-size:13px;font-weight:700;color:#1a202c;margin:0 0 10px;">How to fix this</h3>' +
      '<ol style="margin:0 0 20px;padding-left:20px;font-size:13px;color:#374151;line-height:1.9;">' +
      '<li>Open the <strong>Apps Script editor</strong> for the SI Tracker project.</li>' +
      '<li>Select the function <code style="background:#f1f5f9;padding:1px 6px;border-radius:4px;">getEmailTriggerStatus</code> from the dropdown and click <strong>Run</strong>.</li>' +
      '<li>If Google shows an <strong>authorization / permissions</strong> dialog — click <strong>Allow</strong>. This refreshes the OAuth token.</li>' +
      '<li>Then select <code style="background:#f1f5f9;padding:1px 6px;border-radius:4px;">setupAllEmailTriggers</code> and click <strong>Run</strong> to re-register the triggers.</li>' +
      '<li>Check the <strong>Triggers panel</strong> (clock icon) and confirm both triggers appear with a recent "Last run" time.</li>' +
      '</ol>' +

      // Why box
      '<div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;">' +
      '<p style="margin:0;font-size:12px;color:#78350f;line-height:1.65;">' +
      '<strong>Why does this happen?</strong> Google periodically revokes Apps Script OAuth tokens, especially after a script update or redeployment. ' +
      'Time-based triggers fail silently when this occurs. Re-running <code>setupAllEmailTriggers</code> creates fresh triggers with a valid token.' +
      '</p></div>' +
      '</div>' + // end body padding

      // Footer
      '<div style="background:#f7fafc;padding:14px 28px;border-top:1px solid #e2e8f0;">' +
      '<p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">' +
      'Automated alert from Secret Ingredient Project Tracker &mdash; do not reply.' +
      '</p></div>' +
      '</div></body></html>';

    MailApp.sendEmail({
      to: ALERT_RECIPIENT,
      subject: subject,
      htmlBody: body,
      inlineImages: { siLogo: _getLogoBlob_() },
    });

    Logger.log('Admin error alert sent to: ' + ALERT_RECIPIENT);
  } catch (e) {
    // If even the alert email fails, log it — nothing more we can do from here.
    Logger.log('_sendAdminErrorAlert_ itself failed: ' + e.message);
  }
}

function _clearEmailTriggers_() {
  // Remove all known trigger names (includes legacy names for safe migration)
  var known = [
    "sendDailyReminders",
    "sendWeeklySummary",
    "checkEmailTriggerHealth",
    "sendMorningDigest",
    "sendOverdueAlert", // legacy — safe to clear
    "sendBulkPendingTasksEmail",
  ];
  var count = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (known.indexOf(t.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(t);
      count++;
    }
  });
  return count;
}

// =============================================================================
//  EMAIL LOG — deduplication via EmailLog sheet
//  Columns: Task ID | Email Type | Recipient | Sent Date | Notes
// =============================================================================

/**
 * Load entire EmailLog into a memory map keyed by "taskId|emailType|recipient|dateStr".
 * Returns {} on any error so we fail-open (send rather than silently block).
 */
function _loadEmailLog_() {
  try {
    var sheet = getSheet(SHEET_NAMES.EMAIL_LOG);
    if (!sheet) return {};
    var rows = sheet.getDataRange().getValues();
    var log = {};
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (!r[0]) continue;
      var key = [
        String(r[0]).trim(), // Task ID
        String(r[1]).trim(), // Email Type
        String(r[2]).trim().toLowerCase(), // Recipient email
        String(r[3]).trim(), // Sent Date yyyy-MM-dd
      ].join("|");
      log[key] = true;
    }
    return log;
  } catch (e) {
    Logger.log("_loadEmailLog_ error: " + e.message);
    return {};
  }
}

/** Returns true if this exact (task, type, recipient, date) combo already exists in the log. */
function _alreadySent_(log, taskId, emailType, recipEmail, todayStr) {
  var key = [
    String(taskId).trim(),
    String(emailType).trim(),
    String(recipEmail).trim().toLowerCase(),
    todayStr,
  ].join("|");
  return !!log[key];
}

/**
 * Append one row to EmailLog and update the in-memory map simultaneously
 * so duplicate guards work even within the same execution.
 */
function _logEmailSent_(log, taskId, emailType, recipEmail, todayStr, notes) {
  try {
    var key = [
      String(taskId).trim(),
      String(emailType).trim(),
      String(recipEmail).trim().toLowerCase(),
      todayStr,
    ].join("|");
    log[key] = true; // mark in-memory immediately
    var sheet = getSheet(SHEET_NAMES.EMAIL_LOG);
    if (sheet)
      sheet.appendRow([taskId, emailType, recipEmail, todayStr, notes || ""]);
  } catch (e) {
    Logger.log("_logEmailSent_ error: " + e.message);
  }
}

// =============================================================================
//  HELPER BUILDERS
// =============================================================================

function _buildNameMap_(teams) {
  var map = {};
  teams.forEach(function (m) {
    map[(m.name || "").trim().toLowerCase()] = m;
  });
  return map;
}

function _buildEmailMap_(teams) {
  var map = {};
  teams.forEach(function (m) {
    var k = (m.email || "").trim().toLowerCase();
    if (k) map[k] = m;
  });
  return map;
}

/** Resolve a member's email from their display name using nameMap, with fallback to emailMap. */
function _resolveAssigneeEmail_(assignedTo, nameMap, emailMap) {
  if (!assignedTo) return "";
  var member = nameMap[(assignedTo || "").trim().toLowerCase()];
  if (member && member.email) return member.email.trim().toLowerCase();
  // assignedTo might itself be an email address
  var lc = (assignedTo || "").trim().toLowerCase();
  return emailMap[lc] && emailMap[lc].email
    ? emailMap[lc].email.trim().toLowerCase()
    : "";
}

/** Build projectId → project object lookup. */
function _buildProjectMap_(projects) {
  var map = {};
  projects.forEach(function (p) {
    map[p.id] = p;
  });
  return map;
}

/** Build projectId → true lookup for On Hold projects. */
function _buildOnHoldSet_(projects) {
  var set = {};
  projects.forEach(function (p) {
    if (p.status === "On Hold") set[p.id] = true;
  });
  return set;
}

/**
 * Return list of unique team members to escalate to for a given project.
 * Includes: project's teamLead (if resolvable) + all Team Leaders.
 * Excludes: the task assignee (no point escalating to them).
 */
function _getEscalationRecipients_(project, teams, emailMap, excludeEmail) {
  var seen = {};
  var results = [];
  excludeEmail = (excludeEmail || "").trim().toLowerCase();

  // 1. Project-level team lead (stored as an email address in project.teamLead)
  if (project && project.teamLead) {
    var tlEmailKey = (project.teamLead || "").trim().toLowerCase();
    var tlMember = null;
    teams.forEach(function (m) {
      if ((m.email || "").trim().toLowerCase() === tlEmailKey) tlMember = m;
    });
    if (tlMember && tlMember.email) {
      var tlEmail = tlMember.email.trim().toLowerCase();
      if (tlEmail && tlEmail !== excludeEmail && !seen[tlEmail]) {
        seen[tlEmail] = true;
        results.push(tlMember);
      }
    }
  }

  // 2. All Admins in the team roster
  teams.forEach(function (m) {
    if (m.role !== "Admin") return;
    var e = (m.email || "").trim().toLowerCase();
    if (!e || e === excludeEmail || seen[e]) return;
    seen[e] = true;
    results.push(m);
  });

  return results;
}

/** Format a Date as yyyy-MM-dd string for log keys and display. */
function _ymd_(d) {
  var mm = ("0" + (d.getMonth() + 1)).slice(-2);
  var dd = ("0" + d.getDate()).slice(-2);
  return d.getFullYear() + "-" + mm + "-" + dd;
}

/** Human-readable today label for email subjects. */
function _todayLabel_() {
  return Utilities.formatDate(
    new Date(),
    EMAIL_CONFIG.TIMEZONE,
    "EEEE, dd MMM yyyy",
  );
}

// =============================================================================
//  MAIN DAILY TRIGGER  —  sendDailyReminders()
//  Runs every day at 9:00 AM.
//
//  Processes three email categories in one pass:
//    1. DAILY_REMINDER   — tasks due in 0–7 days → sent to assignee daily
//    2. WEEKLY_REMINDER  — tasks due in 8+ days  → sent to assignee on Mondays only
//    3. ESCALATION       — tasks 2+ days overdue → sent once to TL + Manager
// =============================================================================

function sendDailyReminders() {
  try {
    var teams = getTeams();
    var tasks = getTasks();
    var projects = getProjects();
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayStr = _ymd_(today);
    var isMonday = today.getDay() === 1;

    var nameMap = _buildNameMap_(teams);
    var emailMap = _buildEmailMap_(teams);
    var projectMap = _buildProjectMap_(projects);
    var onHoldSet = _buildOnHoldSet_(projects);
    var log = _loadEmailLog_();

    // Buckets: keyed by recipient email address → { member, tasks[] }
    var dailyBuckets = {}; // DAILY_REMINDER
    var weeklyBuckets = {}; // WEEKLY_REMINDER  (populated only if isMonday)
    var escalBuckets = {}; // ESCALATION

    tasks.forEach(function (task) {
      // ── Safety guards ──────────────────────────────────────────────────────
      if (!task.dueDate) return; // no due date — skip
      if (task.status === "Completed") return; // completed — skip
      if (onHoldSet[task.projectId]) return; // On Hold project — skip

      var dueDate = parseDateLoose_(task.dueDate);
      if (!dueDate) return;

      var daysLeft = Math.ceil((dueDate - today) / 86400000);
      var project = projectMap[task.projectId] || null;

      // Enrich task with computed context for email rendering
      var enriched = {
        id: task.id,
        name: task.name,
        projectId: task.projectId,
        projectName: project ? project.name || task.projectId : task.projectId,
        assignedTo: task.assignedTo || "—",
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority || "Medium",
        approvalStatus: task.approvalStatus || "",
        daysLeft: daysLeft,
      };

      var assigneeEmail = _resolveAssigneeEmail_(
        task.assignedTo,
        nameMap,
        emailMap,
      );

      // ── A) ESCALATION — 2+ days overdue ───────────────────────────────────
      if (daysLeft <= -2) {
        var escRecips = _getEscalationRecipients_(
          project,
          teams,
          emailMap,
          assigneeEmail,
        );
        escRecips.forEach(function (member) {
          var recipEmail = (member.email || "").trim().toLowerCase();
          if (!recipEmail) return;
          // Escalation uses todayStr so it fires daily until the task is completed.
          if (
            _alreadySent_(log, task.id, "ESCALATION", recipEmail, todayStr)
          )
            return;
          if (!escalBuckets[recipEmail])
            escalBuckets[recipEmail] = { member: member, tasks: [] };
          escalBuckets[recipEmail].tasks.push(enriched);
        });
      }

      // ── B) REMINDER — assignee must have a resolvable email ───────────────
      if (!assigneeEmail) return;

      if (daysLeft >= 0 && daysLeft <= 7) {
        // Due within 7 days → DAILY reminder
        if (
          _alreadySent_(log, task.id, "DAILY_REMINDER", assigneeEmail, todayStr)
        )
          return;
        if (!dailyBuckets[assigneeEmail]) {
          var m = emailMap[assigneeEmail] || {
            name: task.assignedTo,
            email: assigneeEmail,
          };
          dailyBuckets[assigneeEmail] = { member: m, tasks: [] };
        }
        dailyBuckets[assigneeEmail].tasks.push(enriched);
      } else if (daysLeft > 7 && isMonday) {
        // Due after 7 days, today is Monday → WEEKLY reminder
        if (
          _alreadySent_(
            log,
            task.id,
            "WEEKLY_REMINDER",
            assigneeEmail,
            todayStr,
          )
        )
          return;
        if (!weeklyBuckets[assigneeEmail]) {
          var wm = emailMap[assigneeEmail] || {
            name: task.assignedTo,
            email: assigneeEmail,
          };
          weeklyBuckets[assigneeEmail] = { member: wm, tasks: [] };
        }
        weeklyBuckets[assigneeEmail].tasks.push(enriched);
      }
    }); // end tasks.forEach

    // ── Send daily reminders ──────────────────────────────────────────────────
    var dailySent = 0;
    Object.keys(dailyBuckets).forEach(function (email) {
      var b = dailyBuckets[email];
      if (!b.tasks.length) return;
      try {
        _dispatchReminderEmail_(b.member, b.tasks, today, "DAILY");
        b.tasks.forEach(function (t) {
          _logEmailSent_(
            log,
            t.id,
            "DAILY_REMINDER",
            email,
            todayStr,
            t.projectName + " — " + t.name,
          );
        });
        dailySent++;
      } catch (e) {
        Logger.log("Daily reminder send error (" + email + "): " + e.message);
      }
    });

    // ── Send weekly reminders (Mondays only) ──────────────────────────────────
    var weeklySent = 0;
    if (isMonday) {
      Object.keys(weeklyBuckets).forEach(function (email) {
        var b = weeklyBuckets[email];
        if (!b.tasks.length) return;
        try {
          _dispatchReminderEmail_(b.member, b.tasks, today, "WEEKLY");
          b.tasks.forEach(function (t) {
            _logEmailSent_(
              log,
              t.id,
              "WEEKLY_REMINDER",
              email,
              todayStr,
              t.projectName + " — " + t.name,
            );
          });
          weeklySent++;
        } catch (e) {
          Logger.log(
            "Weekly reminder send error (" + email + "): " + e.message,
          );
        }
      });
    }

    // ── Send escalation emails ────────────────────────────────────────────────
    var escalSent = 0;
    Object.keys(escalBuckets).forEach(function (email) {
      var b = escalBuckets[email];
      if (!b.tasks.length) return;
      try {
        _dispatchEscalationEmail_(b.member, b.tasks, today);
        b.tasks.forEach(function (t) {
          _logEmailSent_(
            log,
            t.id,
            "ESCALATION",
            email,
            todayStr,
            "Escalated: " + t.projectName + " — " + t.name,
          );
        });
        escalSent++;
      } catch (e) {
        Logger.log("Escalation send error (" + email + "): " + e.message);
      }
    });

    logAudit(
      "EmailSystem",
      "DAILY_REMINDERS",
      "Email",
      "BULK",
      "Daily:" +
        dailySent +
        " Weekly:" +
        weeklySent +
        " Escalations:" +
        escalSent,
    );
  } catch (e) {
    Logger.log("sendDailyReminders CRITICAL: " + e.message);
    _sendAdminErrorAlert_("sendDailyReminders", e.message);
  }
}

// =============================================================================
//  WEEKLY SUMMARY  —  sendWeeklySummary()
//  Runs every Monday at 7:00 AM.
//  Sends a full team performance report to all Team Leaders.
// =============================================================================

function sendWeeklySummary() {
  try {
    var teams = getTeams();
    var perf = getTeamPerformance();
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var recipients = teams.filter(function (m) {
      return m.role === "Admin" && m.email;
    });
    if (!recipients.length) {
      Logger.log("sendWeeklySummary: no admins with email.");
      return;
    }
    recipients.forEach(function (member) {
      try {
        _dispatchWeeklySummaryEmail_(member, perf, teams, today);
      } catch (e) {
        Logger.log("Weekly summary error (" + member.name + "): " + e.message);
      }
    });
    logAudit(
      "EmailSystem",
      "WEEKLY_SUMMARY",
      "Email",
      "MANAGERS",
      "Weekly summary dispatched",
    );
  } catch (e) {
    Logger.log("sendWeeklySummary CRITICAL: " + e.message);
    _sendAdminErrorAlert_("sendWeeklySummary", e.message);
  }
}

// =============================================================================
//  EMAIL DISPATCH — DAILY / WEEKLY REMINDER
// =============================================================================

function _dispatchReminderEmail_(member, tasks, today, mode) {
  var isDaily = mode === "DAILY";
  var overdue = tasks.filter(function (t) {
    return t.daysLeft < 0;
  });
  var dueToday = tasks.filter(function (t) {
    return t.daysLeft === 0;
  });
  var upcoming = tasks.filter(function (t) {
    return t.daysLeft > 0;
  });

  var urgency = overdue.length > 0 ? "🚨" : dueToday.length > 0 ? "⏰" : "📋";
  var typeStr = isDaily ? "Daily Task Reminder" : "Weekly Task Reminder";
  var subject =
    urgency +
    " " +
    typeStr +
    " — " +
    tasks.length +
    " task" +
    (tasks.length !== 1 ? "s" : "") +
    (overdue.length > 0 ? " (" + overdue.length + " overdue)" : "");

  var body = _tplHeader_(member.name, typeStr);

  body += _tplIntro_(
    "You have <strong>" +
      tasks.length +
      " active task" +
      (tasks.length !== 1 ? "s" : "") +
      "</strong>" +
      (overdue.length > 0
        ? ' including <strong style="color:#dc2626;">' +
          overdue.length +
          " overdue</strong>"
        : dueToday.length > 0
          ? ' with <strong style="color:#d97706;">' +
            dueToday.length +
            " due today</strong>"
          : "") +
      ". Please review and take action.",
  );

  if (overdue.length)
    body += _tplTaskTable_(overdue, "⚠️ Overdue Tasks", "#fef2f2", "#dc2626");
  if (dueToday.length)
    body += _tplTaskTable_(dueToday, "⏰ Due Today", "#fffbeb", "#d97706");
  if (upcoming.length)
    body += _tplTaskTable_(
      upcoming,
      isDaily ? "📋 Due Within 7 Days" : "📅 Upcoming Tasks",
      "#eff6ff",
      "#3182ce",
    );

  body += _tplFooter_();
  MailApp.sendEmail({
    to: member.email,
    subject: subject,
    htmlBody: body,
    inlineImages: { siLogo: _getLogoBlob_() },
  });
}

// =============================================================================
//  EMAIL DISPATCH — ESCALATION
// =============================================================================

function _dispatchEscalationEmail_(recipient, tasks, today) {
  var subject =
    "🔴 Escalation Alert: " +
    tasks.length +
    " overdue task" +
    (tasks.length !== 1 ? "s" : "") +
    " require action";

  var body = _tplHeader_(recipient.name, "Escalation Alert — Action Required");

  body += _tplIntro_(
    "The following task" +
      (tasks.length !== 1 ? "s have" : " has") +
      ' been <strong style="color:#dc2626;">overdue for 2 or more days</strong> ' +
      "and require" +
      (tasks.length !== 1 ? "" : "s") +
      " your immediate attention. " +
      "Please follow up with the assigned team member" +
      (tasks.length !== 1 ? "s" : "") +
      ".",
  );

  body += _tplTaskTable_(
    tasks,
    "🔴 Escalated — Overdue Tasks",
    "#fef2f2",
    "#dc2626",
  );

  body +=
    '<div style="margin:16px 20px 20px;padding:14px 18px;background:#fff7ed;' +
    'border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;">' +
    '<p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">' +
    "<strong>Recommended Action:</strong> Contact the assignee, assess blockers, " +
    "and either resolve or formally reschedule the task in the tracker." +
    "</p></div>";

  body += _tplFooter_();
  MailApp.sendEmail({
    to: recipient.email,
    subject: subject,
    htmlBody: body,
    inlineImages: { siLogo: _getLogoBlob_() },
  });
}

// =============================================================================
//  EMAIL DISPATCH — WEEKLY SUMMARY
// =============================================================================

function _dispatchWeeklySummaryEmail_(manager, perf, teams, today) {
  var subject = "📊 Weekly Team Summary — " + _todayLabel_();

  var totalTasks = perf.reduce(function (s, m) {
    return s + m.totalTasks;
  }, 0);
  var totalApproved = perf.reduce(function (s, m) {
    return s + m.approvedTasks;
  }, 0);
  var totalOverdue = perf.reduce(function (s, m) {
    return s + m.overdueTasks;
  }, 0);
  var overallRate =
    totalTasks > 0 ? Math.round((totalApproved / totalTasks) * 100) : 0;

  var body = _tplHeader_(manager.name, "Weekly Team Performance Summary");

  body += _tplIntro_("Here is the weekly performance snapshot for your team.");

  // KPI stat row
  body +=
    '<div style="display:flex;gap:12px;margin:0 20px 20px;flex-wrap:wrap;">';
  body += _tplStatBox_("Total Tasks", totalTasks, "#dbeafe", "#1e40af");
  body += _tplStatBox_("Approved", totalApproved, "#d1fae5", "#065f46");
  body += _tplStatBox_("Team Members", teams.length, "#f3e8ff", "#6b21a8");
  body += "</div>";

  // Individual performance table
  body += '<div style="margin:0 20px 20px;">';
  body +=
    '<h3 style="font-size:14px;font-weight:700;color:#1a202c;margin:0 0 10px;">Individual Performance</h3>';
  body += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
  body +=
    '<tr style="background:#f7fafc;">' +
    '<th style="padding:10px 14px;text-align:left;border-bottom:2px solid #e2e8f0;color:#4a5568;">Member</th>' +
    '<th style="padding:10px;text-align:center;border-bottom:2px solid #e2e8f0;color:#4a5568;">Total</th>' +
    '<th style="padding:10px;text-align:center;border-bottom:2px solid #e2e8f0;color:#4a5568;">Done</th>' +
    "</tr>";

  perf
    .sort(function (a, b) {
      return b.approvedTasks - a.approvedTasks;
    })
    .forEach(function (m, idx) {
      var bg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
      body +=
        '<tr style="background:' +
        bg +
        ';">' +
        '<td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;">' +
        m.name +
        "</td>" +
        '<td style="padding:10px;text-align:center;border-bottom:1px solid #e2e8f0;">' +
        m.totalTasks +
        "</td>" +
        '<td style="padding:10px;text-align:center;border-bottom:1px solid #e2e8f0;color:#059669;font-weight:600;">' +
        m.approvedTasks +
        "</td>" +
        "</tr>";
    });

  body += "</table></div>";
  body += _tplFooter_();
  MailApp.sendEmail({
    to: manager.email,
    subject: subject,
    htmlBody: body,
    inlineImages: { siLogo: _getLogoBlob_() },
  });
}

// =============================================================================
//  TASK TABLE TEMPLATE — professional tabular layout
//  Used for all reminder and escalation emails.
// =============================================================================

function _tplTaskTable_(tasks, sectionTitle, headerBg, accentColor) {
  var html = '<div style="margin:16px 20px 0;">';

  // Section header bar
  html +=
    '<div style="background:' +
    headerBg +
    ";border-left:4px solid " +
    accentColor +
    ";" +
    'padding:10px 16px;border-radius:0 6px 0 0;">' +
    '<span style="font-size:13px;font-weight:700;color:' +
    accentColor +
    ';">' +
    sectionTitle +
    " (" +
    tasks.length +
    ")</span>" +
    "</div>";

  // Table
  html +=
    '<table style="width:100%;border-collapse:collapse;font-size:12px;' +
    'border:1px solid #e2e8f0;border-top:none;margin-bottom:4px;">' +
    "<thead>" +
    '<tr style="background:#f8fafc;">' +
    '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:600;min-width:120px;">Task</th>' +
    '<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:600;">Project</th>' +
    '<th style="padding:8px 10px;text-align:center;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:600;">Assigned To</th>' +
    '<th style="padding:8px 10px;text-align:center;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:600;white-space:nowrap;">Due Date</th>' +
    '<th style="padding:8px 10px;text-align:center;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:600;white-space:nowrap;">Days</th>' +
    '<th style="padding:8px 10px;text-align:center;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:600;">Priority</th>' +
    '<th style="padding:8px 10px;text-align:center;border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:600;">Status / Stage</th>' +
    "</tr>" +
    "</thead><tbody>";

  tasks.forEach(function (t, idx) {
    var rowBg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";

    // Days column
    var days = t.daysLeft;
    var daysStr, daysColor;
    if (days < 0) {
      daysStr = Math.abs(days) + "d overdue";
      daysColor = "#dc2626";
    } else if (days === 0) {
      daysStr = "Due today";
      daysColor = "#d97706";
    } else {
      daysStr = days + "d left";
      daysColor = days <= 3 ? "#d97706" : "#059669";
    }

    // Priority pill
    var priColor =
      t.priority === "High"
        ? "#dc2626"
        : t.priority === "Low"
          ? "#6b7280"
          : "#d97706";
    var priBg =
      t.priority === "High"
        ? "#fef2f2"
        : t.priority === "Low"
          ? "#f1f5f9"
          : "#fffbeb";

    // Status / approval stage label
    var stageMap = {
      "Pending TL": "⏳ Pending TL",
      Rejected: "❌ Rejected",
      Approved: "✅ Approved",
    };
    var statusLabel =
      t.approvalStatus && stageMap[t.approvalStatus]
        ? stageMap[t.approvalStatus]
        : t.status || "—";

    html +=
      '<tr style="background:' +
      rowBg +
      ';">' +
      '<td style="padding:9px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#1a202c;">' +
      (t.name || "—") +
      "</td>" +
      '<td style="padding:9px 12px;border-bottom:1px solid #f1f5f9;color:#374151;">' +
      (t.projectName || "—") +
      "</td>" +
      '<td style="padding:9px 10px;border-bottom:1px solid #f1f5f9;text-align:center;color:#374151;">' +
      (t.assignedTo || "—") +
      "</td>" +
      '<td style="padding:9px 10px;border-bottom:1px solid #f1f5f9;text-align:center;color:#374151;white-space:nowrap;">' +
      (t.dueDate || "—") +
      "</td>" +
      '<td style="padding:9px 10px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:700;color:' +
      daysColor +
      ';white-space:nowrap;">' +
      daysStr +
      "</td>" +
      '<td style="padding:9px 10px;border-bottom:1px solid #f1f5f9;text-align:center;">' +
      '<span style="background:' +
      priBg +
      ";color:" +
      priColor +
      ';padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">' +
      (t.priority || "Medium") +
      "</span>" +
      "</td>" +
      '<td style="padding:9px 10px;border-bottom:1px solid #f1f5f9;text-align:center;color:#4a5568;font-size:11px;">' +
      statusLabel +
      "</td>" +
      "</tr>";
  });

  html += "</tbody></table></div>";
  return html;
}

// =============================================================================
//  SHARED EMAIL TEMPLATE COMPONENTS
// =============================================================================

function _tplHeader_(recipientName, pageTitle) {
  return (
    "<!DOCTYPE html><html><head>" +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    "</head>" +
    "<body style=\"margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;\">" +
    '<div style="max-width:680px;margin:24px auto;background:#ffffff;border-radius:12px;' +
    'overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">' +
    // Brand header
    '<div style="background:linear-gradient(135deg,#1e3a5f 0%,#2c5282 100%);padding:26px 28px 22px;">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">' +
    '<img src="cid:siLogo" alt="SI" style="width:42px;height:42px;border-radius:10px;display:block;">' +
    "<div>" +
    '<div style="color:rgba(255,255,255,0.65);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">Secret Ingredient</div>' +
    '<div style="color:#ffffff;font-size:14px;font-weight:700;">Project Tracker</div>' +
    "</div></div>" +
    '<h1 style="color:#ffffff;font-size:18px;font-weight:700;margin:0 0 4px;">' +
    pageTitle +
    "</h1>" +
    '<p style="color:rgba(255,255,255,0.75);font-size:12px;margin:0;">' +
    'Hi <strong style="color:#ffffff;">' +
    recipientName +
    "</strong>" +
    " &nbsp;·&nbsp; " +
    _todayLabel_() +
    "</p></div>"
  );
}

function _tplIntro_(html) {
  return (
    '<div style="padding:18px 20px 6px;">' +
    '<p style="margin:0;font-size:13px;color:#4a5568;line-height:1.65;">' +
    html +
    "</p>" +
    "</div>"
  );
}

function _tplStatBox_(label, value, bg, color) {
  return (
    '<div style="flex:1;min-width:110px;background:' +
    bg +
    ";border-radius:10px;" +
    'padding:14px 18px;text-align:center;">' +
    '<div style="font-size:26px;font-weight:800;color:' +
    color +
    ';font-family:monospace;">' +
    value +
    "</div>" +
    '<div style="font-size:10px;font-weight:700;color:' +
    color +
    ";margin-top:4px;" +
    'text-transform:uppercase;letter-spacing:.8px;">' +
    label +
    "</div>" +
    "</div>"
  );
}

function _tplFooter_() {
  return (
    '<div style="background:#f7fafc;padding:16px 28px;margin-top:20px;border-top:1px solid #e2e8f0;">' +
    '<p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">' +
    "Automated message from <strong>Secret Ingredient Project Tracker</strong>. " +
    "Do not reply — log in to the tracker to update your tasks." +
    "</p></div></div></body></html>"
  );
}
