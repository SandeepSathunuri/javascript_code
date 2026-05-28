const e = require("electron");
console.log("typeof electron:", typeof e);
if (typeof e === "object" && e !== null) {
  const keys = Object.keys(e);
  console.log("electron keys count:", keys.length);
  console.log("e.app:", typeof e.app, JSON.stringify(e.app));
  console.log("e.ipcMain:", typeof e.ipcMain);
  console.log("e.BrowserWindow:", typeof e.BrowserWindow);
} else {
  console.log("electron value:", String(e));
}
