// Code.gs
// This code belongs in your Google Apps Script project.
// Deploy this as a Web App to get the Webhook URL.

const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
const MAP_SHEET_NAME = "DB_Map";
const LEADERBOARD_SHEET_NAME = "Scout_Leaderboard";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (!payload || !payload.length) {
      return ContentService.createTextOutput("Empty payload");
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let mapSheet = ss.getSheetByName(MAP_SHEET_NAME);
    let lbSheet = ss.getSheetByName(LEADERBOARD_SHEET_NAME);

    // Create sheets if they don't exist
    if (!mapSheet) mapSheet = ss.insertSheet(MAP_SHEET_NAME);
    if (!lbSheet) lbSheet = ss.insertSheet(LEADERBOARD_SHEET_NAME);

    // Process the Map Data (UPSERT Logic in memory for speed)
    processMapData(mapSheet, payload);

    // Process Gamification (Leaderboard)
    processLeaderboard(lbSheet, payload);

    return ContentService.createTextOutput("Success");
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString());
  }
}

function processMapData(sheet, incomingTiles) {
  // Columns: [type, kid, x, y, p, a, pop, t, uid, aid, vid, bonus, animals, scannedBy, lastUpdated]
  const HEADERS = ["type", "kid", "x", "y", "p", "a", "pop", "t", "uid", "aid", "vid", "bonus", "animals", "scannedBy", "lastUpdated"];
  
  // Read existing data
  const range = sheet.getDataRange();
  let data = range.getValues();
  
  // Initialize headers if empty
  if (data.length === 0 || data[0][0] !== "type") {
    data = [HEADERS];
  }

  // Create a map of existing coordinates to their row index in the data array
  // Key: "x,y", Value: rowIndex
  const coordMap = new Map();
  for (let i = 1; i < data.length; i++) {
    const x = data[i][2]; // col C
    const y = data[i][3]; // col D
    if (x !== undefined && y !== undefined) {
      coordMap.set(`${x},${y}`, i);
    }
  }

  const timestamp = new Date().toISOString();

  // Process each incoming tile
  incomingTiles.forEach(tile => {
    if (tile.x === undefined || tile.y === undefined) return;
    
    const coordKey = `${tile.x},${tile.y}`;
    const newRow = [
      tile.type || "",
      tile.kid || "",
      tile.x,
      tile.y,
      tile.p || "",
      tile.a || "",
      tile.pop || "",
      tile.t || "",
      tile.uid || "",
      tile.aid || "",
      tile.vid || "",
      tile.bonus || "",
      tile.animals || "",
      tile.scannedBy || "Unknown",
      timestamp
    ];

    if (coordMap.has(coordKey)) {
      // Update existing row
      const rowIndex = coordMap.get(coordKey);
      data[rowIndex] = newRow;
    } else {
      // Insert new row
      data.push(newRow);
      coordMap.set(coordKey, data.length - 1);
    }
  });

  // Write all data back to the sheet in one fast operation
  sheet.getRange(1, 1, data.length, HEADERS.length).setValues(data);
}

function processLeaderboard(sheet, incomingTiles) {
  // Count contributions per player in this batch
  const counts = {};
  incomingTiles.forEach(tile => {
    const ign = tile.scannedBy || "Unknown";
    counts[ign] = (counts[ign] || 0) + 1;
  });

  // Read existing leaderboard
  const range = sheet.getDataRange();
  let data = range.getValues();
  if (data.length === 0 || data[0][0] !== "Player") {
    data = [["Player", "Tiles Scanned", "Last Contribution"]];
  }

  const playerMap = new Map();
  for (let i = 1; i < data.length; i++) {
    playerMap.set(data[i][0], i);
  }

  const timestamp = new Date().toISOString();

  for (const [ign, count] of Object.entries(counts)) {
    if (playerMap.has(ign)) {
      const rowIndex = playerMap.get(ign);
      data[rowIndex][1] += count; // add to total
      data[rowIndex][2] = timestamp;
    } else {
      data.push([ign, count, timestamp]);
      playerMap.set(ign, data.length - 1);
    }
  }

  // Sort leaderboard by Tiles Scanned (Descending)
  const headers = data[0];
  const scores = data.slice(1);
  scores.sort((a, b) => b[1] - a[1]);
  
  const finalData = [headers, ...scores];
  sheet.getRange(1, 1, finalData.length, 3).setValues(finalData);
}
