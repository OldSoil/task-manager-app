const { app, BrowserWindow, ipcMain } = require("electron");
const { exec } = require("child_process");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,         // Minimum genişlik
    minHeight: 400,        // Minimum yükseklik
    title: "Mini Task Manager", // Pencere başlığı
    icon: path.join(__dirname, "assets", "icon.png"), // Pencere ikonu (opsiyonel)
    center: true,          // Pencereyi ekranın ortasına koy
    resizable: true,       // Yeniden boyutlandırılabilir
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");

  // İstersen otomatik olarak geliştirici araçlarını aç:
  // mainWindow.webContents.openDevTools();

  // Menü çubuğunu gizle (Windows ve Linux'ta temiz görünüm için)
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // macOS'ta dock tıklandığında pencere yoksa aç
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // macOS hariç tüm platformlarda uygulamayı kapat
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC handlerlar 
ipcMain.handle("get-apps", async () => {
  return new Promise((resolve, reject) => {
    exec('wmic process get Description,ProcessId', (err, stdout, stderr) => {
      if (err || stderr) {
        return reject(err || stderr);
      }

      const lines = stdout.split('\n').slice(1);
      const apps = lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const match = line.match(/(.+?)\s+([0-9]+)$/);
          if (!match) return null;
          const [_, name, pid] = match;
          return { name: name.trim(), pid: Number(pid) };
        })
        .filter(app => app && app.name.toLowerCase().includes(".exe"));

      resolve(apps);
    });
  });
});

ipcMain.handle("kill-app", async (event, pid) => {
  return new Promise((resolve) => {
    exec(`taskkill /PID ${pid} /F`, (error) => {
      if (error) {
        console.error("Kapatılamadı:", error);
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});
