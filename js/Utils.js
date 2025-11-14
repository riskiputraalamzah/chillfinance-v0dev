// ===============================
// UTILITIES (Class Statis)
// ===============================
export class Utils {
  static formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  }

  static getFormattedDate() {
    const today = new Date();
    const options = { weekday: "long", day: "numeric", month: "long" };
    return today.toLocaleDateString("id-ID", options);
  }

  static validateUsername(username) {
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
  }

  static validatePassword(password) {
    if (password.length < 6) {
      return { valid: false, error: "Password minimal 6 karakter." };
    }
    return { valid: true, error: "" };
  }
}
