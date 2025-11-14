import { Utils } from "./Utils.js";

// ===============================
// UI/NAVIGATION MANAGER (Class)
// ===============================
export class UIManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    // Daftarkan listener untuk tombol nav utama
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pageId = btn.getAttribute("data-page");
        this.switchNavPage(pageId);
      });
    });
  }

  switchPage(pageId) {
    document.querySelectorAll(".auth-page").forEach((page) => {
      page.classList.remove("active");
    });
    document.getElementById(pageId).classList.add("active");
  }

  switchNavPage(pageId) {
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.remove("active");
    });
    document.getElementById(pageId).classList.add("active");

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-page="${pageId}"]`).classList.add("active");

    // Panggil render/update yang relevan saat pindah halaman
    if (pageId === "riwayat") {
      this.app.history.renderRiwayat();
    }
    if (pageId === "targets") {
      this.app.targets.renderTargets();
    }
  }

  showApp() {
    document.getElementById("auth-container").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");

    // Panggil update UI saat aplikasi ditampilkan
    this.app.dashboard.updateDashboard();
    this.setDateDisplay();
    this.updateUsername();
  }

  hideApp() {
    document.getElementById("auth-container").classList.remove("hidden");
    document.getElementById("main-app").classList.add("hidden");
  }

  setDateDisplay() {
    document.getElementById("date-display").textContent =
      Utils.getFormattedDate();
  }

  updateUsername() {
    const user = this.app.state.currentUser;
    if (user) {
      document.getElementById(
        "username-display"
      ).textContent = `Hi, ${user.username}! 👋`;
    }
  }
}
