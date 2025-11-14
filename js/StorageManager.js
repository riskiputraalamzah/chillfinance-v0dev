// ===============================
// STORAGE MANAGEMENT (Class Statis)
// ===============================
export class StorageManager {
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
