const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  win.loadURL('http://localhost:3000'); // This will load Next.js frontend
}

app.whenReady().then(createWindow);
