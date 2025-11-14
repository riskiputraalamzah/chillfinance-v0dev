import { Utils } from "./Utils.js";
import { StorageManager } from "./StorageManager.js";

// ===============================
// TARGET MANAGER (Class)
// ===============================
export class TargetManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    document
      .getElementById("target-nominal")
      ?.addEventListener("input", (e) => {
        const value = e.target.value;
        const numericValue = Number.parseInt(value) || 0;
        document.getElementById("format-target").textContent =
          Utils.formatRupiah(numericValue);
      });

    document
      .getElementById("add-target-form")
      ?.addEventListener("submit", (e) => this.handleAddTarget(e));
  }

  handleAddTarget(e) {
    e.preventDefault();
    const name = document.getElementById("target-name").value;
    const nominal =
      Number.parseInt(document.getElementById("target-nominal").value) || 0;
    const user = this.app.state.currentUser;

    if (nominal <= 0) {
      alert("❌ Nominal target harus lebih dari 0.");
      return;
    }
    if (
      Object.keys(user.targets).some(
        (n) => n.toLowerCase() === name.toLowerCase()
      )
    ) {
      alert("❌ Target dengan nama tersebut sudah ada.");
      return;
    }

    user.targets[name] = {
      target: nominal,
      saldo: 0,
      status: "aktif",
      riwayat: [],
      last_withdraw: null,
    };

    StorageManager.updateUser(user.username, user);
    alert(`✅ Target '${name}' berhasil dibuat!`);
    e.target.reset();
    this.renderTargets(); // Update list di halaman target
    this.app.dashboard.updateDashboard(); // Update list di dashboard
    document.getElementById("format-target").textContent = "Rp 0";
  }

  renderTargets() {
    const container = document.getElementById("targets-list");
    const targets = this.app.state.currentUser.targets;

    if (Object.keys(targets).length === 0) {
      container.innerHTML =
        '<p class="riwayat-empty">Belum ada target. Buat yang pertama yuk! 🎯</p>';
      return;
    }

    container.innerHTML = Object.entries(targets)
      .map(([name, target]) => {
        const percentage =
          target.target > 0
            ? Math.min(100, Math.round((target.saldo / target.target) * 100))
            : 0;
        const isCompleted = target.saldo >= target.target;
        const statusClass = isCompleted ? "completed" : "active";
        const statusText = isCompleted ? "✅ Selesai" : "Aktif";

        return `
          <div class="target-item">
              <div class="target-item-header">
                  <span class="target-item-name">${name}</span>
                  <span class="target-item-percentage">${percentage}%</span>
              </div>
              <div class="target-item-progress">
                  <div class="target-item-progress-bar" style="width: ${percentage}%"></div>
              </div>
              <div class="target-item-info">
                  <span>${Utils.formatRupiah(
                    target.saldo
                  )} / ${Utils.formatRupiah(target.target)}</span>
                  <span class="target-item-status ${statusClass}">${statusText}</span>
              </div>
              <div class="target-item-actions">
                  <button class="btn-delete" onclick="app.targets.deleteTarget('${name}')">🗑️ Hapus</button>
              </div>
          </div>
        `;
      })
      .join("");
  }

  deleteTarget(name) {
    if (confirm(`Yakin hapus target '${name}'?`)) {
      const user = this.app.state.currentUser;
      delete user.targets[name];
      StorageManager.updateUser(user.username, user);
      this.renderTargets();
      this.app.dashboard.updateDashboard();
    }
  }

  populateTargetSelects() {
    const user = this.app.state.currentUser;
    if (!user) return;

    const activTargets = Object.entries(user.targets)
      .filter(([_, t]) => t.status !== "selesai")
      .map(([name, _]) => name);

    const optionsHTML = activTargets
      .map((name) => `<option value="${name}">${name}</option>`)
      .join("");

    const nabungSelect = document.getElementById("nabung-target");
    if (nabungSelect) {
      nabungSelect.innerHTML =
        '<option value="">Pilih target...</option>' + optionsHTML;
    }

    const pengeluaranSelect = document.getElementById("pengeluaran-target");
    if (pengeluaranSelect) {
      pengeluaranSelect.innerHTML =
        '<option value="">Pilih target...</option>' + optionsHTML;
    }
  }
}
