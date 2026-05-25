// =============================================================================
//  Clients.gs  |  Client CRUD
//
//  CHANGES FROM ORIGINAL:
//    1. getClients()    — wrapped with cached() [120s TTL]
//                         getDataRange() → sheetValues()
//    2. addClient()     — clearCache([CACHE_KEYS.CLIENTS])
//    3. updateClient()  — clearCache + sheetValues
//    4. deleteClient()  — clearCache + sheetValues
// =============================================================================

function getClients() {
  return cached(CACHE_KEYS.CLIENTS, CACHE_TTL.CLIENTS, function () {
    try {
      var data = sheetValues(getSheet(SHEET_NAMES.CLIENTS));
      var clients = [];
      for (var i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        clients.push({
          id: String(data[i][0]),
          name: String(data[i][1] || ""),
          type: String(data[i][2] || ""),
          createdDate: String(data[i][3] || ""),
          active: data[i][4],
          createdBy: String(data[i][5] || ""),
        });
      }
      return clients;
    } catch (e) {
      return [];
    }
  });
}

function addClient(name, type) {
  try {
    clearCache([CACHE_KEYS.CLIENTS]);
    var sheet = getSheet(SHEET_NAMES.CLIENTS);
    var user = getCurrentUser();
    var id = "CLIENT_" + new Date().getTime();
    sheet.appendRow([
      id,
      name,
      type,
      new Date(),
      true,
      user.email || user.name,
    ]);
    logAudit(user.name, "CREATE_CLIENT", "Client", id, 'Added: "' + name + '"');
    return { success: true, clientId: id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function updateClient(id, name, type) {
  try {
    clearCache([CACHE_KEYS.CLIENTS]);
    var sheet = getSheet(SHEET_NAMES.CLIENTS);
    var data = sheetValues(sheet);
    var user = getCurrentUser();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(id)) continue;
      // Batched: Name(2), Type(3)
      sheet.getRange(i + 1, 2, 1, 2).setValues([[name, type]]);
      logAudit(
        user.name,
        "UPDATE_CLIENT",
        "Client",
        id,
        'Updated: "' + name + '"',
      );
      return { success: true };
    }
    return { success: false, error: "Client not found." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function deleteClient(id) {
  try {
    clearCache([CACHE_KEYS.CLIENTS]);
    var sheet = getSheet(SHEET_NAMES.CLIENTS);
    var data = sheetValues(sheet);
    var user = getCurrentUser();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(id)) continue;
      var name = String(data[i][1] || "");
      sheet.deleteRow(i + 1);
      logAudit(
        user.name,
        "DELETE_CLIENT",
        "Client",
        id,
        'Deleted: "' + name + '"',
      );
      return { success: true };
    }
    return { success: false, error: "Client not found." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
