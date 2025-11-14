import { Utils } from "./Utils.js";

// ===============================
// HISTORY MANAGER (Class)
// ===============================
export class HistoryManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".tab-btn")
          .forEach((b) => b.classList.remove("active"));
        document
          .querySelectorAll(".tab-content")
          .forEach((c) => c.classList.remove("active"));

        btn.classList.add("active");
        const tabId = btn.getAttribute("data-tab");
        document.getElementById(tabId).classList.add("active");

        if (tabId === "target-history") {
          this.renderTargetRiwayat();
        }
      });
    });
  }

  renderRiwayat() {
    this.renderUtamaRiwayat();
    this.renderTargetRiwayat();
  }

  renderUtamaRiwayat() {
    const container = document.getElementById("utama-riwayat");
    const riwayat = this.app.state.currentUser.riwayat;

    if (riwayat.length === 0) {
      container.innerHTML =
        '<p class="riwayat-empty">Belum ada riwayat transaksi.</p>';
      return;
    }

    container.innerHTML = riwayat
      .slice()
      .reverse()
      .map(([tanggal, tipe, jumlah, catatan]) =>
        this.createRiwayatElement(tanggal, tipe, jumlah, catatan)
      )
      .join("");
  }

  renderTargetRiwayat() {
    const container = document.getElementById("target-riwayat-selector");
    const riwayatContainer = document.getElementById("target-riwayat");
    const targets = this.app.state.currentUser.targets;
    const targetNames = Object.keys(targets);

    if (targetNames.length === 0) {
      container.innerHTML = "";
      riwayatContainer.innerHTML =
        '<p class="riwayat-empty">Belum ada target.</p>';
      return;
    }

    container.innerHTML = targetNames
      .map(
        (name, idx) => `
        <button class="target-selector-btn ${
          idx === 0 ? "active" : ""
        }" onclick="app.history.showTargetRiwayat('${name}')">
            ${name}
        </button>
      `
      )
      .join("");

    if (targetNames.length > 0) {
      this.showTargetRiwayat(targetNames[0]);
    }
  }

  showTargetRiwayat(targetName) {
    document.querySelectorAll(".target-selector-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.textContent.trim() === targetName) {
        btn.classList.add("active");
      }
    });

    const target = this.app.state.currentUser.targets[targetName];
    const container = document.getElementById("target-riwayat");

    if (!target.riwayat || target.riwayat.length === 0) {
      container.innerHTML =
        '<p class="riwayat-empty">Belum ada riwayat transaksi pada target ini.</p>';
      return;
    }

    container.innerHTML = target.riwayat
      .slice()
      .reverse()
      .map(([tanggal, tipe, jumlah, catatan]) =>
        this.createRiwayatElement(tanggal, tipe, jumlah, catatan, true)
      )
      .join("");
  }

  createRiwayatElement(tanggal, tipe, jumlah, catatan, isTarget = false) {
    let title = "";
    if (isTarget) {
      title = tipe === "nabung" ? "➕ Nabung" : "➖ Penarikan";
    } else {
      title = tipe === "nabung" ? "➕ Nabung" : "➖ Pengeluaran";
    }

    return `
        <div class="riwayat-item ${tipe}">
            <div class="riwayat-info">
                <div class="riwayat-title">${title}</div>
                <div class="riwayat-time">${tanggal}</div>
                ${
                  catatan !== "-"
                    ? `<div class="riwayat-note">${catatan}</div>`
                    : ""
                }
            </div>
            <div class="riwayat-amount ${tipe}">${
      tipe === "nabung" ? "+" : "-"
    } ${Utils.formatRupiah(jumlah)}</div>
        </div>
    `;
  }
}
