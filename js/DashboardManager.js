import { Utils } from "./Utils.js";

// ===============================
// DASHBOARD MANAGER (Class)
// ===============================
export class DashboardManager {
  constructor(app) {
    this.app = app;
  }

  updateDashboard() {
    if (!this.app.state.currentUser) return;

    this.updateBalance();
    this.updateAnalytics();
    this.renderDashboardTargets();
    this.app.targets.populateTargetSelects(); // Pastikan select target di form nabung/keluar juga update
  }

  updateBalance() {
    const balanceElement = document.getElementById("balance-display");
    if (this.app.state.balanceVisible) {
      balanceElement.textContent = Utils.formatRupiah(
        this.app.state.currentUser.saldo_utama
      );
    } else {
      balanceElement.textContent = "••••••";
    }
  }

  toggleBalanceVisibility() {
    this.app.state.balanceVisible = !this.app.state.balanceVisible;
    this.updateBalance();
  }

  updateAnalytics() {
    const user = this.app.state.currentUser;
    let totalNabung = 0;
    let totalKeluar = 0;

    user.riwayat.forEach((tx) => {
      if (tx[1] === "nabung") totalNabung += tx[2];
      if (tx[1] === "keluar") totalKeluar += tx[2];
    });

    Object.values(user.targets).forEach((target) => {
      target.riwayat?.forEach((tx) => {
        if (tx[1] === "nabung") totalNabung += tx[2];
        if (tx[1] === "keluar") totalKeluar += tx[2];
      });
    });

    const rasio = totalNabung > 0 ? (totalKeluar / totalNabung) * 100 : 0;
    let status = "Sehat 😎";
    if (rasio < 30) status = "Dompet Sehat 😎";
    else if (rasio <= 60) status = "Cukup Stabil 🙂";
    else status = "Boros Banget 😭";

    document.getElementById("total-nabung").textContent =
      Utils.formatRupiah(totalNabung);
    document.getElementById("total-keluar").textContent =
      Utils.formatRupiah(totalKeluar);
    document.getElementById("rasio-keluar").textContent =
      rasio.toFixed(1) + "%";
    document.getElementById("status-keuangan").textContent = status;
  }

  renderDashboardTargets() {
    const container = document.getElementById("dashboard-targets");
    const targets = this.app.state.currentUser.targets;

    if (Object.keys(targets).length === 0) {
      container.innerHTML =
        '<p class="riwayat-empty">Belum ada target tabungan. Buat yang pertama yuk! 🎯</p>';
      return;
    }

    container.innerHTML = Object.entries(targets)
      .slice(0, 3)
      .map(([name, target]) => this.createTargetElement(name, target)) // Panggil method helper
      .join("");
  }

  createTargetElement(name, target) {
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
              <span>${Utils.formatRupiah(target.saldo)} / ${Utils.formatRupiah(
      target.target
    )}</span>
              <span class="target-item-status ${statusClass}">${statusText}</span>
          </div>
      </div>
    `;
  }
}
