# Dokumentasi Arsitektur: ChillFinance-v0dev (Modular OOP)

## Gambaran Umum

Proyek ini telah direfaktor dari satu file `app.js` prosedural menjadi arsitektur **Modular Object-Oriented Programming (OOP)**.

Tujuannya adalah **Separation of Concerns (Pemisahan Tugas)**:

- Setiap file (modul) kini berisi satu `Class` (Kelas).
- Setiap `Class` memiliki satu tanggung jawab utama (misalnya: hanya mengurus UI, hanya mengurus Auth, hanya mengurus Target).
- Logika bisnis inti tidak diubah, hanya dipindahkan ke "rumah" yang lebih rapi.

**Perbedaan Utama Arsitektur:**
Berbeda dengan arsitektur yang 100% terpisah, proyek ini masih mempertahankan _event handler_ `onclick` di dalam file `index.html`. Refaktor ini membuat `onclick` tersebut memanggil _method_ dari sebuah _instance_ `app` global, yang menjembatani antara HTML dan logika modular JavaScript.

---

## Alur Aplikasi (Cara Kerja)

Berikut adalah alur lengkap aplikasi dari awal hingga siap digunakan:

1.  **HTML Memuat:** Browser membuka `index.html`.
2.  **Modul Di-load:** `index.html` menemukan tag `<script type="module" src="js/main.js">` di bagian bawah. Ini adalah "pintu masuk" aplikasi.
3.  **`main.js` (Pintu Masuk):**
    - File ini meng-`import` kelas `App` dari `js/App.js`.
    - Ia membuat **satu instance** dari `App`: `const app = new App();`.
    - **PENTING:** Ia mengekspos _instance_ ini secara global: `window.app = app;`. Ini **wajib** agar `onclick="app.ui..."` di HTML bisa berfungsi.
    - Ia memanggil `app.init()` untuk "menyalakan" aplikasi.
4.  **`App.js` (Otak / Koordinator):**
    - `constructor()` dari `app` langsung berjalan. Di sinilah semua "Manajer" (seperti `UIManager`, `AuthManager`, `TargetManager`, dll.) dibuat sebagai _instance_ (`this.ui = new UIManager(this)`).
    - `app.init()` kemudian berjalan. Ia melakukan dua hal:
      a. Memanggil `StorageManager.getUserData()` untuk memeriksa apakah pengguna sudah login.
      b. Memanggil `init()` pada **setiap Manajer** (`this.auth.init()`, `this.ui.init()`, dst.). Di sinilah _event listener_ internal (seperti `submit` untuk form) didaftarkan.
      c. Ia menentukan halaman mana yang harus ditampilkan: Halaman Login (jika `currentUser` null) atau Halaman Dashboard (jika `currentUser` ada).
5.  **Aplikasi Siap (Hybrid Event-Driven):**
    - Aplikasi sekarang "diam" dan menunggu interaksi pengguna.
    - **Contoh 1 (HTML `onclick`):**
      a. Pengguna mengklik `<a onclick="app.ui.switchPage('register-page')">`.
      b. Browser langsung mengeksekusi `window.app.ui.switchPage('register-page')`.
      c. `UIManager.switchPage()` berjalan dan menampilkan halaman registrasi.
    - **Contoh 2 (JS `addEventListener`):**
      a. Pengguna mengisi form `#login-form` dan menekan "Login".
      b. `AuthManager` (yang sudah mendaftarkan _listener_ `submit` di `init()`) menangkap _event_ ini.
      c. `AuthManager.handleLogin()` berjalan, memvalidasi data, dan memanggil `this.app.ui.showApp()`.

---

## Struktur Direktori

```
chillfinance-v0dev/
├── js/
│   ├── main.js              <-- Pintu Masuk Aplikasi
│   ├── App.js               <-- Otak / Koordinator Utama
│   ├── Utils.js             <-- Kumpulan fungsi (formatRupiah, dll)
│   ├── StorageManager.js    <-- Mengelola Local/Session Storage
│   ├── UIManager.js         <-- Mengelola Navigasi & Tampilan
│   ├── AuthManager.js       <-- Mengelola Login, Register, Logout
│   ├── DashboardManager.js  <-- Mengelola render halaman Dashboard
│   ├── TargetManager.js     <-- Mengelola logika & render halaman Target
│   ├── TransactionManager.js<-- Mengelola logika & form Nabung & Keluar
│   └── HistoryManager.js    <-- Mengelola logika & render halaman Riwayat
├── index.html               <-- Kerangka HTML (View) dengan onclick
├── styles.css               <-- File styling
└── README.md                <-- File ini
```

---

---

## Penjelasan File (Peran Masing-Masing)

### `index.html`

- **Peran:** Kerangka (View) + Pemicu Event.
- Berisi semua elemen HTML (div, button, form, input).
- **Fitur Unik:** Menggunakan `onclick` (misalnya `onclick="app.ui.switchNavPage('...')"`) untuk memicu fungsi di JavaScript.
- Memuat `js/main.js` sebagai `type="module"`.

### `js/main.js`

- **Peran:** Pintu Masuk (Entry Point).
- File ini adalah _satu-satunya_ file JS yang dipanggil langsung oleh `index.html`.
- Tugasnya adalah membuat _instance_ `App` dan **mengeksposnya ke `window.app`** agar `onclick` di HTML bisa menemukannya.

### `js/App.js`

- **Peran:** Otak / Koordinator Utama.
- Menyimpan _state_ aplikasi (`currentUser`, `balanceVisible`).
- Membuat _instance_ dari semua kelas Manajer lain di `constructor`-nya.
- `init()`-nya memanggil `init()` dari semua manajer lain untuk mendaftarkan _event listener_ internal (seperti `submit` pada form).

### `js/Utils.js`

- **Peran:** Kotak Perkakas (Toolbox).
- Berisi `Class` statis dengan fungsi-fungsi bantuan murni seperti `formatRupiah()`, `validateUsername()`, `getFormattedDate()`.

### `js/StorageManager.js`

- **Peran:** Penjaga Database (Database Guard).
- `Class` statis yang bertanggung jawab untuk semua interaksi dengan `localStorage` dan `sessionStorage`.

### `js/UIManager.js`

- **Peran:** Manajer Navigasi & Tampilan.
- Menyediakan _method_ yang dipanggil oleh `index.html` (via `onclick`) untuk navigasi.
- **Tanggung Jawab:**
  - `switchPage()`: (Untuk halaman Auth)
  - `switchNavPage()`: (Untuk halaman utama aplikasi)
  - `showApp()` / `hideApp()`: Mengatur tampilan saat login/logout.
  - `init()`: Mendaftarkan _listener_ untuk tombol nav `.nav-btn` (yang ini tidak pakai `onclick` di HTML).

### `js/AuthManager.js`

- **Peran:** Manajer Autentikasi.
- **Tanggung Jawab:**
  - `init()`: Mendaftarkan _listener_ `submit` untuk `#login-form` dan `#register-form`.
  - Logika `handleLogin()`, `handleRegister()`, dan `handleLogout()`.

### `js/DashboardManager.js`

- **Peran:** Manajer Halaman Dashboard.
- **Tanggung Jawab:**
  - `updateDashboard()`: Me-refresh semua data di dashboard.
  - `updateAnalytics()`: Menghitung statistik keuangan.
  - `toggleBalanceVisibility()`: Method ini dipanggil oleh `onclick` di `index.html`.

### `js/TargetManager.js`

- **Peran:** Manajer Fitur Target.
- **Tanggung Jawab:**
  - `init()`: Mendaftarkan _listener_ `submit` untuk `#add-target-form`.
  - `renderTargets()`: Me-render daftar target di halaman "Target".
  - `deleteTarget(name)`: Method ini dipanggil oleh `onclick` yang dihasilkan oleh `renderTargets()`.

### `js/TransactionManager.js`

- **Peran:** Manajer Transaksi (Nabung & Keluar).
- **Tanggung Jawab:**
  - `init()`: Mendaftarkan _listener_ `submit` untuk `#nabung-form` dan `#pengeluaran-form`.
  - Logika `handleNabung()`.
  - Logika `handlePengeluaran()` (termasuk validasi penarikan target 1x/tahun 30%).

### `js/HistoryManager.js`

- **Peran:** Manajer Halaman Riwayat.
- **Tanggung Jawab:**
  - `init()`: Mendaftarkan _listener_ untuk Tab (`.tab-btn`).
  - `renderRiwayat()`: Fungsi utama untuk me-refresh data di halaman riwayat.
  - `showTargetRiwayat(targetName)`: Method ini dipanggil oleh `onclick` yang dihasilkan oleh `renderTargetRiwayat()`.
