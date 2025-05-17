const { ipcRenderer } = require("electron");

const appList = document.getElementById("appList");
const filterInput = document.getElementById("filterInput");

let allApps = [];

async function loadApps() {
  try {
    allApps = await ipcRenderer.invoke("get-apps");
    renderList(allApps);
  } catch (error) {
    appList.innerHTML = `<p style="color:#e03e3e; text-align:center;">Uygulamalar yüklenemedi: ${error}</p>`;
  }
}

function renderList(apps) {
  appList.innerHTML = "";

  if (apps.length === 0) {
    appList.innerHTML = '<p style="text-align:center; color:#777;">Hiç uygulama bulunamadı.</p>';
    return;
  }

  apps.forEach((app) => {
    const div = document.createElement("div");
    div.className = "app-item";

    const nameSpan = document.createElement("span");
    nameSpan.className = "app-name";
    nameSpan.textContent = `${app.name} (PID: ${app.pid})`;

    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.textContent = "Kapat";

    closeBtn.onclick = async () => {
      const res = await ipcRenderer.invoke("kill-app", app.pid);
      if (res && res.success) {
        loadApps();
      } else {
        alert("İşlem kapatılamadı.");
      }
    };

    div.appendChild(nameSpan);
    div.appendChild(closeBtn);
    appList.appendChild(div);
  });
}

filterInput.addEventListener("input", () => {
  const query = filterInput.value.toLowerCase();
  const filtered = allApps.filter((app) =>
    app.name.toLowerCase().includes(query)
  );
  renderList(filtered);
});

window.onload = loadApps;
