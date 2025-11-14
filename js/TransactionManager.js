import { Utils } from "./Utils.js";
import { StorageManager } from "./StorageManager.js";

// ===============================
// TRANSACTION MANAGER (Class)
// ===============================
export class TransactionManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    // --- Listeners untuk Form NABUNG ---
    document
      .getElementById("nabung-sumber")
      ?.addEventListener("change", (e) => {
        const targetGroup = document.getElementById("target-select-group");
        const targetSelect = document.getElementById("nabung-target");
        const isTarget = e.target.value === "target";

        targetGroup.classList.toggle("hidden", !isTarget);
        targetSelect.required = isTarget;
      });

    document.getElementById("nabung-jumlah")?.addEventListener("input", (e) => {
      const numericValue = Number.parseInt(e.target.value) || 0;
      document.getElementById("format-nabung").textContent =
        Utils.formatRupiah(numericValue);
    });

    document
      .getElementById("nabung-catatan")
      ?.addEventListener("input", (e) => {
        e.target.parentElement.querySelector(
          ".count-text"
        ).textContent = `${e.target.value.length}/120`;
      });

    document
      .getElementById("nabung-form")
      ?.addEventListener("submit", (e) => this.handleNabung(e));

    // --- Listeners untuk Form PENGELUARAN ---
    document
      .getElementById("pengeluaran-sumber")
      ?.addEventListener("change", (e) => {
        document
          .getElementById("pengeluaran-target-group")
          .classList.toggle("hidden", e.target.value !== "target");
      });

    document
      .getElementById("pengeluaran-jumlah")
      ?.addEventListener("input", (e) => {
        const numericValue = Number.parseInt(e.target.value) || 0;
        document.getElementById("format-pengeluaran").textContent =
          Utils.formatRupiah(numericValue);
      });

    document
      .getElementById("pengeluaran-catatan")
      ?.addEventListener("input", (e) => {
        e.target.parentElement.querySelector(
          ".count-text"
        ).textContent = `${e.target.value.length}/120`;
      });

    document
      .getElementById("pengeluaran-form")
      ?.addEventListener("submit", (e) => this.handlePengeluaran(e));
  }

  handleNabung(e) {
    e.preventDefault();
    const sumber = document.getElementById("nabung-sumber").value;
    const jumlah =
      Number.parseInt(document.getElementById("nabung-jumlah").value) || 0;
    const catatan = document.getElementById("nabung-catatan").value || "-";
    const user = this.app.state.currentUser;

    if (jumlah <= 0) {
      alert("❌ Jumlah nabung harus lebih dari 0.");
      return;
    }

    if (sumber === "utama") {
      user.saldo_utama += jumlah;
      user.riwayat.push([
        new Date().toLocaleString("id-ID"),
        "nabung",
        jumlah,
        catatan,
      ]);
      alert(`✅ Nabung ${Utils.formatRupiah(jumlah)} ke saldo utama berhasil!`);
    } else {
      const targetName = document.getElementById("nabung-target").value;
      if (!targetName) {
        alert("❌ Pilih target terlebih dahulu.");
        return;
      }

      const target = user.targets[targetName];
      if (target.status === "selesai") {
        alert("❌ Target sudah selesai, tidak bisa menambah lagi.");
        return;
      }

      target.saldo += jumlah;
      target.riwayat.push([
        new Date().toLocaleString("id-ID"),
        "nabung",
        jumlah,
        catatan,
      ]);

      if (target.saldo >= target.target) {
        target.saldo = target.target;
        target.status = "selesai";
        alert(`🎉 Target '${targetName}' telah tercapai!`);
      } else {
        alert(
          `✅ Nabung ${Utils.formatRupiah(
            jumlah
          )} ke target '${targetName}' berhasil!`
        );
      }
    }

    StorageManager.updateUser(user.username, user);
    this.app.dashboard.updateDashboard();
    e.target.reset();
    document.getElementById("format-nabung").textContent = "Rp 0";
    document.getElementById("target-select-group").classList.add("hidden");
    document.getElementById("nabung-target").required = false;
    this.app.ui.switchNavPage("dashboard");
  }

  handlePengeluaran(e) {
    e.preventDefault();
    const sumber = document.getElementById("pengeluaran-sumber").value;
    const jumlah =
      Number.parseInt(document.getElementById("pengeluaran-jumlah").value) || 0;
    const catatan = document.getElementById("pengeluaran-catatan").value || "-";
    const user = this.app.state.currentUser;

    if (jumlah <= 0) {
      alert("❌ Jumlah pengeluaran harus lebih dari 0.");
      return;
    }

    if (sumber === "utama") {
      if (jumlah > user.saldo_utama) {
        user.saldo_utama = 0;
      } else {
        user.saldo_utama -= jumlah;
      }
      user.riwayat.push([
        new Date().toLocaleString("id-ID"),
        "keluar",
        jumlah,
        catatan,
      ]);
      alert(
        `✅ Pengeluaran ${Utils.formatRupiah(jumlah)} dari saldo utama dicatat.`
      );
    } else {
      const targetName = document.getElementById("pengeluaran-target").value;
      if (!targetName) {
        alert("❌ Pilih target terlebih dahulu.");
        return;
      }

      const target = user.targets[targetName];
      const now = new Date();
      const lastWithdraw = target.last_withdraw
        ? new Date(target.last_withdraw)
        : null;

      if (lastWithdraw) {
        const daysDiff = Math.floor(
          (now - lastWithdraw) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff < 365) {
          const sisaHari = 365 - daysDiff;
          alert(
            `❌ Anda sudah melakukan penarikan tahun ini. Coba lagi dalam ${sisaHari} hari.`
          );
          return;
        }
      }

      if (target.saldo <= 0) {
        alert("❌ Saldo target kosong.");
        return;
      }

      const maxTarik = Math.floor(target.saldo * 0.3);
      if (maxTarik <= 0) {
        alert("❌ Saldo tidak mencukupi untuk penarikan 30%.");
        return;
      }

      if (
        !confirm(
          `⚠️ Penarikan maksimal 30% = ${Utils.formatRupiah(
            maxTarik
          )}. Lanjutkan?`
        )
      ) {
        return;
      }

      target.saldo -= maxTarik;
      target.last_withdraw = now.toLocaleString("id-ID");
      target.riwayat.push([
        now.toLocaleString("id-ID"),
        "keluar",
        maxTarik,
        catatan,
      ]);
      alert(
        `✅ Penarikan ${Utils.formatRupiah(
          maxTarik
        )} dari target '${targetName}' berhasil!`
      );
    }

    StorageManager.updateUser(user.username, user);
    this.app.dashboard.updateDashboard();
    e.target.reset();
    document.getElementById("format-pengeluaran").textContent = "Rp 0";
    document.getElementById("pengeluaran-target-group").classList.add("hidden");
    this.app.ui.switchNavPage("dashboard");
  }
}
