import { App } from "./App.js";

// ===============================
// INITIALIZE APP
// ===============================

// Buat instance App
const app = new App();

// PENTING:
// Agar 'onclick' di HTML (seperti onclick="app.ui.switchPage('...')") bisa berfungsi,
// kita perlu membuat 'app' bisa diakses secara global (melalui object 'window').
window.app = app;

// Jalankan inisialisasi aplikasi
app.init();
