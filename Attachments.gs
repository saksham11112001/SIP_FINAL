// =============================================================================
//  Attachments.gs  |  Drive-backed file attachments for tasks
//
//  STORAGE:
//    - Files are stored in a dedicated Google Drive folder.
//    - Folder ID is cached in ScriptProperties to avoid repeated lookups.
//    - Metadata is recorded in the "Attachments" sheet.
//
//  PERMISSIONS:
//    - Anyone with the link can VIEW (read-only sharing).
//    - Max file size: 5 MB per attachment.
//
//  SHEET COLUMNS (Attachments sheet):
//    ID | Task ID | Project ID | File Name | Drive File ID | View URL |
//    Uploaded By | Uploaded Date
// =============================================================================

var ATTACH_FOLDER_NAME = 'SI_ProjectTracker_Attachments';
var ATTACH_MAX_BYTES   = 5 * 1024 * 1024;   // 5 MB

var ATTACH_COL = {
  ID           : 0,
  TASK_ID      : 1,
  PROJECT_ID   : 2,
  FILE_NAME    : 3,
  DRIVE_FILE_ID: 4,
  VIEW_URL     : 5,
  UPLOADED_BY  : 6,
  UPLOADED_DATE: 7
};

// ─────────────────────────────────────────────────────────────────────────────
//  PRIVATE — get (or create) the attachment Drive folder
// ─────────────────────────────────────────────────────────────────────────────

function _getOrCreateAttachmentFolder_() {
  var props    = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('attachFolderId');

  // Verify cached ID still valid
  if (folderId) {
    try {
      var f = DriveApp.getFolderById(folderId);
      if (f) return f;
    } catch (e) {
      // Folder deleted or inaccessible — fall through to create
    }
  }

  // Search for existing folder by name
  var iter = DriveApp.getFoldersByName(ATTACH_FOLDER_NAME);
  var folder;
  if (iter.hasNext()) {
    folder = iter.next();
  } else {
    folder = DriveApp.createFolder(ATTACH_FOLDER_NAME);
  }

  props.setProperty('attachFolderId', folder.getId());
  return folder;
}

// ─────────────────────────────────────────────────────────────────────────────
//  READ — list attachments for a task
// ─────────────────────────────────────────────────────────────────────────────

function getTaskAttachments(taskId) {
  try {
    var sheet = getSheet(SHEET_NAMES.ATTACHMENTS);
    if (!sheet) return [];
    var data  = sheetDisplayValues(sheet);
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      if (!r[ATTACH_COL.ID]) continue;
      if (String(r[ATTACH_COL.TASK_ID]) !== String(taskId)) continue;
      result.push({
        id          : r[ATTACH_COL.ID],
        taskId      : r[ATTACH_COL.TASK_ID],
        projectId   : r[ATTACH_COL.PROJECT_ID],
        fileName    : r[ATTACH_COL.FILE_NAME],
        driveFileId : r[ATTACH_COL.DRIVE_FILE_ID],
        viewUrl     : r[ATTACH_COL.VIEW_URL],
        uploadedBy  : r[ATTACH_COL.UPLOADED_BY],
        uploadedDate: r[ATTACH_COL.UPLOADED_DATE]
      });
    }
    return result;
  } catch (e) {
    Logger.log('getTaskAttachments error: ' + e.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE — upload a file (base64) and record metadata
// ─────────────────────────────────────────────────────────────────────────────

function addAttachment(taskId, projectId, fileName, fileDataBase64, mimeType) {
  try {
    var user = getCurrentUser();
    if (user.accessDenied) return { success: false, error: 'Access denied.' };

    // Decode & size check
    var blob;
    try {
      blob = Utilities.newBlob(
        Utilities.base64Decode(fileDataBase64),
        mimeType || 'application/octet-stream',
        fileName
      );
    } catch (e) {
      return { success: false, error: 'Could not decode file data: ' + e.message };
    }

    if (blob.getBytes().length > ATTACH_MAX_BYTES) {
      return { success: false, error: 'File exceeds the 5 MB limit.' };
    }

    // Upload to Drive
    var folder   = _getOrCreateAttachmentFolder_();
    var driveFile = folder.createFile(blob);
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var attachId = 'ATT_' + new Date().getTime();
    var viewUrl  = driveFile.getUrl();

    // Record in Attachments sheet
    var sheet = getSheet(SHEET_NAMES.ATTACHMENTS);
    sheet.appendRow([
      attachId,
      taskId,
      projectId || '',
      fileName,
      driveFile.getId(),
      viewUrl,
      user.name || user.email,
      new Date()
    ]);

    logAudit(user.name, 'ADD_ATTACHMENT', 'Task', taskId,
      'Uploaded "' + fileName + '" (' + attachId + ')');

    return {
      success    : true,
      attachmentId: attachId,
      viewUrl    : viewUrl,
      fileName   : fileName
    };
  } catch (e) {
    Logger.log('addAttachment error: ' + e.message);
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE — trash the Drive file and remove the sheet row
// ─────────────────────────────────────────────────────────────────────────────

function deleteAttachment(attachmentId) {
  try {
    var user  = getCurrentUser();
    var sheet = getSheet(SHEET_NAMES.ATTACHMENTS);
    var data  = sheetValues(sheet);

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][ATTACH_COL.ID]) !== String(attachmentId)) continue;

      var uploadedBy = String(data[i][ATTACH_COL.UPLOADED_BY] || '');
      // Allow: Admin, Team Leader, or the person who uploaded it
      var canDelete =
        user.role === 'Admin' ||
        user.role === 'Team Leader' ||
        uploadedBy.toLowerCase() === (user.name  || '').toLowerCase() ||
        uploadedBy.toLowerCase() === (user.email || '').toLowerCase();

      if (!canDelete) {
        return { success: false, error: 'You do not have permission to delete this attachment.' };
      }

      // Trash the Drive file (soft-delete)
      var driveFileId = String(data[i][ATTACH_COL.DRIVE_FILE_ID] || '');
      if (driveFileId) {
        try { DriveApp.getFileById(driveFileId).setTrashed(true); } catch (e2) { /* already deleted */ }
      }

      var fileName = String(data[i][ATTACH_COL.FILE_NAME] || '');
      var taskId   = String(data[i][ATTACH_COL.TASK_ID]   || '');
      sheet.deleteRow(i + 1);
      logAudit(user.name, 'DELETE_ATTACHMENT', 'Task', taskId,
        'Deleted "' + fileName + '" (' + attachmentId + ')');
      return { success: true };
    }
    return { success: false, error: 'Attachment not found.' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
