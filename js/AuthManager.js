import { Utils } from "./Utils.js";
import { StorageManager } from "./StorageManager.js";

// ===============================
// AUTH MANAGER (Class)
// ===============================
export class AuthManager {
  constructor(app) {
    this.app = app; // Referensi ke 'App' utama
  }

  // Mendaftarkan semua event listener untuk Auth
  init() {
    document
      .getElementById("login-form")
      ?.addEventListener("submit", (e) => this.handleLogin(e));
    document
      .getElementById("register-form")
      ?.addEventListener("submit", (e) => this.handleRegister(e));
    document
      .getElementById("logout-btn")
      ?.addEventListener("click", () => this.handleLogout());
  }

  handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    const user = StorageManager.getUser(username);
    if (!user || user.password !== password) {
      alert("❌ Username atau password salah.");
      return;
    }

    StorageManager.setCurrentUser(username);
    this.app.state.currentUser = user; // Set state di App utama
    this.app.ui.showApp();
    e.target.reset();
  }

  handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("register-confirm").value;

    document.getElementById("username-error").textContent = "";
    document.getElementById("password-error").textContent = "";
    document.getElementById("confirm-error").textContent = "";

    const usernameCheck = Utils.validateUsername(username);
    if (!usernameCheck.valid) {
      document.getElementById("username-error").textContent =
        usernameCheck.error;
      return;
    }

    if (StorageManager.getUser(username)) {
      document.getElementById("username-error").textContent =
        "Username sudah terdaftar.";
      return;
    }

    const passwordCheck = Utils.validatePassword(password);
    if (!passwordCheck.valid) {
      document.getElementById("password-error").textContent =
        passwordCheck.error;
      return;
    }

    if (password !== confirmPassword) {
      document.getElementById("confirm-error").textContent =
        "Password tidak cocok.";
      return;
    }

    if (StorageManager.createUser(username, password)) {
      alert("✅ Registrasi berhasil! Silakan login.");
      this.app.ui.switchPage("login-page");
      e.target.reset();
    }
  }

  handleLogout() {
    if (confirm("Yakin ingin logout?")) {
      StorageManager.logout();
      this.app.state.currentUser = null; // Set state di App utama
      this.app.ui.hideApp();
      this.app.ui.switchPage("login-page");
      document.getElementById("login-form").reset();
      document.getElementById("register-form").reset();
    }
  }
}
