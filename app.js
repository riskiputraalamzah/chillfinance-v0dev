// ===============================
// UTILITIES & HELPERS
// ===============================

const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

const getFormattedDate = () => {
  const today = new Date();
  const options = { weekday: "long", day: "numeric", month: "long" };
  return today.toLocaleDateString("id-ID", options);
};

const validateUsername = (username) => {
  if (username.length < 3 || username.length > 32) {
    return { valid: false, error: "Username harus 3-32 karakter." };
  }
  if (!/^[A-Za-z0-9_\-\s]+$/.test(username)) {
    return {
      valid: false,
      error: "Username hanya boleh berisi huruf, angka, spasi, _ atau -.",
    };
  }
  return { valid: true, error: "" };
};

const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, error: "Password minimal 6 karakter." };
  }
  return { valid: true, error: "" };
};

// ===============================
// STORAGE MANAGEMENT
// ===============================

class StorageManager {
  static getUsers() {
    const users = localStorage.getItem("users");
    return users ? JSON.parse(users) : {};
  }

  static setUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
  }

  static getUser(username) {
    const users = this.getUsers();
    return users[username.toLowerCase()] || null;
  }

  static createUser(username, password) {
    const users = this.getUsers();
    const usernameLower = username.toLowerCase();

    if (usernameLower in users) {
      return false;
    }

    users[usernameLower] = {
      username,
      password,
      saldo_utama: 0,
      targets: {},
      riwayat: [],
      created_at: new Date().toLocaleString("id-ID"),
    };

    this.setUsers(users);
    return true;
  }

  static updateUser(username, userData) {
    const users = this.getUsers();
    users[username.toLowerCase()] = userData;
    this.setUsers(users);
  }

  static getCurrentUser() {
    const username = sessionStorage.getItem("currentUser");
    return username ? this.getUser(username) : null;
  }

  static setCurrentUser(username) {
    sessionStorage.setItem("currentUser", username.toLowerCase());
  }

  static logout() {
    sessionStorage.removeItem("currentUser");
  }
}

// ===============================
// STATE MANAGEMENT
// ===============================

let currentUser = StorageManager.getCurrentUser();
let balanceVisible = true;

// ===============================
// PAGE NAVIGATION
// ===============================

function switchPage(pageId) {
  document.querySelectorAll(".auth-page").forEach((page) => {
    page.classList.remove("active");
  });
  document.getElementById(pageId).classList.add("active");
}

function switchNavPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });
  document.getElementById(pageId).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelector(`[data-page="${pageId}"]`).classList.add("active");

  // Update tabs if needed
  if (pageId === "riwayat") {
    renderRiwayat();
  }
}

// ===============================
// AUTH FUNCTIONS
// ===============================

document.getElementById("login-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const user = StorageManager.getUser(username);
  if (!user || user.password !== password) {
    alert("❌ Username atau password salah.");
    return;
  }

  StorageManager.setCurrentUser(username);
  currentUser = user;
  showApp();
  e.target.reset();
});

document.getElementById("register-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById("register-confirm").value;

  // Clear errors
  document.getElementById("username-error").textContent = "";
  document.getElementById("password-error").textContent = "";
  document.getElementById("confirm-error").textContent = "";

  // Validate username
  const usernameCheck = validateUsername(username);
  if (!usernameCheck.valid) {
    document.getElementById("username-error").textContent = usernameCheck.error;
    return;
  }

  // Check if username exists
  if (StorageManager.getUser(username)) {
    document.getElementById("username-error").textContent =
      "Username sudah terdaftar.";
    return;
  }

  // Validate password
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    document.getElementById("password-error").textContent = passwordCheck.error;
    return;
  }

  // Check password match
  if (password !== confirmPassword) {
    document.getElementById("confirm-error").textContent =
      "Password tidak cocok.";
    return;
  }

  // Create user
  if (StorageManager.createUser(username, password)) {
    alert("✅ Registrasi berhasil! Silakan login.");
    switchPage("login-page");
    e.target.reset();
  }
});

function logout() {
  if (confirm("Yakin ingin logout?")) {
    StorageManager.logout();
    currentUser = null;
    hideApp();
    switchPage("login-page");
    document.getElementById("login-form").reset();
    document.getElementById("register-form").reset();
  }
}

document.getElementById("logout-btn")?.addEventListener("click", logout);

// ===============================
// APP DISPLAY FUNCTIONS
// ===============================

function showApp() {
  document.getElementById("auth-container").classList.add("hidden");
  document.getElementById("main-app").classList.remove("hidden");
  updateDashboard();
  setDateDisplay();
  updateUsername();
}

function hideApp() {
  document.getElementById("auth-container").classList.remove("hidden");
  document.getElementById("main-app").classList.add("hidden");
}

function setDateDisplay() {
  document.getElementById("date-display").textContent = getFormattedDate();
}

function updateUsername() {
  if (currentUser) {
    document.getElementById(
      "username-display"
    ).textContent = `Hi, ${currentUser.username}! 👋`;
  }
}

function toggleBalanceVisibility() {
  balanceVisible = !balanceVisible;
  updateDashboard();
}

// ===============================
// DASHBOARD FUNCTIONS
// ===============================

function updateDashboard() {
  updateBalance();
  updateAnalytics();
  renderDashboardTargets();
  populateTargetSelects();
}

function updateBalance() {
  const balanceElement = document.getElementById("balance-display");
  if (balanceVisible) {
    balanceElement.textContent = formatRupiah(currentUser.saldo_utama);
  } else {
    balanceElement.textContent = "••••••";
  }
}

function updateAnalytics() {
  let totalNabung = 0;
  let totalKeluar = 0;

  // Count utama transactions
  currentUser.riwayat.forEach((tx) => {
    if (tx[1] === "nabung") totalNabung += tx[2];
    if (tx[1] === "keluar") totalKeluar += tx[2];
  });

  // Count target transactions
  Object.values(currentUser.targets).forEach((target) => {
    target.riwayat?.forEach((tx) => {
      if (tx[1] === "nabung") totalNabung += tx[2];
      if (tx[1] === "keluar") totalKeluar += tx[2];
    });
  });

  const rasio = totalNabung > 0 ? (totalKeluar / totalNabung) * 100 : 0;
  let status = "Sehat 😎";
  if (rasio < 30) {
    status = "Dompet Sehat 😎";
  } else if (rasio <= 60) {
    status = "Cukup Stabil 🙂";
  } else {
    status = "Boros Banget 😭";
  }

  document.getElementById("total-nabung").textContent =
    formatRupiah(totalNabung);
  document.getElementById("total-keluar").textContent =
    formatRupiah(totalKeluar);
  document.getElementById("rasio-keluar").textContent = rasio.toFixed(1) + "%";
  document.getElementById("status-keuangan").textContent = status;
}

function renderDashboardTargets() {
  const container = document.getElementById("dashboard-targets");
  const targets = currentUser.targets;

  if (Object.keys(targets).length === 0) {
    container.innerHTML =
      '<p class="riwayat-empty">Belum ada target tabungan. Buat yang pertama yuk! 🎯</p>';
    return;
  }

  container.innerHTML = Object.entries(targets)
    .slice(0, 3)
    .map(([name, target]) => createTargetElement(name, target))
    .join("");
}

function createTargetElement(name, target) {
  const percentage = Math.min(
    100,
    Math.round((target.saldo / target.target) * 100)
  );
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
                <span>${formatRupiah(target.saldo)} / ${formatRupiah(
    target.target
  )}</span>
                <span class="target-item-status ${statusClass}">${statusText}</span>
            </div>
        </div>
    `;
}

// ===============================
// TARGET FUNCTIONS
// ===============================

function populateTargetSelects() {
  const activTargets = Object.entries(currentUser.targets)
    .filter(([_, t]) => t.status !== "selesai")
    .map(([name, _]) => name);

  // Nabung target select
  const nabungSelect = document.getElementById("nabung-target");
  if (nabungSelect) {
    nabungSelect.innerHTML =
      '<option value="">Pilih target...</option>' +
      activTargets
        .map((name) => `<option value="${name}">${name}</option>`)
        .join("");
  }

  // Pengeluaran target select
  const pengeluaranSelect = document.getElementById("pengeluaran-target");
  if (pengeluaranSelect) {
    pengeluaranSelect.innerHTML =
      '<option value="">Pilih target...</option>' +
      activTargets
        .map((name) => `<option value="${name}">${name}</option>`)
        .join("");
  }
}

// format target
document.getElementById("target-nominal")?.addEventListener("input", (e) => {
  const value = e.target.value;
  document.getElementById("format-target").textContent = value
    ? formatRupiah(value)
    : "Rp 0";
});
document.getElementById("add-target-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("target-name").value;
  const nominal = Number.parseInt(
    document.getElementById("target-nominal").value
  );

  if (
    Object.keys(currentUser.targets).some(
      (n) => n.toLowerCase() === name.toLowerCase()
    )
  ) {
    alert("❌ Target dengan nama tersebut sudah ada.");
    return;
  }

  currentUser.targets[name] = {
    target: nominal,
    saldo: 0,
    status: "aktif",
    riwayat: [],
    last_withdraw: null,
  };

  StorageManager.updateUser(currentUser.username, currentUser);
  alert(`✅ Target '${name}' berhasil dibuat!`);
  e.target.reset();
  renderTargets();
  updateDashboard();
});

function renderTargets() {
  const container = document.getElementById("targets-list");

  if (Object.keys(currentUser.targets).length === 0) {
    container.innerHTML =
      '<p class="riwayat-empty">Belum ada target. Buat yang pertama yuk! 🎯</p>';
    return;
  }

  container.innerHTML = Object.entries(currentUser.targets)
    .map(([name, target]) => {
      const percentage = Math.min(
        100,
        Math.round((target.saldo / target.target) * 100)
      );
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
                        <span>${formatRupiah(target.saldo)} / ${formatRupiah(
        target.target
      )}</span>
                        <span class="target-item-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="target-item-actions">
                        <button class="btn-delete" onclick="deleteTarget('${name}')">🗑️ Hapus</button>
                    </div>
                </div>
            `;
    })
    .join("");
}

function deleteTarget(name) {
  if (confirm(`Yakin hapus target '${name}'?`)) {
    delete currentUser.targets[name];
    StorageManager.updateUser(currentUser.username, currentUser);
    renderTargets();
    updateDashboard();
  }
}

// ===============================
// NABUNG FUNCTIONS
// ===============================

document.getElementById("nabung-sumber")?.addEventListener("change", (e) => {
  const targetGroup = document.getElementById("target-select-group");
  if (e.target.value === "target") {
    targetGroup.classList.remove("hidden");
  } else {
    targetGroup.classList.add("hidden");
  }
});

document.getElementById("nabung-jumlah")?.addEventListener("input", (e) => {
  const value = e.target.value;
  document.getElementById("format-nabung").textContent = value
    ? formatRupiah(value)
    : "Rp 0";
});

document.getElementById("nabung-catatan")?.addEventListener("input", (e) => {
  const count = e.target.value.length;
  e.target.parentElement.querySelector(
    ".count-text"
  ).textContent = `${count}/120`;
});

document.getElementById("nabung-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const sumber = document.getElementById("nabung-sumber").value;
  const jumlah = Number.parseInt(
    document.getElementById("nabung-jumlah").value
  );
  const catatan = document.getElementById("nabung-catatan").value || "-";

  if (sumber === "utama") {
    currentUser.saldo_utama += jumlah;
    currentUser.riwayat.push([
      new Date().toLocaleString("id-ID"),
      "nabung",
      jumlah,
      catatan,
    ]);
    alert(`✅ Nabung Rp ${formatRupiah(jumlah)} ke saldo utama berhasil!`);
  } else {
    const targetName = document.getElementById("nabung-target").value;
    if (!targetName) {
      alert("❌ Pilih target terlebih dahulu.");
      return;
    }

    const target = currentUser.targets[targetName];
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
        `✅ Nabung Rp ${formatRupiah(
          jumlah
        )} ke target '${targetName}' berhasil!`
      );
    }
  }

  StorageManager.updateUser(currentUser.username, currentUser);
  updateDashboard();
  e.target.reset();
  switchNavPage("dashboard");
});

// ===============================
// PENGELUARAN FUNCTIONS
// ===============================

document
  .getElementById("pengeluaran-sumber")
  ?.addEventListener("change", (e) => {
    const targetGroup = document.getElementById("pengeluaran-target-group");
    if (e.target.value === "target") {
      targetGroup.classList.remove("hidden");
    } else {
      targetGroup.classList.add("hidden");
    }
  });

document
  .getElementById("pengeluaran-jumlah")
  ?.addEventListener("input", (e) => {
    const value = e.target.value;
    document.getElementById("format-pengeluaran").textContent = value
      ? formatRupiah(value)
      : "Rp 0";
  });

document
  .getElementById("pengeluaran-catatan")
  ?.addEventListener("input", (e) => {
    const count = e.target.value.length;
    e.target.parentElement.querySelector(
      ".count-text"
    ).textContent = `${count}/120`;
  });

document.getElementById("pengeluaran-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const sumber = document.getElementById("pengeluaran-sumber").value;
  const jumlah = Number.parseInt(
    document.getElementById("pengeluaran-jumlah").value
  );
  const catatan = document.getElementById("pengeluaran-catatan").value || "-";

  if (sumber === "utama") {
    if (jumlah > currentUser.saldo_utama) {
      currentUser.saldo_utama = 0;
    } else {
      currentUser.saldo_utama -= jumlah;
    }
    currentUser.riwayat.push([
      new Date().toLocaleString("id-ID"),
      "keluar",
      jumlah,
      catatan,
    ]);
    alert(
      `✅ Pengeluaran Rp ${formatRupiah(jumlah)} dari saldo utama dicatat.`
    );
  } else {
    const targetName = document.getElementById("pengeluaran-target").value;
    if (!targetName) {
      alert("❌ Pilih target terlebih dahulu.");
      return;
    }

    const target = currentUser.targets[targetName];
    const now = new Date();
    const lastWithdraw = target.last_withdraw
      ? new Date(target.last_withdraw)
      : null;

    if (lastWithdraw) {
      const daysDiff = Math.floor((now - lastWithdraw) / (1000 * 60 * 60 * 24));
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
        `⚠️ Penarikan maksimal 30% = Rp ${formatRupiah(maxTarik)}. Lanjutkan?`
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
      `✅ Penarikan Rp ${formatRupiah(
        maxTarik
      )} dari target '${targetName}' berhasil!`
    );
  }

  StorageManager.updateUser(currentUser.username, currentUser);
  updateDashboard();
  e.target.reset();
  switchNavPage("dashboard");
});

// ===============================
// RIWAYAT FUNCTIONS
// ===============================

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
      renderTargetRiwayat();
    }
  });
});

function renderRiwayat() {
  renderUtamaRiwayat();
  renderTargetRiwayat();
}

function renderUtamaRiwayat() {
  const container = document.getElementById("utama-riwayat");
  if (currentUser.riwayat.length === 0) {
    container.innerHTML =
      '<p class="riwayat-empty">Belum ada riwayat transaksi.</p>';
    return;
  }

  container.innerHTML = currentUser.riwayat
    .slice()
    .reverse()
    .map(
      ([tanggal, tipe, jumlah, catatan]) => `
            <div class="riwayat-item ${tipe}">
                <div class="riwayat-info">
                    <div class="riwayat-title">${
                      tipe === "nabung" ? "➕ Nabung" : "➖ Pengeluaran"
                    }</div>
                    <div class="riwayat-time">${tanggal}</div>
                    ${
                      catatan !== "-"
                        ? `<div class="riwayat-note">${catatan}</div>`
                        : ""
                    }
                </div>
                <div class="riwayat-amount ${tipe}">${
        tipe === "nabung" ? "+" : "-"
      } ${formatRupiah(jumlah)}</div>
            </div>
        `
    )
    .join("");
}

function renderTargetRiwayat() {
  const container = document.getElementById("target-riwayat-selector");
  const riwayatContainer = document.getElementById("target-riwayat");
  const targets = Object.keys(currentUser.targets);

  if (targets.length === 0) {
    container.innerHTML = "";
    riwayatContainer.innerHTML =
      '<p class="riwayat-empty">Belum ada target.</p>';
    return;
  }

  container.innerHTML = targets
    .map(
      (name, idx) => `
            <button class="target-selector-btn ${
              idx === 0 ? "active" : ""
            }" onclick="showTargetRiwayat('${name}')">
                ${name}
            </button>
        `
    )
    .join("");

  if (targets.length > 0) {
    showTargetRiwayat(targets[0]);
  }
}

function showTargetRiwayat(targetName) {
  document.querySelectorAll(".target-selector-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.textContent.trim() === targetName) {
      btn.classList.add("active");
    }
  });

  const target = currentUser.targets[targetName];
  const container = document.getElementById("target-riwayat");

  if (!target.riwayat || target.riwayat.length === 0) {
    container.innerHTML =
      '<p class="riwayat-empty">Belum ada riwayat transaksi pada target ini.</p>';
    return;
  }

  container.innerHTML = target.riwayat
    .slice()
    .reverse()
    .map(
      ([tanggal, tipe, jumlah, catatan]) => `
            <div class="riwayat-item ${tipe}">
                <div class="riwayat-info">
                    <div class="riwayat-title">${
                      tipe === "nabung" ? "➕ Nabung" : "➖ Penarikan"
                    }</div>
                    <div class="riwayat-time">${tanggal}</div>
                    ${
                      catatan !== "-"
                        ? `<div class="riwayat-note">${catatan}</div>`
                        : ""
                    }
                </div>
                <div class="riwayat-amount ${tipe}">${
        tipe === "nabung" ? "+" : "-"
      } ${formatRupiah(jumlah)}</div>
            </div>
        `
    )
    .join("");
}

// ===============================
// NAV BUTTON EVENT LISTENERS
// ===============================

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pageId = btn.getAttribute("data-page");
    switchNavPage(pageId);

    if (pageId === "targets") {
      renderTargets();
    }
  });
});

// ===============================
// INITIALIZE APP
// ===============================

if (currentUser) {
  showApp();
} else {
  hideApp();
}
