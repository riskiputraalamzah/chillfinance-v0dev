import { StorageManager } from "./StorageManager.js";
import { UIManager } from "./UIManager.js";
import { AuthManager } from "./AuthManager.js";
import { DashboardManager } from "./DashboardManager.js";
import { TargetManager } from "./TargetManager.js";
import { TransactionManager } from "./TransactionManager.js";
import { HistoryManager } from "./HistoryManager.js";

// ===============================
// APP (Class Utama)
// ===============================
export class App {
  constructor() {
    // Menyimpan state aplikasi
    this.state = {
      currentUser: null,
      balanceVisible: true,
    };

    // Membuat instance dari semua manajer
    this.ui = new UIManager(this);
    this.auth = new AuthManager(this);
    this.dashboard = new DashboardManager(this);
    this.targets = new TargetManager(this);
    this.transactions = new TransactionManager(this);
    this.history = new HistoryManager(this);
  }

  // Metode inisialisasi utama
  init() {
    console.log("App initializing...");
    // Cek sesi login
    this.state.currentUser = StorageManager.getCurrentUser();

    // Daftarkan semua event listener dari semua manajer
    this.auth.init();
    this.ui.init();
    this.targets.init();
    this.transactions.init();
    this.history.init();

    // Tampilkan halaman yang sesuai
    if (this.state.currentUser) {
      this.ui.showApp();
    } else {
      this.ui.hideApp();
    }
  }
}
