// =============================================================================
//  Cache.gs  |  Server-side caching layer + safe sheet-read utility
//
//  PASTE THIS AS A NEW FILE in Apps Script named "Cache"
//
//  HOW IT WORKS:
//    cached(key, ttl, callback) — returns cached value if fresh, else runs
//    callback, stores result, returns it.
//
//    clearCache(keysArray) — call inside every write operation to bust stale
//    data so the next read fetches from Sheets.
//
//    sheetValues(sheet) — drop-in replacement for sheet.getDataRange().getValues()
//    that skips empty trailing rows for speed.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
//  CACHE TTL CONSTANTS  (seconds)
// ─────────────────────────────────────────────────────────────────────────────

var CACHE_TTL = {
  TASKS: 60,
  PROJECTS: 60,
  CLIENTS: 120, // clients change rarely — cache longer
  TEAMS: 120,
};

var CACHE_KEYS = {
  TASKS: "sip_tasks",
  PROJECTS: "sip_projects",
  CLIENTS: "sip_clients",
  TEAMS: "sip_teams",
};

// ─────────────────────────────────────────────────────────────────────────────
//  cached(key, ttl, callback)
//
//  @param  key      {string}   CacheService key (use CACHE_KEYS.* constants)
//  @param  ttl      {number}   Seconds to keep value (max 21600 = 6hrs)
//  @param  callback {function} Zero-arg function that returns the fresh value
//  @return          {*}        Parsed cached value, or fresh value from callback
// ─────────────────────────────────────────────────────────────────────────────

function cached(key, ttl, callback) {
  try {
    var cache = CacheService.getScriptCache();
    var hit = cache.get(key);

    if (hit !== null) {
      // Cache hit — parse and return
      try {
        return JSON.parse(hit);
      } catch (parseErr) {
        // Corrupt entry — fall through to refresh
        Logger.log(
          'Cache parse error for key "' + key + '": ' + parseErr.message,
        );
      }
    }

    // Cache miss — compute fresh value
    var value = callback();
    var serialised = JSON.stringify(value);

    // IMPORTANT: Never cache empty arrays.
    // An empty result almost always means a transient sheet-read failure or
    // cold-start error. Caching it would lock all users out of data for the
    // full TTL (up to 120s). Let the next call retry instead.
    if (Array.isArray(value) && value.length === 0) {
      return value;
    }

    // CacheService has a 100KB per-entry hard limit.
    // If payload is large, store it anyway — it will simply be evicted/skipped.
    try {
      cache.put(key, serialised, ttl);
    } catch (storeErr) {
      Logger.log(
        'Cache store skipped for key "' +
          key +
          '" (payload too large): ' +
          storeErr.message,
      );
    }

    return value;
  } catch (e) {
    // If CacheService itself is unavailable, fall back to direct call
    Logger.log("CacheService unavailable, bypassing: " + e.message);
    return callback();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  clearCache(keysArray)
//
//  Call this at the top of every write function (add/update/delete).
//  Pass the CACHE_KEYS values that the write may invalidate.
//
//  Example:
//    clearCache([CACHE_KEYS.TASKS]);
//    clearCache([CACHE_KEYS.PROJECTS, CACHE_KEYS.TASKS]);
// ─────────────────────────────────────────────────────────────────────────────

function clearCache(keysArray) {
  try {
    if (!keysArray || keysArray.length === 0) return;
    CacheService.getScriptCache().removeAll(keysArray);
  } catch (e) {
    Logger.log("clearCache error: " + e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  sheetValues(sheet)
//
//  Drop-in replacement for sheet.getDataRange().getValues()
//  Skips empty trailing rows by using getLastRow() / getLastColumn().
//  Falls back to getDataRange() if the sheet is empty or an error occurs.
//
//  DOES NOT change column indexes — returns same 2-D array format.
// ─────────────────────────────────────────────────────────────────────────────

function sheetValues(sheet) {
  try {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    // Sheet is empty (only header or truly blank)
    if (lastRow < 2 || lastCol < 1) {
      // Return just the header row so callers' loop i=1 exits immediately
      if (lastRow === 1 && lastCol >= 1) {
        return sheet.getRange(1, 1, 1, lastCol).getValues();
      }
      return [[]];
    }

    // Read from row 1 (header included) to lastRow
    return sheet.getRange(1, 1, lastRow, lastCol).getValues();
  } catch (e) {
    Logger.log("sheetValues error, falling back to getDataRange: " + e.message);
    return sheet.getDataRange().getValues();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  sheetDisplayValues(sheet)
//
//  Same as sheetValues but returns formatted display strings (like getDisplayValues).
//  Used by functions that previously called getDataRange().getDisplayValues().
// ─────────────────────────────────────────────────────────────────────────────

function sheetDisplayValues(sheet) {
  try {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) {
      if (lastRow === 1 && lastCol >= 1) {
        return sheet.getRange(1, 1, 1, lastCol).getDisplayValues();
      }
      return [[]];
    }
    return sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  } catch (e) {
    Logger.log("sheetDisplayValues error, falling back: " + e.message);
    return sheet.getDataRange().getDisplayValues();
  }
}
