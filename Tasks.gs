// =============================================================================
//  Tasks.gs  |  Task CRUD + approval workflow
//
//  APPROVAL FLOW (single-stage, TL = Project Lead):
//    Staff marks Completed  → approvalStatus = 'Pending TL'
//    Team Leader approves   → approvalStatus = 'Approved'
//    Either can reject      → status = 'In Progress', approvalStatus = 'Rejected'
//
//  WHO IS "TEAM LEAD" FOR APPROVAL?
//    The person whose name matches the Project's teamLead field.
//    This is NOT a role in the Teams sheet — it's a per-project designation.
//    An Admin can ALSO approve the TL stage (override capability).
//
//  VALID STATUSES: 'In Progress' | 'Completed'
// =============================================================================

var VALID_TASK_STATUSES = ["In Progress", "Completed"];

function _normaliseStatus(s) {
  s = String(s || "").trim();
  if (s === "Completed") return "Completed";
  return "In Progress";
}

function _normaliseFrequency(s) {
  s = String(s || "").trim();
  if (s === "Daily" || s === "Alternate Days" || s === "Weekly" || s === "Ongoing") return s;
  return "One Time";
}

// ─────────────────────────────────────────────────────────────────────────────
//  READ  (cached)
// ─────────────────────────────────────────────────────────────────────────────

function getTasks() {
  return cached(CACHE_KEYS.TASKS, CACHE_TTL.TASKS, function () {
    try {
      var data = sheetDisplayValues(getSheet(SHEET_NAMES.TASKS));
      var tasks = [];
      for (var i = 1; i < data.length; i++) {
        var r = data[i];
        if (!r[TASK_COL.ID]) continue;
        tasks.push({
          id: r[TASK_COL.ID],
          projectId: r[TASK_COL.PROJECT_ID],
          name: r[TASK_COL.NAME],
          assignedTo: r[TASK_COL.ASSIGNED_TO],
          dueDate: r[TASK_COL.DUE_DATE],
          status: _normaliseStatus(r[TASK_COL.STATUS]),
          priority: r[TASK_COL.PRIORITY] || "Medium",
          notes: r[TASK_COL.NOTES],
          createdDate: r[TASK_COL.CREATED_DATE],
          completedDate: r[TASK_COL.COMPLETED_DATE],
          createdBy: r[TASK_COL.CREATED_BY],
          approvalStatus: r[TASK_COL.APPROVAL_STATUS] || "",
          approvalRemarks: r[TASK_COL.APPROVAL_REMARKS] || "",
          approvedBy: r[TASK_COL.APPROVED_BY] || "",
          approvedDate: r[TASK_COL.APPROVED_DATE] || "",
          frequency: r[TASK_COL.FREQUENCY] || "One Time",
          dayOfWeek: r[TASK_COL.DAY_OF_WEEK] || "",
          taskApprover: r[TASK_COL.TASK_APPROVER] || "",
        });
      }
      return tasks;
    } catch (e) {
      Logger.log("getTasks error: " + e.message);
      return [];
    }
  });
}

function getTasksPage(offset, limit) {
  try {
    offset = parseInt(offset, 10) || 0;
    limit = parseInt(limit, 10) || 50;
    var all = getTasks();
    return {
      tasks: all.slice(offset, offset + limit),
      total: all.length,
      offset: offset,
      hasMore: offset + limit < all.length,
    };
  } catch (e) {
    return { tasks: [], total: 0, offset: 0, hasMore: false };
  }
}

function getFilteredTasks(filters) {
  try {
    filters = filters || {};
    var all = getTasks();
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return all.filter(function (t) {
      if (filters.projectId && t.projectId !== filters.projectId) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (
        filters.assignedTo &&
        (t.assignedTo || "").toLowerCase() !==
          (filters.assignedTo || "").toLowerCase()
      )
        return false;
      if (filters.approvalStatus && t.approvalStatus !== filters.approvalStatus)
        return false;
      if (filters.overdue) {
        if (t.status === "Completed") return false;
        var d = parseDateLoose_(t.dueDate);
        if (!d || d >= today) return false;
      }
      return true;
    });
  } catch (e) {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE  (Admin or Team Leader only)
// ─────────────────────────────────────────────────────────────────────────────

function addTask(
  projectId,
  name,
  assignedTo,
  dueDate,
  status,
  priority,
  notes,
  frequency,
  dayOfWeek,
  taskApprover,
) {
  try {
    clearCache([CACHE_KEYS.TASKS]);
    status = _normaliseStatus(status || "In Progress");
    var sheet = getSheet(SHEET_NAMES.TASKS);
    var user = getCurrentUser();
    // Everyone in the project (lead, second person, buddies) can add tasks
    if (user.role !== "Admin" && !_isProjectMember_(projectId, user)) {
      return {
        success: false,
        error: "Only an Admin or a project member can create tasks.",
      };
    }
    var taskId = "TASK_" + new Date().getTime();
    // New completed task goes to TL stage first
    var approval = status === "Completed" ? "Pending TL" : "";

    var freq = (frequency || "One Time").trim() || "One Time";
    var dow = freq === "Weekly" ? dayOfWeek || "" : "";
    // Non-recurring tasks clear due date only if explicitly blank
    sheet.appendRow([
      taskId,
      projectId,
      name,
      assignedTo,
      dueDate,
      status,
      priority || "Medium",
      notes || "",
      new Date(),
      status === "Completed" ? new Date() : "",
      user.email || user.name,
      approval,
      "",
      "",
      "",
      freq,
      dow,
      taskApprover || "",
    ]);
    logAudit(
      user.name,
      "CREATE_TASK",
      "Task",
      taskId,
      'Created: "' + name + '"',
    );
    return { success: true, taskId: taskId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function addTasksBulk(projectId, taskList) {
  try {
    clearCache([CACHE_KEYS.TASKS]);
    var sheet = getSheet(SHEET_NAMES.TASKS);
    var user = getCurrentUser();
    // Everyone in the project can bulk-add tasks
    if (user.role !== "Admin" && !_isProjectMember_(projectId, user)) {
      return {
        success: false,
        error: "Only an Admin or a project member can bulk-create tasks.",
      };
    }
    var now = new Date();
    var ids = [];

    for (var i = 0; i < taskList.length; i++) {
      var t = taskList[i];
      var name = String(t.name || "").trim();
      if (!name) continue;
      var taskId = "TASK_" + now.getTime() + "_" + i;
      var tFreq = _normaliseFrequency(t.frequency || "");
      var tDow = tFreq === "Weekly" ? t.dayOfWeek || "" : "";
      sheet.appendRow([
        taskId,
        projectId,
        name,
        t.assignedTo || "",
        t.dueDate || "",
        "In Progress",
        t.priority || "Medium",
        t.notes || "",
        now,
        "",
        user.email || user.name,
        "",
        "",
        "",
        "",
        tFreq,
        tDow,
        "",   // taskApprover: blank = use project lead
      ]);
      ids.push(taskId);
    }
    logAudit(
      user.name,
      "BULK_CREATE_TASKS",
      "Task",
      projectId,
      ids.length + " tasks created",
    );
    return { success: true, taskIds: ids };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE — Full edit (Admin or Team Leader only)
// ─────────────────────────────────────────────────────────────────────────────

function updateTask(
  id,
  projectId,
  name,
  assignedTo,
  dueDate,
  status,
  priority,
  notes,
  frequency,
  dayOfWeek,
  taskApprover,
) {
  try {
    clearCache([CACHE_KEYS.TASKS, CACHE_KEYS.PROJECTS]);
    status = _normaliseStatus(status);

    var sheet = getSheet(SHEET_NAMES.TASKS);
    var data = sheetValues(sheet);
    var user = getCurrentUser();
    // Full edit: Admin, Project Lead, or Second Person (first in teamMembers).
    // Buddies and other assignees use updateTaskStatus() for status-only changes.
    if (user.role !== "Admin" && !_isProjectLeadServer_(projectId, user) && !_isProjectSecondPerson_(projectId, user)) {
      return {
        success: false,
        error: "Only an Admin, the project lead, or second person can fully edit tasks.",
      };
    }

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][TASK_COL.ID]) !== String(id)) continue;

      var row = i + 1;
      var prevStatus = _normaliseStatus(data[i][TASK_COL.STATUS]);
      var prevApproval = String(data[i][TASK_COL.APPROVAL_STATUS] || "");
      var prevRemarks = String(data[i][TASK_COL.APPROVAL_REMARKS] || "");
      var prevApprBy = String(data[i][TASK_COL.APPROVED_BY] || "");
      var prevApprDate = data[i][TASK_COL.APPROVED_DATE] || "";
      var prevCompDate = data[i][TASK_COL.COMPLETED_DATE] || "";

      var newApproval = prevApproval;
      if (status === "Completed" && prevStatus !== "Completed") {
        newApproval = "Pending TL";
      } else if (status !== "Completed") {
        newApproval = "";
      }

      var newCompDate = prevCompDate;
      if (status === "Completed" && prevStatus !== "Completed")
        newCompDate = new Date();
      else if (status !== "Completed") newCompDate = "";

      var newRemarks = status !== "Completed" ? "" : prevRemarks;
      var newApprBy = status !== "Completed" ? "" : prevApprBy;
      var newApprDate = status !== "Completed" ? "" : prevApprDate;

      var updFreq = (frequency || "One Time").trim() || "One Time";
      var updDow = updFreq === "Weekly" ? dayOfWeek || "" : "";
      sheet
        .getRange(row, 2, 1, 7)
        .setValues([
          [
            projectId,
            name,
            assignedTo,
            dueDate,
            status,
            priority || "Medium",
            notes || "",
          ],
        ]);
      sheet.getRange(row, 10).setValue(newCompDate);
      sheet
        .getRange(row, 12, 1, 4)
        .setValues([[newApproval, newRemarks, newApprBy, newApprDate]]);
      sheet.getRange(row, 16, 1, 3).setValues([[updFreq, updDow, taskApprover || ""]]);

      recomputeProjectStatus(String(data[i][TASK_COL.PROJECT_ID] || projectId));
      logAudit(
        user.name,
        "UPDATE_TASK",
        "Task",
        id,
        '"' + name + '" → ' + status,
      );
      return { success: true };
    }
    return { success: false, error: "Task not found." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE STATUS ONLY  (Staff for own tasks)
// ─────────────────────────────────────────────────────────────────────────────

function updateTaskStatus(id, status, notes) {
  try {
    clearCache([CACHE_KEYS.TASKS, CACHE_KEYS.PROJECTS]);
    status = _normaliseStatus(status);

    var sheet = getSheet(SHEET_NAMES.TASKS);
    var data = sheetValues(sheet);
    var user = getCurrentUser();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][TASK_COL.ID]) !== String(id)) continue;

      var row = i + 1;
      var prevStatus = _normaliseStatus(data[i][TASK_COL.STATUS]);
      var approval = String(data[i][TASK_COL.APPROVAL_STATUS] || "");

      if (status === "Completed" && prevStatus !== "Completed") {
        approval = "Pending TL";
      } else if (status !== "Completed") {
        approval = "";
      }

      sheet.getRange(row, TASK_COL.STATUS + 1).setValue(status);
      sheet.getRange(row, TASK_COL.NOTES + 1).setValue(notes || "");

      if (status === "Completed" && prevStatus !== "Completed") {
        sheet.getRange(row, TASK_COL.COMPLETED_DATE + 1).setValue(new Date());
        sheet.getRange(row, TASK_COL.APPROVAL_STATUS + 1).setValue(approval);
      } else if (status !== "Completed") {
        sheet.getRange(row, 10).setValue("");
        sheet.getRange(row, 12, 1, 4).setValues([["", "", "", ""]]);
      }

      recomputeProjectStatus(String(data[i][TASK_COL.PROJECT_ID] || ""));
      logAudit(
        user.name,
        "STATUS_UPDATE",
        "Task",
        id,
        '"' + String(data[i][TASK_COL.NAME] || "") + '" → ' + status,
      );
      return { success: true };
    }
    return { success: false, error: "Task not found." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  APPROVE / REJECT  — SINGLE-STAGE
//
//  Stage 1: 'Pending TL' → 'Approved' / 'Rejected'
//  Reject:  revert to 'In Progress', clear approval fields
//
//  WHO CAN APPROVE?
//    If task.taskApprover is set → that person (name-match) OR Admin.
//    If task.taskApprover is empty → project lead (teamLead email-match) OR Admin.
//    Admin can ALWAYS approve (override).
// ─────────────────────────────────────────────────────────────────────────────

function approveTask(taskId, decision, remarks) {
  try {
    if (decision !== "Approved" && decision !== "Rejected") {
      return { success: false, error: "Invalid decision." };
    }

    clearCache([CACHE_KEYS.TASKS, CACHE_KEYS.PROJECTS]);

    var sheet = getSheet(SHEET_NAMES.TASKS);
    var data = sheetValues(sheet);
    var user = getCurrentUser();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][TASK_COL.ID]) !== String(taskId)) continue;

      var row = i + 1;
      var taskName = String(data[i][TASK_COL.NAME] || "");
      var currentStatus = _normaliseStatus(data[i][TASK_COL.STATUS]);
      var currentApproval = String(data[i][TASK_COL.APPROVAL_STATUS] || "");
      var projectId = String(data[i][TASK_COL.PROJECT_ID] || "");
      var taskApproverStored = String(data[i][TASK_COL.TASK_APPROVER] || "").trim().toLowerCase();

      if (currentStatus !== "Completed") {
        return {
          success: false,
          error: "Task must be marked Completed before it can be reviewed.",
        };
      }

      if (currentApproval !== "Pending TL") {
        return {
          success: false,
          error:
            "Task is not awaiting approval. Current state: " +
            (currentApproval || "none"),
        };
      }

      var isAdmin = user.role === "Admin";

      // ── Determine effective approver ────────────────────────────────────────
      var isAllowed = false;

      if (taskApproverStored) {
        // Task has a designated approver — check by name or email
        var isDesignatedApprover =
          (user.name  || "").trim().toLowerCase() === taskApproverStored ||
          (user.email || "").trim().toLowerCase() === taskApproverStored;
        isAllowed = isAdmin || isDesignatedApprover;
      } else {
        // No designated approver — fall back to project lead
        var projects = getProjects();
        var project = null;
        for (var pi = 0; pi < projects.length; pi++) {
          if (projects[pi].id === projectId) { project = projects[pi]; break; }
        }
        var isProjectLead =
          project &&
          (project.teamLead || "").trim().toLowerCase() ===
            (user.email || "").trim().toLowerCase();
        isAllowed = isAdmin || isProjectLead;
      }

      if (!isAllowed) {
        var who = taskApproverStored
          ? "the designated task approver"
          : "the project lead";
        return {
          success: false,
          error: "Only " + who + " or an Admin can review this task.",
        };
      }

      var newApproval;

      if (decision === "Rejected") {
        newApproval = "Rejected";
        sheet.getRange(row, TASK_COL.STATUS + 1).setValue("In Progress");
        sheet.getRange(row, TASK_COL.COMPLETED_DATE + 1).setValue("");
      } else {
        newApproval = "Approved";
      }

      sheet
        .getRange(row, 12, 1, 4)
        .setValues([[newApproval, remarks || "", user.name, new Date()]]);
      recomputeProjectStatus(projectId);

      logAudit(
        user.name,
        decision.toUpperCase(),
        "Task",
        taskId,
        '"' +
          taskName +
          '" [' +
          newApproval +
          "]" +
          (remarks ? " — " + remarks : ""),
      );
      return { success: true, newApprovalStatus: newApproval };
    }
    return { success: false, error: "Task not found." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  REASSIGN  (Admin | project lead | current assignee)
//
//  Rules:
//    - Admin         : can always reassign any task
//    - Project Lead  : can reassign any task in their project
//    - Current Assignee: can reassign their own task to someone else
//    - Nobody else can reassign
// ─────────────────────────────────────────────────────────────────────────────

function reassignTask(taskId, newAssignee) {
  try {
    clearCache([CACHE_KEYS.TASKS]);
    var sheet = getSheet(SHEET_NAMES.TASKS);
    var data  = sheetValues(sheet);
    var user  = getCurrentUser();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][TASK_COL.ID]) !== String(taskId)) continue;

      var row          = i + 1;
      var taskName     = String(data[i][TASK_COL.NAME]        || '');
      var currAssignee = String(data[i][TASK_COL.ASSIGNED_TO] || '');
      var taskProjId   = String(data[i][TASK_COL.PROJECT_ID]  || '');

      var isAdmin        = user.role === 'Admin';
      var isProjLead     = _isProjectLeadServer_(taskProjId, user);
      var isSecondPerson = _isProjectSecondPerson_(taskProjId, user);
      // Match by name OR email (assignee is stored as name in most cases)
      var isAssignee   =
        currAssignee.trim().toLowerCase() === (user.name  || '').trim().toLowerCase() ||
        currAssignee.trim().toLowerCase() === (user.email || '').trim().toLowerCase();

      if (!isAdmin && !isProjLead && !isSecondPerson && !isAssignee) {
        return {
          success: false,
          error: 'Only the current assignee, the project lead, second person, or an Admin can reassign this task.'
        };
      }

      sheet.getRange(row, TASK_COL.ASSIGNED_TO + 1).setValue(newAssignee || '');
      logAudit(
        user.name, 'REASSIGN_TASK', 'Task', taskId,
        '"' + taskName + '" reassigned from "' + currAssignee +
          '" to "' + (newAssignee || 'Unassigned') + '"'
      );
      return { success: true };
    }
    return { success: false, error: 'Task not found.' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SET TASK APPROVER  — called after file upload so approver can be set inline
//  Any logged-in user can call this (no role restriction beyond auth check).
// ─────────────────────────────────────────────────────────────────────────────

function setTaskApprover(taskId, approverName) {
  try {
    var user = getCurrentUser();
    if (user.accessDenied) return { success: false, error: 'Access denied.' };

    clearCache([CACHE_KEYS.TASKS]);
    var sheet = getSheet(SHEET_NAMES.TASKS);
    var data  = sheetValues(sheet);

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][TASK_COL.ID]) !== String(taskId)) continue;
      sheet.getRange(i + 1, TASK_COL.TASK_APPROVER + 1).setValue(approverName || '');
      logAudit(user.name, 'SET_APPROVER', 'Task', taskId,
        '"' + String(data[i][TASK_COL.NAME] || '') + '" approver → ' + (approverName || 'project lead'));
      return { success: true };
    }
    return { success: false, error: 'Task not found.' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE  (Admin only)
// ─────────────────────────────────────────────────────────────────────────────

function deleteTask(id) {
  try {
    clearCache([CACHE_KEYS.TASKS, CACHE_KEYS.PROJECTS]);
    var sheet = getSheet(SHEET_NAMES.TASKS);
    var data = sheetValues(sheet);
    var user = getCurrentUser();
    var projectId = "";

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][TASK_COL.ID]) !== String(id)) continue;
      var name = String(data[i][TASK_COL.NAME] || "");
      projectId = String(data[i][TASK_COL.PROJECT_ID] || "");
      // Delete allowed for Admin, Project Lead, or Second Person
      if (user.role !== "Admin" && !_isProjectLeadServer_(projectId, user) && !_isProjectSecondPerson_(projectId, user)) {
        return { success: false, error: "Only an Admin, the project lead, or second person can delete tasks." };
      }
      sheet.deleteRow(i + 1);
      logAudit(user.name, "DELETE_TASK", "Task", id, 'Deleted: "' + name + '"');
      if (projectId) recomputeProjectStatus(projectId);
      return { success: true };
    }
    return { success: false, error: "Task not found." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
