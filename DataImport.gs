// =============================================================================
//  DataImport.gs  |  ONE-TIME data import — run populateInitialData() ONCE
//                    from the Apps Script editor, then delete this file.
//
//  Run order:
//    1. setupSheets()          — creates all sheet tabs (already in Code.gs)
//    2. populateInitialData()  — inserts teams, clients, projects, tasks
// =============================================================================

function populateInitialData() {
  // ── 0. ENSURE ALL SHEETS EXIST ───────────────────────────────────────────────
  try {
    setupSheets();
    Logger.log("✓ Sheets verified / created.");
  } catch (e) {
    Logger.log("⚠ setupSheets error (continuing): " + e.message);
  }

  var ss  = getSpreadsheet();
  var now = new Date();
  var by  = "system-import";

  // ── 1. TEAM MEMBERS ──────────────────────────────────────────────────────────
  var ts = ss.getSheetByName(SHEET_NAMES.TEAMS);
  if (!ts) { Logger.log("❌ Teams sheet not found — aborting."); return; }

  var members = [
    // ─── ADMIN — update YOUR email below if it differs ───────────────────────
    { name: "Saksham Gupta",     role: "Admin",       email: "saksham.gpt2001@gmail.com"        },
    // ─── OTHER ADMINS ─────────────────────────────────────────────────────────
    { name: "Neha Sharma",       role: "Admin",       email: "neha@secretingredient.co.in"      },
    { name: "Hitesh Arora",      role: "Admin",       email: "hitesh@secretingredient.co.in"    },
    // ─── TEAM LEADERS ─────────────────────────────────────────────────────────
    { name: "Kshitija Kohli",    role: "Team Leader", email: "kshitija@secretingredient.co.in"  },
    { name: "Dev Ratra",         role: "Team Leader", email: "dev@secretingredient.co.in"       },
    { name: "Esha Moolchandani", role: "Team Leader", email: "esha@secretingredient.co.in"      },
    { name: "Vallrie Agrawal",   role: "Team Leader", email: "vallrie@secretingredient.co.in"   },
    { name: "Jasmeet Mehta",     role: "Team Leader", email: "jasmeet@secretingredient.co.in"   },
    { name: "Arastu Chaturvedi", role: "Team Leader", email: "arastu@secretingredient.co.in"    },
    { name: "Aparajita Mathur",  role: "Team Leader", email: "aparajita@secretingredient.co.in" },
    { name: "Preeti Agarwal",    role: "Team Leader", email: "preeti@secretingredient.co.in"    },
    { name: "Deepa Panchal",     role: "Team Leader", email: "hr@secretingredient.co.in"        },
    { name: "Avantika Mehra",    role: "Team Leader", email: "avantika@secretingredient.co.in"  },
    { name: "Ethan Rigo",        role: "Team Leader", email: "ethan@secretingredient.co.in"     },
    { name: "Bhaskar Panday",    role: "Team Leader", email: "accounts@secretingredient.co.in"  },
  ];

  members.forEach(function(m) {
    ts.appendRow([Utilities.getUuid(), m.name, m.role, m.email, now, true, by, ""]);
  });
  Logger.log("✓ Team members inserted: " + members.length);

  // ── 2. CLIENTS ───────────────────────────────────────────────────────────────
  var cs = ss.getSheetByName(SHEET_NAMES.CLIENTS);
  if (!cs) {
    Logger.log("❌ Clients sheet not found — skipping.");
  } else {
    // Each name is a SINGLE person / entity.
    // Projects reference multiple clients by comma-separated name string (multi-select).
    var clients = [
      // TIMEOUT
      "Piyush",
      // LIMITED EDT
      "Vishesh Sahni",
      // 101 CIRCLE  (was one entry "Yashvir, Mansi, Mayank" — now 3 separate)
      "Yashvir", "Mansi", "Mayank",
      // ANDREA'S AUDITS
      "Nikhil Kaushik",
      // ROOH  (was "Ajit, Abhishek" — now 2 separate)
      "Ajit", "Abhishek",
      // BASK projects
      "Batasha", "Alisha", "Sid", "Kula",
      // VAISHNAVI  (was "Vaishnavi, Abhishek, Vibhor" — now 3 separate;
      //             "Abhishek" above is the same person, so NOT duplicated here)
      "Vaishnavi", "Vibhor",
      // BASCO & FRY  (was "Karan, Ritika" — now 2 separate)
      "Karan", "Ritika",
      // remaining single-client projects
      "Kunal Gupta", "Abhay Jindal", "Siddharth Mathur",
      "Saurabh Khanna", "Stephen Beale", "Danish Din",
      "Zain", "Shivika Kothari", "Anubhav",
    ];
    clients.forEach(function(name) {
      cs.appendRow([Utilities.getUuid(), name, "", now, true, by]);
    });
    Logger.log("✓ Clients inserted: " + clients.length);
  }

  // ── 3. PROJECTS ──────────────────────────────────────────────────────────────
  var ps = ss.getSheetByName(SHEET_NAMES.PROJECTS);
  if (!ps) {
    Logger.log("❌ Projects sheet not found — skipping projects and tasks.");
    return;
  }

  function dt(str) { return str ? new Date(str) : ""; }

  // Store IDs so tasks can reference them immediately
  var projectIds = {};

  var projects = [
    { name: "TIMEOUT",           client: "Piyush",                       start: "",           end: "",           lead: "kshitija@secretingredient.co.in",   manager: "Kshitija Kohli",   members: "Dev Ratra, Esha Moolchandani" },
    { name: "LIMITED EDT",       client: "Vishesh Sahni",                start: "2026-04-01", end: "2026-09-30", lead: "vallrie@secretingredient.co.in",    manager: "Vallrie Agrawal",  members: "Esha Moolchandani, Jasmeet Mehta, Dev Ratra" },
    { name: "101 CIRCLE",        client: "Yashvir, Mansi, Mayank",       start: "2026-04-01", end: "2026-09-30", lead: "vallrie@secretingredient.co.in",    manager: "Vallrie Agrawal",  members: "Dev Ratra, Esha Moolchandani" },
    { name: "ANDREA'S AUDITS",   client: "Nikhil Kaushik",               start: "2026-03-16", end: "2026-05-31", lead: "esha@secretingredient.co.in",       manager: "Esha Moolchandani", members: "Vallrie Agrawal" },
    { name: "ROOH",              client: "Ajit, Abhishek",               start: "2026-01-19", end: "2026-05-18", lead: "vallrie@secretingredient.co.in",    manager: "Vallrie Agrawal",  members: "Jasmeet Mehta, Arastu Chaturvedi" },
    { name: "BASK - BRUNCH BRAND", client: "Batasha, Alisha, Sid, Kula", start: "2026-01-29", end: "",           lead: "vallrie@secretingredient.co.in",    manager: "Vallrie Agrawal",  members: "Jasmeet Mehta" },
    { name: "BASK - SOUTH INDIAN", client: "Batasha, Alisha, Sid, Kula", start: "2026-01-29", end: "",           lead: "vallrie@secretingredient.co.in",    manager: "Vallrie Agrawal",  members: "Arastu Chaturvedi" },
    { name: "VAISHNAVI",         client: "Vaishnavi, Abhishek, Vibhor",  start: "2025-12-16", end: "2026-09-30", lead: "vallrie@secretingredient.co.in",    manager: "Vallrie Agrawal",  members: "Esha Moolchandani, Arastu Chaturvedi" },
    { name: "BASCO & FRY",       client: "Karan, Ritika",                start: "2025-07-01", end: "",           lead: "vallrie@secretingredient.co.in",    manager: "Vallrie Agrawal",  members: "Aparajita Mathur, Kshitija Kohli" },
    { name: "SOVEREIGN INFRA",   client: "Kunal Gupta",                  start: "2025-07-24", end: "",           lead: "dev@secretingredient.co.in",        manager: "Dev Ratra",        members: "Kshitija Kohli" },
    { name: "HOMELAND",          client: "Abhay Jindal",                 start: "2025-02-01", end: "",           lead: "dev@secretingredient.co.in",        manager: "Dev Ratra",        members: "Aparajita Mathur, Jasmeet Mehta" },
    { name: "KHOYA",             client: "Siddharth Mathur",             start: "2025-02-01", end: "",           lead: "aparajita@secretingredient.co.in",  manager: "Aparajita Mathur", members: "Vallrie Agrawal, Jasmeet Mehta" },
    { name: "SELEQTIONS",        client: "Saurabh Khanna",               start: "2025-09-13", end: "",           lead: "vallrie@secretingredient.co.in",    manager: "Vallrie Agrawal",  members: "Dev Ratra" },
    { name: "MAYFAIR",           client: "Stephen Beale",                start: "",           end: "",           lead: "dev@secretingredient.co.in",        manager: "Dev Ratra",        members: "Aparajita Mathur, Arastu Chaturvedi" },
    { name: "GRAND DRAGON",      client: "Danish Din",                   start: "2022-08-01", end: "",           lead: "jasmeet@secretingredient.co.in",    manager: "Jasmeet Mehta",    members: "Aparajita Mathur, Arastu Chaturvedi" },
    { name: "CAFE WILO",         client: "Zain",                         start: "2025-04-01", end: "2027-04-01", lead: "jasmeet@secretingredient.co.in",    manager: "Jasmeet Mehta",    members: "Aparajita Mathur, Arastu Chaturvedi" },
    { name: "MERAAKIIWS",        client: "Shivika Kothari",              start: "2025-03-01", end: "",           lead: "aparajita@secretingredient.co.in",  manager: "Aparajita Mathur", members: "Esha Moolchandani, Dev Ratra" },
    { name: "SILVERGLADES",      client: "Anubhav",                      start: "",           end: "",           lead: "kshitija@secretingredient.co.in",   manager: "Kshitija Kohli",   members: "Dev Ratra" },
  ];

  projects.forEach(function(p) {
    var id = Utilities.getUuid();
    projectIds[p.name] = id;
    ps.appendRow([
      id, p.name, p.client, dt(p.start), dt(p.end), "",
      p.manager, p.members, p.lead, "Active", now, by, "",
    ]);
  });
  Logger.log("✓ Projects inserted: " + projects.length);

  // ── 4. TASKS ─────────────────────────────────────────────────────────────────
  var tkSheet = ss.getSheetByName(SHEET_NAMES.TASKS);
  if (!tkSheet) {
    Logger.log("❌ Tasks sheet not found — skipping tasks.");
    return;
  }

  // Helper: build a task row
  // freq: "One Time" | "Daily" | "Alternate Days" | "Weekly"
  // dow:  day of week for Weekly tasks e.g. "Mon","Tue","Wed","Thu","Fri"
  function tk(name, assignedTo, dueStr, freq, dow) {
    return {
      name: name,
      assignedTo: assignedTo || "",
      due: dueStr ? new Date(dueStr) : "",
      freq: freq || "One Time",
      dow: (freq === "Weekly" && dow) ? dow : "",
    };
  }

  // Avatar initial → full name mapping (from screenshots)
  // KK=Kshitija Kohli  DR=Dev Ratra  EM=Esha Moolchandani  VA=Vallrie Agrawal
  // JM=Jasmeet Mehta   AC=Arastu Chaturvedi  AP/AM=Aparajita Mathur
  // NS=Neha Sharma  PA=Preeti Agarwal  DP=Deepa Panchal  HA=Hitesh Arora

  var taskMap = {

    "TIMEOUT": [
      tk("Brands Reach Out",           ""),
      tk("Revenue Assumptions",        "Dev Ratra",      "2026-05-27"),
      tk("Hiring - Marketing & GM",    "Neha Sharma",    "2026-05-29"),
      tk("Business Plan",              "Dev Ratra",      "2026-05-27"),
    ],

    "LIMITED EDT": [
      tk("PRESENT FOOD MENU",          "Esha Moolchandani"),
      tk("KITCHEN MEPS",               "Vallrie Agrawal"),
      tk("REMIND CLIENT FOR AGREEMENT","Vallrie Agrawal"),
      tk("FOOD MENU FINAL DRAFT",      "Esha Moolchandani"),
      tk("SHARE CCG BOQ",              "Esha Moolchandani"),
      tk("TABLE SETTING DECK",         "Esha Moolchandani"),
      tk("WEEKLY CALL - THURSDAY",     "",               "", "Weekly", "Thu"),
    ],

    "101 CIRCLE": [
      tk("PRESENT ROOFTOP MENU",           "Preeti Agarwal",  "2026-05-27"),
      tk("WEEKLY CALL - WEDNESDAY",        "Vallrie Agrawal", "", "Weekly", "Wed"),
      tk("REVISED ROOFTOP LAYOUT",         "Vallrie Agrawal", "2026-05-25"),
      tk("REVISED INDIAN RESTAURANT LAYOUT","Vallrie Agrawal","2026-05-25"),
      tk("GROUND FLOOR KITCHEN LAYOUT",    "Vallrie Agrawal"),
      tk("ROOFTOP MENU FINAL DRAFT",       "Preeti Agarwal"),
    ],

    "ANDREA'S AUDITS": [
      tk("SEND FINAL SOPS",        "Esha Moolchandani", "2026-05-22"),
      tk("SOPS INTERNAL REVIEW",   "Esha Moolchandani"),
    ],

    "ROOH": [
      tk("HOT STONE BOWL OPTIONS",    ""),
      tk("ASH TRAY OPTIONS",          "Jasmeet Mehta"),
      tk("CUTLER PI",                 "Vallrie Agrawal"),
      tk("TABLE SETTING ITEMS BOQ",   "Vallrie Agrawal"),
      tk("JS PI",                     "Vallrie Agrawal"),
      tk("HEAD CHEF HIRING",          "Neha Sharma"),
      tk("PIZZA CDP",                 "Neha Sharma"),
      tk("WOK CDP",                   "Neha Sharma"),
      tk("ASIAN CDP",                 "Neha Sharma"),
      tk("HIRING",                    ""),
      tk("WEEKLY CALL - FOLLOW UPS",  "", "", "Weekly", "Mon"),
    ],

    "BASK - BRUNCH BRAND": [
      tk("CONTACT ELEMENTARY B2B",     "Jasmeet Mehta"),
      tk("TABLE SETUP IDEAS",          "Vallrie Agrawal"),
      tk("CCG & TABLE SETUP SAMPLING", "Vallrie Agrawal"),
      tk("BEVERAGE MENU IDEAS",        "Dev Ratra"),
      tk("SHARE CCG BOQ",              "Vallrie Agrawal"),
      tk("HIRING",                     "Neha Sharma"),
    ],

    "BASK - SOUTH INDIAN": [
      tk("CUTLERY SAMPLING COST",              "Vallrie Agrawal"),
      tk("DEVNOW SAMPLING",                    ""),
      tk("METALWARE JS/CUTLR",                 "Arastu Chaturvedi"),
      tk("MITTI BRAND - CUSTOMISATION",        "Esha Moolchandani"),
      tk("HAUZ RANI MARKET VENDOR",            "Arastu Chaturvedi"),
      tk("CCG & TABLE SETUP SAMPLING - ONGOING","Arastu Chaturvedi"),
      tk("SHARE CCG BOQ",                      "Arastu Chaturvedi"),
      tk("SOUTH INDIAN CHEF",                  "Neha Sharma"),
      tk("HOPPER CAST IRON VENDOR",            "Vallrie Agrawal"),
      tk("CDPs - VIZAG CHEF - HIRING",         ""),
    ],

    "VAISHNAVI": [
      tk("FITOUT TO BEGIN",        "Dev Ratra"),
      tk("WEEKLY CALL - TUESDAY",  "Vallrie Agrawal", "", "Weekly", "Tue"),
    ],

    "BASCO & FRY": [
      tk("UNIFORM DESIGN",                ""),
      tk("PRE-OPENING CHECKLIST",         "Aparajita Mathur", "2026-05-27"),
      tk("CENTREPIECE DIRECTORY",         "Aparajita Mathur"),
      tk("WET WIPES",                     "Aparajita Mathur"),
      tk("CUTLERY POUCH SAMPLE REWORK",   "Vallrie Agrawal"),
      tk("TISSUE HOLDER JS",              "Aparajita Mathur"),
      tk("STEAK KNIFE OPTION",            "Vallrie Agrawal",  "2026-05-31"),
      tk("CUTLERY DESIGN",                "Aparajita Mathur"),
      tk("CHEF - INTERVIEWS",             "Aparajita Mathur"),
      tk("WEEKLY CALL FOLLOW UPS",        "Aparajita Mathur", "", "Weekly", "Mon"),
      tk("BANGALORE BRANDS FOR CDP",      ""),
      tk("LAUNCH - MAY",                  ""),
      tk("SOUS CHEF HIRING",              "Neha Sharma"),
      tk("BARISTA HIRING",                "Neha Sharma"),
      tk("MIXOLOGIST HIRING",             "Neha Sharma"),
    ],

    "SOVEREIGN INFRA": [
      tk("Lease Signing for brands", "", "2026-05-23"),
      tk("FIND A GOOD BAR",         ""),
      tk("INVOLVE REALTORS",        ""),
      tk("Reach Out To Brands",     ""),
    ],

    "HOMELAND": [
      tk("PLAN FOR FINAL OVAL CAFE TRIALS WITH PRESENTATION", "Jasmeet Mehta",    "2026-06-05"),
      tk("MINICONCEPTS FOR TERRACE",                          "Dev Ratra",         "2026-05-23"),
      tk("TABLE SETTING - ALL F&B SPACES",                   "Aparajita Mathur",  "2026-05-29"),
      tk("PHASE 1 TRIALS - OVAL CAFE FINAL",                 ""),
      tk("PACKAGING IDEAS DECK",                             ""),
      tk("ROADMAP FOR THE F&B SPACES",                       "Aparajita Mathur"),
    ],

    "KHOYA": [
      tk("BUTTER MOULD DESIGN",                            ""),
      tk("RESERVE GO - TO BE BROUGHT ON BOARD CLOSER TO LAUNCH", ""),
      tk("CCG",                                            ""),
      tk("WATER PROOFING/SCREEDING TO BEGIN",              ""),
      tk("SITE HANDOVER",                                  ""),
      tk("CLOSE DRAWINGS - APPROVAL FROM GODREJ",          "Aparajita Mathur"),
      tk("PROGRESS REPORT - ONGOING",                      "Aparajita Mathur"),
      tk("BEVERAGE MENU",                                  ""),
      tk("HIRING HEAD CHEF",                               "Deepa Panchal"),
      tk("HIRING RM",                                      "Deepa Panchal"),
      tk("LAUNCH - TBD",                                   ""),
    ],

    "SELEQTIONS": [
      tk("PREPARE DESIGN BRIEF FOR POOLSIDE", "Vallrie Agrawal"),
      tk("PHASE 1 CLOSURE",                  "Vallrie Agrawal"),
    ],

    "MAYFAIR": [
      tk("ALIGN A MEETING WITH SID AND STEPHEN REGARDING ARCADE", "",           "2026-05-21"),
      tk("MONTHLY REPORT",                                        "Dev Ratra",  "2026-07-05"),
      tk("UPDATES TO BE SHARED ON ALTERNATE DAYS",               "Dev Ratra",  "", "Alternate Days"),
      tk("HIRING - Tiffany, Leather Bar, ADD",                   "Neha Sharma"),
      tk("GLASSWARE BOQ - ADD, LEATHER BAR, TIFFANY",            "Dev Ratra",  "2026-05-23"),
      tk("SOFT LAUNCH - SEPTEMBER 2026",                         ""),
    ],

    "GRAND DRAGON": [
      tk("REVAMP ADD BUFFET",                   "Hitesh Arora"),
      tk("LADAKHI CHEF'S TABLE",               ""),
      tk("OREEN ADD CROCKERY ISSUE",           "Hitesh Arora"),
      tk("DUMMY WAITER & SIDE STATION",        ""),
      tk("HIRING RM - PRIORITY",               "Neha Sharma"),
      tk("Bar Hiring",                         "Neha Sharma"),
      tk("BUFFET COUNTER - HOT PLATE REDO WITH HAKS", "Hitesh Arora"),
    ],

    "CAFE WILO": [
      tk("MAY VISIT",                          "Jasmeet Mehta"),
      tk("CCG BOQ",                            "Aparajita Mathur"),
      tk("VIRTUAL BRAND AUDIT",               "Aparajita Mathur"),
      tk("PHOTOS OF FOOD & FEEDBACK TO BE SHARED", ""),
      tk("WEEKLY CALL WITH RAWAT AND SHAKIR",  "Jasmeet Mehta", "", "Weekly", "Mon"),
      tk("TAKE DAILY UPDATES",                "Jasmeet Mehta", "", "Daily"),
    ],

    "MERAAKIIWS": [
      tk("REVISED LAYOUTS - KITCHEN",                   "Aparajita Mathur", "2026-02-24"),
      tk("IMAGES OF KITCHEN AND OUTDOOR SPACE TO BE SHARED", ""),
      tk("REVISED TRIAL DATES",                         ""),
      tk("TRIAL PLAN + TIMELINES - CWS",               ""),
      tk("FOOD TRIALS - CWS",                          ""),
      tk("LAUNCH DECEMBER - CWS",                      ""),
      tk("LEHARIYA MENU",                              "Kshitija Kohli"),
      tk("RM HIRING",                                  "Deepa Panchal"),
      tk("CCG - MERAAKI KITCHEN",                      "Aparajita Mathur"),
      tk("BEVERAGE MENU - MERAAKI KITCHEN",            "Aparajita Mathur"),
    ],

    "SILVERGLADES": [
      tk("SEND AN EMAIL FOR CLOSURE AND PIPELINE", ""),
      tk("REACH OUT TO BRANDS",                   ""),
      tk("MALL LAUNCH DATE - END OF DEC",         ""),
    ],
  };

  var totalTasks = 0;
  var projectNames = Object.keys(taskMap);

  projectNames.forEach(function(projName) {
    var projId = projectIds[projName];
    if (!projId) {
      Logger.log("⚠ Project ID not found for: " + projName + " — skipping its tasks.");
      return;
    }
    var tasks = taskMap[projName];
    tasks.forEach(function(t) {
      tkSheet.appendRow([
        Utilities.getUuid(),  // ID
        projId,               // Project ID
        t.name,               // Name
        t.assignedTo,         // Assigned To
        t.due,                // Due Date
        "In Progress",        // Status
        "Medium",             // Priority
        "",                   // Notes
        now,                  // Created Date
        "",                   // Completed Date
        by,                   // Created By
        "",                   // Approval Status
        "",                   // Approval Remarks
        "",                   // Approved By
        "",                   // Approved Date
        t.freq,               // Frequency
        t.dow,                // Day Of Week
        "",                   // Task Approver
      ]);
      totalTasks++;
    });
    Logger.log("  ✓ " + projName + " — " + tasks.length + " task(s)");
  });

  Logger.log("✓ Tasks inserted: " + totalTasks);
  Logger.log("✅ Import complete. 14 members · 20 clients · 18 projects · " + totalTasks + " tasks.");
  Logger.log("⚠ ROOH deadline 18-May-2026 is past — will show as Overdue.");
  Logger.log("⚠ MERAAKIIWS 'REVISED LAYOUTS - KITCHEN' due 24-Feb-2026 is past.");
}
