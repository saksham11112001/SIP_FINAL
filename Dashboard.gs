// =============================================================================
//  Dashboard.gs  |  Stats aggregation + chart data for the dashboard page
//
//  CHANGES IN THIS VERSION:
//    1. getPieChartData() — now returns ONLY the two required chart datasets:
//         taskChart:    { inProgress, completedApproved, completedPending }
//         projectChart: { active, completed }
//    2. getDashboardSummary() — alias of getPieChartData() (spec name).
//    3. getDashboardStats() — updated pendingApproval to include only Pending TL
//    4. overdueTasks count excludes Completed tasks; past due date only.
// =============================================================================

function getDashboardStats() {
  try {
    var projects = getProjects();
    var tasks = getTasks();
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var activeProjects = projects.filter(function (p) {
      return p.status === "Active";
    });

    var inProgress = tasks.filter(function (t) {
      return t.status === "In Progress";
    });

    var overdue = tasks.filter(function (t) {
      if (t.status === "Completed") return false;
      var d = parseDateLoose_(t.dueDate);
      return d && d < today;
    });

    // Pending approval = any task awaiting TL review
    var pendingApproval = tasks.filter(function (t) {
      return t.approvalStatus === "Pending TL";
    });

    return {
      totalProjects: activeProjects.length,
      totalTasks: tasks.length,
      pendingTasks: inProgress.length,
      overdueTasks: overdue.length,
      pendingApproval: pendingApproval.length,
      completedProjects: projects.filter(function (p) {
        return p.status === "Completed";
      }).length,
    };
  } catch (e) {
    return {
      totalProjects: 0,
      totalTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      pendingApproval: 0,
      completedProjects: 0,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  getPieChartData()  — used by JS_Dashboard.html
//
//  Returns:
//    taskChart    { labels, values, colors }  ← 3 slices
//    projectChart { labels, values, colors }  ← 2 slices
//    + all KPI numbers for renderKPIs()
// ─────────────────────────────────────────────────────────────────────────────

function getPieChartData() {
  try {
    var tasks = getTasks();
    var projects = getProjects();
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── Task chart: 3 slices ──────────────────────────────────────────────────
    var inProgress = tasks.filter(function (t) {
      return t.status === "In Progress";
    }).length;

    var completedApproved = tasks.filter(function (t) {
      return t.status === "Completed" && t.approvalStatus === "Approved";
    }).length;

    // "Completed (Pending Approval)" = waiting for TL review
    var completedPending = tasks.filter(function (t) {
      return t.status === "Completed" && t.approvalStatus === "Pending TL";
    }).length;

    // ── Project chart: 2 slices ───────────────────────────────────────────────
    var activeProjects = projects.filter(function (p) {
      return p.status === "Active";
    }).length;
    var completedProjects = projects.filter(function (p) {
      return p.status === "Completed";
    }).length;

    // ── Aux numbers (used by KPI cards) ─────────────────────────────────────
    var overdue = tasks.filter(function (t) {
      if (t.status === "Completed") return false;
      var d = parseDateLoose_(t.dueDate);
      return d && d < today;
    }).length;

    return {
      // ── KPI numbers ──────────────────────────────────────────────────────────
      totalTasks: tasks.length,
      inProgressTasks: inProgress,
      completedApproved: completedApproved,
      pendingApproval: completedPending, // backwards-compat for nav badge
      overdueTasks: overdue,
      totalProjects: projects.length,
      activeProjects: activeProjects,
      completedProjects: completedProjects,

      // ── Chart 1: Task Breakdown ───────────────────────────────────────────────
      taskChart: {
        labels: [
          "In Progress",
          "Completed (Approved)",
          "Completed (Pending Approval)",
        ],
        values: [inProgress, completedApproved, completedPending],
        colors: ["#3182ce", "#10b981", "#f59e0b"],
      },

      // ── Chart 2: Project Breakdown ────────────────────────────────────────────
      projectChart: {
        labels: ["Active", "Completed"],
        values: [activeProjects, completedProjects],
        colors: ["#3182ce", "#10b981"],
      },
    };
  } catch (e) {
    Logger.log("getPieChartData error: " + e.message);
    return {
      totalTasks: 0,
      inProgressTasks: 0,
      completedApproved: 0,
      pendingApproval: 0,
      overdueTasks: 0,
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      taskChart: { labels: [], values: [], colors: [] },
      projectChart: { labels: [], values: [], colors: [] },
    };
  }
}

// Alias used by spec (getDashboardSummary)
function getDashboardSummary() {
  return getPieChartData();
}

// ─────────────────────────────────────────────────────────────────────────────
//  getProjectHealth()  — used by JS_Health.html
//
//  RAG model per project (excluding Completed projects):
//    hold  : status === 'On Hold'
//    red   : any non-completed task is overdue  OR  project past deadline
//    amber : any task is 'Pending TL'  OR  deadline ≤ 7 days away with unapproved tasks
//    green : everything on track
//
//  Returns:
//    { projects: [...], summary: { red, amber, green, hold } }
// ─────────────────────────────────────────────────────────────────────────────

function getProjectHealth() {
  try {
    var projects = getProjects();
    var tasks    = getTasks();
    var today    = new Date();
    today.setHours(0, 0, 0, 0);

    var result = [];

    projects.forEach(function(p) {
      if (p.status === 'Completed') return; // completed projects excluded

      var projTasks = tasks.filter(function(t) { return t.projectId === p.id; });
      var total     = projTasks.length;

      var approved     = projTasks.filter(function(t) { return t.approvalStatus === 'Approved'; }).length;
      var pendingAppr  = projTasks.filter(function(t) { return t.approvalStatus === 'Pending TL'; }).length;
      var overdueCount = projTasks.filter(function(t) {
        if (t.status === 'Completed') return false;
        var d = parseDateLoose_(t.dueDate);
        return d && d < today;
      }).length;

      var deadline       = parseDateLoose_(p.deadline);
      var startDate      = parseDateLoose_(p.startDate);
      var daysToDeadline = deadline ? Math.ceil((deadline - today) / 86400000) : null;
      var projectOverdue = daysToDeadline !== null && daysToDeadline < 0;

      var pct = total > 0 ? Math.round((approved / total) * 100) : 0;

      // ── Time-based expected progress ──────────────────────────────────────
      // expectedPct = how much % of the project timeline has elapsed
      var totalProjectDays = (startDate && deadline)
        ? Math.ceil((deadline - startDate) / 86400000) : null;
      var elapsedDays = startDate
        ? Math.max(0, Math.ceil((today - startDate) / 86400000)) : null;
      var expectedPct = (totalProjectDays && totalProjectDays > 0 && elapsedDays !== null)
        ? Math.min(100, Math.round((elapsedDays / totalProjectDays) * 100))
        : null;
      // velocity: ratio of actual done vs expected done (1.0 = exactly on pace)
      var velocity = (expectedPct !== null && expectedPct > 0)
        ? Math.round((pct / expectedPct) * 100) / 100
        : null;

      // ── Manpower efficiency (weighted by task due-date span) ──────────────
      // Each task's weight = days allocated from project start to task due date.
      // Completing heavier (longer-runway) tasks contributes more to manpower pct.
      var totalManpowerDays = 0, completedManpowerDays = 0;
      projTasks.forEach(function(t) {
        var td = parseDateLoose_(t.dueDate);
        if (!td || !startDate) return;
        var days = Math.max(1, Math.ceil((td - startDate) / 86400000));
        totalManpowerDays += days;
        if (t.approvalStatus === 'Approved') completedManpowerDays += days;
      });
      var manpowerPct = totalManpowerDays > 0
        ? Math.round((completedManpowerDays / totalManpowerDays) * 100) : 0;

      // ── RAG classification ────────────────────────────────────────────────
      var rag;
      if (p.status === 'On Hold') {
        rag = 'hold';
      } else if (overdueCount > 0 || projectOverdue) {
        rag = 'red';
      } else if (pendingAppr > 0 || (daysToDeadline !== null && daysToDeadline <= 7 && approved < total)) {
        rag = 'amber';
      } else {
        rag = 'green';
      }

      result.push({
        id                   : p.id,
        name                 : p.name,
        client               : p.client,
        clientType           : p.clientType,
        status               : p.status,
        startDate            : p.startDate,
        deadline             : p.deadline,
        manager              : p.manager,
        teamLead             : p.teamLead,
        rag                  : rag,
        totalTasks           : total,
        approvedTasks        : approved,
        pendingApproval      : pendingAppr,
        overdueTasks         : overdueCount,
        pct                  : pct,
        daysToDeadline       : daysToDeadline,
        expectedPct          : expectedPct,
        velocity             : velocity,
        totalProjectDays     : totalProjectDays,
        elapsedDays          : elapsedDays,
        totalManpowerDays    : totalManpowerDays,
        completedManpowerDays: completedManpowerDays,
        manpowerPct          : manpowerPct,
      });
    });

    // Sort: red → amber → hold → green; within same RAG by daysToDeadline asc
    var ragOrder = { red: 0, amber: 1, hold: 2, green: 3 };
    result.sort(function(a, b) {
      var ro = ragOrder[a.rag] - ragOrder[b.rag];
      if (ro !== 0) return ro;
      if (a.daysToDeadline === null && b.daysToDeadline === null) return 0;
      if (a.daysToDeadline === null) return 1;
      if (b.daysToDeadline === null) return -1;
      return a.daysToDeadline - b.daysToDeadline;
    });

    var summary = { red: 0, amber: 0, green: 0, hold: 0 };
    result.forEach(function(r) { summary[r.rag]++; });

    return { projects: result, summary: summary };
  } catch (e) {
    Logger.log('getProjectHealth error: ' + e.message);
    return { projects: [], summary: { red: 0, amber: 0, green: 0, hold: 0 } };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  getGanttData()  — used by JS_Gantt.html
//
//  Returns all non-Completed projects sorted by startDate, each with their
//  tasks. Includes enough data to render a CSS Gantt chart client-side.
// ─────────────────────────────────────────────────────────────────────────────

function getGanttData() {
  try {
    var projects = getProjects();
    var tasks    = getTasks();
    var today    = new Date();
    today.setHours(0, 0, 0, 0);

    var result = projects
      .filter(function(p) { return p.status !== 'Completed'; })
      .map(function(p) {
        var projTasks = tasks
          .filter(function(t) { return t.projectId === p.id; })
          .map(function(t) {
            var d   = t.dueDate ? new Date(t.dueDate) : null;
            var dtd = d ? Math.ceil((d - today) / 86400000) : null;
            return {
              id             : t.id,
              name           : t.name,
              assignedTo     : t.assignedTo,
              dueDate        : t.dueDate,
              status         : t.status,
              approvalStatus : t.approvalStatus,
              priority       : t.priority,
              daysToDeadline : dtd
            };
          });

        return {
          id        : p.id,
          name      : p.name,
          client    : p.client,
          clientType: p.clientType,
          startDate : p.startDate,
          deadline  : p.deadline,
          status    : p.status,
          teamLead  : p.teamLead,
          tasks     : projTasks
        };
      });

    // Sort by startDate ascending (projects with no startDate go last)
    result.sort(function(a, b) {
      var da = a.startDate ? new Date(a.startDate) : null;
      var db = b.startDate ? new Date(b.startDate) : null;
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });

    return result;
  } catch (e) {
    Logger.log('getGanttData error: ' + e.message);
    return [];
  }
}
