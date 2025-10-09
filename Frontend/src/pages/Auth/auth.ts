// Small helper utilities for token decoding and role checks
import Cookies from "js-cookie";
export function decodeToken() {
    const token = Cookies.get("token");

    if (!token) return null;

    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch (err) {
        return null;
    }
}

export function isTokenValid() {
    const payload = decodeToken();
    if (!payload) return false;
    // token might have exp in seconds
    const exp = payload.exp;
    if (!exp) return true; // no expiry present -> consider valid
    const expiry = Number(exp) * 1000;
    return Date.now() < expiry;
}

export function isUserAdmin() {
    const payload = decodeToken();
    if (!payload) return false;
    // Common shapes: { role: 'admin' }, { isAdmin: true }, { roles: ['admin', ...] }
    if (payload.isAdmin === true) return true;
    const role = payload.role || payload?.user?.role;
    if (typeof role === "string" && role.toLowerCase() === "admin") return true;
    const roles = payload.roles || payload?.user?.roles;
    if (Array.isArray(roles) && roles.some((r: any) => String(r).toLowerCase() === "admin")) return true;
    return false;
}

export function getUserInfo() {
    return decodeToken() || null;
}
