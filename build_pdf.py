"""
SIP Client Guide PDF — spreadsheet.dev-inspired clean article style
Run: python build_pdf.py
"""
import os
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Image as RLImage,
                                 Table, TableStyle, HRFlowable, PageBreak, KeepTogether)
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import Frame, PageTemplate
from reportlab.lib.units import mm
from PIL import Image as PILImage

W, H = A4
ML = MR = 56          # wider margins for article feel
MT = MB = 48
CW = W - ML - MR      # ~483 pt

BASE   = 'C:/Users/saksh/Desktop/SIP/'
OUTPUT = BASE + 'SIP_Client_Guide.pdf'

# ── Palette (minimal, mostly dark-on-white) ───────────────────────────────────
NAVY    = HexColor('#1B2B4B')
BLUE    = HexColor('#2563EB')
TEAL    = HexColor('#0891B2')
GREEN   = HexColor('#059669')
AMBER   = HexColor('#D97706')
PURPLE  = HexColor('#7C3AED')
G1      = HexColor('#111827')   # near-black body
G2      = HexColor('#4B5563')   # secondary text
G3      = HexColor('#9CA3AF')   # captions, meta
BORDER  = HexColor('#E5E7EB')   # screenshot border
DIVIDER = HexColor('#F3F4F6')

LBLUE   = HexColor('#EFF6FF')
LAMBER  = HexColor('#FFFBEB')
LGREEN  = HexColor('#F0FDF4')
LRED    = HexColor('#FEF2F2')

# ── Typography ────────────────────────────────────────────────────────────────
page_title  = ParagraphStyle('pt', fontName='Helvetica-Bold', fontSize=26,
                textColor=NAVY, leading=32, spaceAfter=6, spaceBefore=0, alignment=TA_LEFT)
page_sub    = ParagraphStyle('ps', fontName='Helvetica', fontSize=12,
                textColor=G2, leading=18, spaceAfter=24, alignment=TA_LEFT)
sec_num_s   = ParagraphStyle('sn', fontName='Helvetica-Bold', fontSize=11,
                textColor=TEAL, leading=14, spaceAfter=2, spaceBefore=28)
sec_head    = ParagraphStyle('sh', fontName='Helvetica-Bold', fontSize=18,
                textColor=NAVY, leading=24, spaceAfter=6, spaceBefore=0)
sec_desc    = ParagraphStyle('sd', fontName='Helvetica', fontSize=11,
                textColor=G2, leading=16, spaceAfter=14, spaceBefore=0)
h3_s        = ParagraphStyle('h3', fontName='Helvetica-Bold', fontSize=12,
                textColor=G1, leading=16, spaceAfter=6, spaceBefore=14)
body        = ParagraphStyle('bd', fontName='Helvetica', fontSize=11,
                textColor=G1, leading=17, spaceAfter=6, spaceBefore=2)
bullet_s    = ParagraphStyle('bl', fontName='Helvetica', fontSize=11,
                textColor=G1, leading=17, spaceAfter=4, spaceBefore=0, leftIndent=16)
caption_s   = ParagraphStyle('cp', fontName='Helvetica-Oblique', fontSize=9,
                textColor=G3, alignment=TA_CENTER, spaceAfter=14, spaceBefore=5)
cover_title = ParagraphStyle('cvt', fontName='Helvetica-Bold', fontSize=34,
                textColor=white, leading=40, alignment=TA_CENTER)
cover_sub   = ParagraphStyle('cvs', fontName='Helvetica', fontSize=15,
                textColor=HexColor('#CADCFC'), alignment=TA_CENTER, leading=22)
cover_url   = ParagraphStyle('cvu', fontName='Helvetica-Oblique', fontSize=12,
                textColor=HexColor('#93C5FD'), alignment=TA_CENTER)
cover_foot  = ParagraphStyle('cvf', fontName='Helvetica', fontSize=10,
                textColor=HexColor('#64748B'), alignment=TA_CENTER)
toc_head    = ParagraphStyle('tch', fontName='Helvetica-Bold', fontSize=14,
                textColor=NAVY, leading=18, spaceAfter=14)
toc_item    = ParagraphStyle('tci', fontName='Helvetica', fontSize=11,
                textColor=G2, leading=20, leftIndent=8)

# ── Helpers ───────────────────────────────────────────────────────────────────

def img(path, cap=None, w_pct=1.0):
    """Screenshot with thin border + optional caption."""
    try:
        pil = PILImage.open(path)
        ow, oh = pil.size
        iw = CW * w_pct
        ih = iw * oh / ow
        # Wrap in a table to get a border frame
        frame = Table(
            [[RLImage(path, width=iw, height=ih)]],
            colWidths=[iw],
            style=TableStyle([
                ('BOX',           (0,0),(-1,-1), 0.75, BORDER),
                ('TOPPADDING',    (0,0),(-1,-1), 0),
                ('BOTTOMPADDING', (0,0),(-1,-1), 0),
                ('LEFTPADDING',   (0,0),(-1,-1), 0),
                ('RIGHTPADDING',  (0,0),(-1,-1), 0),
            ])
        )
        els = [Spacer(1, 8), frame]
        if cap:
            els.append(Paragraph(cap, caption_s))
        else:
            els.append(Spacer(1, 12))
        return els
    except:
        return [Paragraph(f'[Image: {os.path.basename(path)}]', caption_s)]

def section_start(number, title, subtitle=None):
    """Clean section header — number label + large title + divider."""
    els = [
        HRFlowable(width=CW, thickness=0.75, color=BORDER, spaceAfter=20, spaceBefore=8),
        Paragraph(f'SECTION {number}', sec_num_s),
        Paragraph(title, sec_head),
    ]
    if subtitle:
        els.append(Paragraph(subtitle, sec_desc))
    else:
        els.append(Spacer(1, 8))
    return els

def note_box(text, color=AMBER, bg=LAMBER, tc=HexColor('#92400E')):
    """Left-border callout box — article style."""
    st = ParagraphStyle('nb', fontName='Helvetica', fontSize=10.5,
                        textColor=tc, leading=15, leftIndent=4)
    inner = Table(
        [[Paragraph(text, st)]],
        colWidths=[CW - 16],
        style=TableStyle([
            ('BACKGROUND',    (0,0),(-1,-1), bg),
            ('TOPPADDING',    (0,0),(-1,-1), 10),
            ('BOTTOMPADDING', (0,0),(-1,-1), 10),
            ('LEFTPADDING',   (0,0),(-1,-1), 12),
            ('RIGHTPADDING',  (0,0),(-1,-1), 12),
        ])
    )
    # Left accent border
    outer = Table(
        [[Table([['']], colWidths=[4],
                style=TableStyle([('BACKGROUND',(0,0),(-1,-1),color),
                                  ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0),
                                  ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0)])),
          inner]],
        colWidths=[4, CW - 4],
        style=TableStyle([
            ('TOPPADDING',    (0,0),(-1,-1), 0),
            ('BOTTOMPADDING', (0,0),(-1,-1), 0),
            ('LEFTPADDING',   (0,0),(-1,-1), 0),
            ('RIGHTPADDING',  (0,0),(-1,-1), 0),
            ('VALIGN',        (0,0),(-1,-1), 'STRETCH'),
        ])
    )
    return [outer, Spacer(1, 10)]

def step_row(num, title, desc, color=TEAL):
    """Clean numbered step — large circle, bold title, grey description."""
    num_s = ParagraphStyle('ns2', fontName='Helvetica-Bold', fontSize=11,
                           textColor=white, alignment=TA_CENTER, leading=15)
    tit_s = ParagraphStyle('ts2', fontName='Helvetica-Bold', fontSize=11,
                           textColor=G1, leading=15, spaceAfter=2)
    dsc_s = ParagraphStyle('ds2', fontName='Helvetica', fontSize=10.5,
                           textColor=G2, leading=14)
    circ = Table(
        [[Paragraph(str(num), num_s)]],
        colWidths=[22], rowHeights=[22],
        style=TableStyle([
            ('BACKGROUND',    (0,0),(-1,-1), color),
            ('TOPPADDING',    (0,0),(-1,-1), 3),
            ('BOTTOMPADDING', (0,0),(-1,-1), 3),
            ('LEFTPADDING',   (0,0),(-1,-1), 0),
            ('RIGHTPADDING',  (0,0),(-1,-1), 0),
        ])
    )
    text = Table(
        [[Paragraph(title, tit_s)], [Paragraph(desc, dsc_s)]],
        colWidths=[CW - 34],
        style=TableStyle([
            ('TOPPADDING',    (0,0),(-1,-1), 0),
            ('BOTTOMPADDING', (0,0),(-1,-1), 0),
            ('LEFTPADDING',   (0,0),(-1,-1), 0),
            ('RIGHTPADDING',  (0,0),(-1,-1), 0),
        ])
    )
    row = Table(
        [[circ, text]], colWidths=[30, CW - 30],
        style=TableStyle([
            ('VALIGN',        (0,0),(-1,-1), 'TOP'),
            ('TOPPADDING',    (0,0),(-1,-1), 8),
            ('BOTTOMPADDING', (0,0),(-1,-1), 8),
            ('LEFTPADDING',   (0,0),(0,0),   4),
            ('LEFTPADDING',   (1,0),(1,0),   8),
            ('RIGHTPADDING',  (0,0),(-1,-1), 0),
            ('LINEBELOW',     (0,0),(-1,-1), 0.5, DIVIDER),
        ])
    )
    return [row]

def ref_table(data, col_widths, hdr_color=NAVY):
    """Clean reference table with header row."""
    ts = TableStyle([
        ('BACKGROUND',    (0,0),(-1,0), hdr_color),
        ('TEXTCOLOR',     (0,0),(-1,0), white),
        ('FONTNAME',      (0,0),(-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',      (0,0),(-1,-1), 9.5),
        ('FONTNAME',      (0,1),(-1,-1), 'Helvetica'),
        ('TEXTCOLOR',     (0,1),(-1,-1), G1),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [white, DIVIDER]),
        ('GRID',          (0,0),(-1,-1), 0.4, BORDER),
        ('TOPPADDING',    (0,0),(-1,-1), 7),
        ('BOTTOMPADDING', (0,0),(-1,-1), 7),
        ('LEFTPADDING',   (0,0),(-1,-1), 10),
        ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
        ('FONTSIZE',      (0,0),(-1,0), 9.5),
    ])
    return [Table(data, colWidths=col_widths, style=ts), Spacer(1, 14)]

# ══════════════════════════════════════════════════════════════════════════════
#  STORY
# ══════════════════════════════════════════════════════════════════════════════
story = []

# ── COVER ─────────────────────────────────────────────────────────────────────
cover = Table([
    [Spacer(1, 80)],
    [Paragraph('SI Project Tracker', cover_title)],
    [Spacer(1, 14)],
    [Paragraph('Client User Guide', cover_sub)],
    [Spacer(1, 22)],
    [HRFlowable(width=CW, thickness=0.5, color=HexColor('#334155'), spaceAfter=0)],
    [Spacer(1, 18)],
    [Paragraph('sip-todo.netlify.app', cover_url)],
    [Spacer(1, 90)],
    [Paragraph('Secret Ingredient Consultancy  ·  2025', cover_foot)],
], colWidths=[CW],
style=TableStyle([
    ('BACKGROUND',    (0,0),(-1,-1), NAVY),
    ('ROWBACKGROUNDS',(0,0),(-1,-1), [NAVY]),
    ('TOPPADDING',    (0,0),(-1,-1), 0),
    ('BOTTOMPADDING', (0,0),(-1,-1), 0),
    ('LEFTPADDING',   (0,0),(-1,-1), 0),
    ('RIGHTPADDING',  (0,0),(-1,-1), 0),
]))
story += [cover, PageBreak()]

# ── TABLE OF CONTENTS ─────────────────────────────────────────────────────────
story += [
    Paragraph('Contents', toc_head),
    HRFlowable(width=CW, thickness=0.75, color=BORDER, spaceAfter=12),
]
toc_items = [
    ('1', 'First-Time Login & Permissions'),
    ('2', 'Dashboard'),
    ('3', 'Projects & Tasks'),
    ('4', 'Editing a Task'),
    ('5', 'Approving Tasks  —  Team Leads'),
    ('6', 'Managing Projects  —  Admin'),
    ('7', 'Project Health Check'),
    ('8', 'Team Performance'),
    ('9', 'Clients  —  Admin'),
    ('10', 'Completed Projects'),
]
for num, label in toc_items:
    story.append(Paragraph(f'<b>{num}.</b>  {label}', toc_item))
story += [PageBreak()]

# ── SECTION 1: FIRST-TIME LOGIN ───────────────────────────────────────────────
story += section_start('01', 'First-Time Login & Permissions',
    'A one-time setup step. Once done, you will never see this screen again.')

story += note_box('⚠️  The "Unverified" warning is completely normal. '
    'Google shows this for all internal tools that have not been submitted for public verification. '
    'Your data is safe — this is your own company\'s tool built on Google Apps Script.',
    color=AMBER, bg=LAMBER, tc=HexColor('#92400E'))

story += img(BASE + 'ss_review.png',
    'The Google permission popup — click Review Permissions to continue')

story += [Paragraph('Follow these steps the first time you open the app:', h3_s)]
story += step_row(1, 'Open the app',
    'Navigate to sip-todo.netlify.app in Chrome.')
story += step_row(2, 'Click "Review Permissions"',
    'A Google Apps Script popup appears. Click the blue Review Permissions button.')
story += step_row(3, 'Select your Google account',
    'Choose the work email your admin registered for you — not a personal account.')
story += step_row(4, 'Click "Advanced" (small grey text, bottom-left)',
    'On the "Google hasn\'t verified this app" screen, look for the small Advanced link.')
story += step_row(5, 'Click "Go to SI_FINAL (unsafe)" → then Allow',
    'This grants the app the permissions it needs. You are now signed in permanently.')

story += [Spacer(1, 10)]
story += note_box('💡  If the popup keeps reappearing, check that you are using the correct '
    'Google account — the one your admin registered for you.',
    color=BLUE, bg=LBLUE, tc=HexColor('#1E40AF'))
story += [PageBreak()]

# ── SECTION 2: DASHBOARD ─────────────────────────────────────────────────────
story += section_start('02', 'Dashboard',
    'Your at-a-glance overview of all projects, tasks and recent activity.')

story += img(BASE + 'ss_dashboard.png', 'Dashboard — KPI cards, charts and recent activity feed')

story += [Paragraph('The five KPI cards across the top summarise the current state of all work:', h3_s)]
story += ref_table([
    ['KPI',               'What it means'],
    ['Active Projects',   'Total projects currently in progress'],
    ['Total Tasks',       'All tasks across every project'],
    ['Pending Tasks',     'Tasks with status "In Progress"'],
    ['Overdue Tasks',     'Tasks past their due date, not yet completed'],
    ['Awaiting Approval', 'Tasks marked Completed but not yet reviewed by the Team Lead'],
], [160, CW - 160])

story += [Paragraph(
    'The three charts below the KPIs show task status breakdown, project health '
    '(active vs completed), and your client portfolio split. '
    'The Recent Projects and Recent Tasks panels at the bottom give a quick view of '
    'the latest activity across the team.', body)]
story += [PageBreak()]

# ── SECTION 3: PROJECTS & TASKS ───────────────────────────────────────────────
story += section_start('03', 'Projects & Tasks',
    'Your main working view — all active projects and their tasks, grouped by client.')

story += img(BASE + 'ss_projects.png',
    'Projects & Tasks — projects grouped by client, with tasks listed underneath')

story += [Paragraph('Each project card shows the project name, status badge (Active / On Hold), '
    'manager, Team Lead, team members, deadline and a task completion progress bar. '
    'Tasks are listed below with assignee, due date, status and priority.', body)]

story += [Paragraph('Task action buttons', h3_s)]
story += [Paragraph('Each task row has action buttons on the right side:', body)]
story += ref_table([
    ['Button',   'Who can use',               'What it does'],
    ['✅ Complete','Assigned member, TL, Admin','Instantly marks task as Completed and sends for Team Lead review'],
    ['✏️ Edit',   'Assigned member, TL, Admin','Opens edit modal — change name, date, status, priority, notes'],
    ['👤 Reassign','TL, Admin',                'Transfer the task to a different team member'],
    ['⚖️ Approve','Team Lead, Admin',          'Opens approval panel — visible only on Pending Review tasks'],
    ['🗑️ Delete', 'Admin only',               'Permanently removes the task'],
], [68, 120, CW - 188], hdr_color=TEAL)
story += [PageBreak()]

# ── SECTION 4: EDITING A TASK ─────────────────────────────────────────────────
story += section_start('04', 'Editing a Task',
    'Update task details, status, notes and file attachments.')

story += img(BASE + 'ss_task_edit.png',
    'Edit Task modal — all fields available to Team Leads and Admins')

story += [Paragraph(
    'Click the ✏️ pencil icon on any task row to open the Edit Task panel. '
    'What you can edit depends on your role:', body)]

story += ref_table([
    ['Field',          'Who can edit',   'Notes'],
    ['Task Name',      'TL / Admin',     'Required field'],
    ['Assigned To',    'TL / Admin',     'Searchable dropdown of all team members'],
    ['Due Date',       'TL / Admin',     'Target completion date'],
    ['Priority',       'TL / Admin',     'Low / Medium / High'],
    ['Status',         'Everyone',       'Set to Completed when the work is done'],
    ['Task Approver',  'TL / Admin',     'Override the default project lead for this task only'],
    ['Notes',          'Everyone',       'Add context, blockers or instructions'],
    ['Attachments',    'Everyone',       'Upload files up to 5 MB — stored in Google Drive'],
], [110, 100, CW - 210], hdr_color=BLUE)

story += note_box(
    '💡  Staff members (non-leads) only see the Status and Notes fields when editing. '
    'The full edit form with all fields is shown to Team Leads and Admins only.',
    color=BLUE, bg=LBLUE, tc=HexColor('#1E40AF'))
story += [PageBreak()]

# ── SECTION 5: APPROVING TASKS ────────────────────────────────────────────────
story += section_start('05', 'Approving Tasks',
    'For Team Leads — review completed work before it is marked officially done.')

story += img(BASE + 'ss_approval.png',
    'Review Task Completion panel — choose Approve or Reject and add optional feedback')

story += [Paragraph(
    'When a team member marks a task as Completed, it enters "Pending Review" state. '
    'The Team Lead (or designated approver) sees a ⚖️ gavel button appear on that task row.', body)]

story += [Paragraph('How to approve or reject a task', h3_s)]
story += step_row(1, 'Find tasks with the "Pending Review" badge',
    'Look for the amber Pending Review label on task names in the Projects page.',
    color=AMBER)
story += step_row(2, 'Click the ⚖️ Approve button',
    'The gavel icon on the right side of the task row opens the Review Task Completion panel.',
    color=TEAL)
story += step_row(3, 'Choose Approve or Reject',
    'Approve = task is fully done (green Approved badge). '
    'Reject = sends it back to In Progress for rework.',
    color=BLUE)
story += step_row(4, 'Add Feedback / Remarks (recommended when rejecting)',
    'Your remark appears highlighted in red on the task card so the team member knows exactly what to fix.',
    color=PURPLE)
story += step_row(5, 'Click Submit Decision',
    'The status updates instantly for the whole team — no page refresh needed.',
    color=GREEN)

story += [Spacer(1, 10)]
story += note_box(
    'ℹ️  Only the project\'s Team Lead, the designated task approver, or an Admin '
    'can see and use the approval button. Regular staff members do not see it.',
    color=BLUE, bg=LBLUE, tc=HexColor('#1E40AF'))
story += [PageBreak()]

# ── SECTION 6: MANAGING PROJECTS ─────────────────────────────────────────────
story += section_start('06', 'Managing Projects',
    'Admin only — create, edit, pause and delete projects.')

story += img(BASE + 'ss_projectedit.png',
    'Edit Project modal — configure all project settings including team and dates')

story += [Paragraph(
    'Click the ✏️ pencil icon on any project card header to edit it. '
    'Admins can also ⏸ pause (put On Hold) or 🗑️ delete a project '
    'from the same row of action buttons.', body)]

story += ref_table([
    ['Field',           'Description'],
    ['Project Name',    'Display name shown throughout the app'],
    ['Client',          'Linked client from your Clients list'],
    ['Client Type',     'Category tag for portfolio reporting'],
    ['Start Date',      'Project start — used for velocity calculations in Health Check'],
    ['Deadline',        'Target delivery date — drives RAG status and overdue flags'],
    ['Project Manager', 'Internal owner — must have Admin or Team Leader role'],
    ['Project Lead',    'Approves tasks at first stage (default approver for all tasks)'],
    ['Status',          'Active / On Hold'],
    ['Staff Members',   'All team members on this project — searchable multi-select'],
], [130, CW - 130], hdr_color=PURPLE)

story += note_box(
    '💡  Setting a Start Date and Deadline unlocks velocity tracking and the expected '
    'progress indicator on the Health Check page.',
    color=PURPLE, bg=HexColor('#F5F3FF'), tc=HexColor('#5B21B6'))
story += [PageBreak()]

# ── SECTION 7: HEALTH CHECK ──────────────────────────────────────────────────
story += section_start('07', 'Project Health Check',
    'RAG status at a glance — Red, Amber, Green for every active project.')

story += img(BASE + 'ss_health.png',
    'Health Check — project cards colour-coded by RAG status')

story += ref_table([
    ['Status',   'Colour',  'When it appears'],
    ['Critical', '🔴 Red',  'One or more tasks overdue, OR project deadline has passed'],
    ['At Risk',  '🟡 Amber','Tasks awaiting approval, OR deadline within 7 days with unapproved tasks'],
    ['On Track', '🟢 Green','All tasks on schedule, nothing overdue'],
    ['On Hold',  '⚫ Grey', 'Project is paused — no action required'],
], [68, 68, CW - 136])

story += [Paragraph('Each project card also shows:', h3_s)]
story += [Paragraph('• <b>Task Completion bar</b> — actual % done vs expected % based on elapsed timeline.', bullet_s)]
story += [Paragraph('• <b>Expected % marker</b> — the black line shows where you should be today.', bullet_s)]
story += [Paragraph('• <b>Manpower Efficiency bar</b> — weighted task completion based on day-effort allocated.', bullet_s)]
story += [Paragraph('• <b>Velocity badge</b> — ratio of actual vs expected pace. 1.0x = exactly on track. >1.0x = ahead.', bullet_s)]
story += [Paragraph('• <b>Deadline chip</b> — days remaining or overdue at a glance.', bullet_s)]
story += [Spacer(1, 8)]
story += note_box(
    '💡  Click any KPI pill at the top (Critical / At Risk / On Track / On Hold) '
    'to filter the project cards below to that status group only.',
    color=BLUE, bg=LBLUE, tc=HexColor('#1E40AF'))
story += [PageBreak()]

# ── SECTION 8: TEAM PERFORMANCE ──────────────────────────────────────────────
story += section_start('08', 'Team Performance',
    'Admin / Team Lead — individual productivity metrics and workload overview.')

story += img(BASE + 'ss_team.png',
    'Team Performance — per-member workload cards with task breakdowns')

story += [Paragraph('Each team member card shows:', h3_s)]
story += ref_table([
    ['Metric',          'Description'],
    ['Total',           'All tasks assigned across all projects'],
    ['Done',            'Tasks with fully Approved status'],
    ['Pending',         'Completed but awaiting Team Lead review'],
    ['Overdue',         'Past due date, not yet completed'],
    ['In Progress',     'Currently active tasks'],
    ['Awaiting Review', 'Submitted to TL for approval decision'],
    ['Completion Rate', 'Percentage of assigned tasks fully approved'],
    ['Workload Status', 'Available / Moderate / Busy / Overloaded'],
], [140, CW - 140], hdr_color=TEAL)

story += [Paragraph(
    'Use the <b>Filter</b> dropdown at the top to view a specific member. '
    'Toggle between <b>All Time</b>, <b>Last 3 Months</b> and '
    '<b>Last 6 Months</b> using the time range buttons.', body)]
story += [PageBreak()]

# ── SECTION 9: CLIENTS ───────────────────────────────────────────────────────
story += section_start('09', 'Clients',
    'Admin only — manage your client portfolio.')

story += img(BASE + 'ss_clients.png',
    'Clients page — full list with client type, date added and active project count')

story += [Paragraph(
    'The Clients page lists all clients with their type, date added '
    'and number of linked projects. You can:', body)]
story += [Paragraph('• Click <b>+ Add Client</b> (top-right) to add a new client record.', bullet_s)]
story += [Paragraph('• Click <b>✏️ Edit</b> to update a client\'s name or type.', bullet_s)]
story += [Paragraph('• Click <b>🗑️ Delete</b> to remove a client (only if no projects are linked).', bullet_s)]
story += [Spacer(1, 8)]
story += note_box(
    'ℹ️  Clients are selected when creating a project. Keeping client names consistent '
    'ensures correct grouping across the Projects, Health Check and Team Performance pages.',
    color=BLUE, bg=LBLUE, tc=HexColor('#1E40AF'))
story += [PageBreak()]

# ── SECTION 10: COMPLETED PROJECTS ───────────────────────────────────────────
story += section_start('10', 'Completed Projects',
    'Your delivery track record — projects where 100% of tasks are approved.')

story += img(BASE + 'ss_completed.png',
    'Completed Projects — archived record of all delivered work')

story += [Paragraph(
    'A project moves to Completed once all its tasks are approved by the Team Lead. '
    'Each completed project card shows:', body)]
story += [Paragraph('• Project name, client and manager.', bullet_s)]
story += [Paragraph('• <b>On Time</b> or <b>Late</b> delivery chip.', bullet_s)]
story += [Paragraph('• Completion date and task completion ratio.', bullet_s)]
story += [Spacer(1, 8)]
story += note_box(
    '💡  Completed projects are archived here for reference — they no longer appear '
    'in the Projects page or Health Check.',
    color=GREEN, bg=LGREEN, tc=HexColor('#065F46'))

# ── BACK COVER ────────────────────────────────────────────────────────────────
story += [PageBreak()]
back = Table([
    [Spacer(1, 110)],
    [HRFlowable(width=CW, thickness=0.5, color=HexColor('#334155'), spaceAfter=0)],
    [Spacer(1, 28)],
    [Paragraph('Need help?', ParagraphStyle('bh', fontName='Helvetica-Bold',
        fontSize=22, textColor=white, alignment=TA_CENTER))],
    [Spacer(1, 10)],
    [Paragraph('Contact your admin or reach out on the project WhatsApp group.',
        ParagraphStyle('bs', fontName='Helvetica', fontSize=12,
        textColor=HexColor('#CADCFC'), alignment=TA_CENTER, leading=18))],
    [Spacer(1, 20)],
    [Paragraph('sip-todo.netlify.app', ParagraphStyle('bu', fontName='Helvetica-Bold',
        fontSize=14, textColor=HexColor('#93C5FD'), alignment=TA_CENTER))],
    [Spacer(1, 70)],
    [Paragraph('Secret Ingredient Consultancy  ·  2025', cover_foot)],
], colWidths=[CW],
style=TableStyle([
    ('BACKGROUND',    (0,0),(-1,-1), NAVY),
    ('ROWBACKGROUNDS',(0,0),(-1,-1), [NAVY]),
    ('TOPPADDING',    (0,0),(-1,-1), 0),
    ('BOTTOMPADDING', (0,0),(-1,-1), 0),
    ('LEFTPADDING',   (0,0),(-1,-1), 0),
    ('RIGHTPADDING',  (0,0),(-1,-1), 0),
]))
story += [back]

# ── BUILD ─────────────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
    leftMargin=ML, rightMargin=MR, topMargin=MT, bottomMargin=MB,
    title='SIP Client Guide', author='Secret Ingredient Consultancy')
doc.build(story)
print('Done:', OUTPUT)
