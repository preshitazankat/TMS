import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

// Define the type of the decoded JWT payload
interface DecodedToken {
  name?: string;
  email?: string;
  role?: string;
  exp?: number; // optional: token expiry
}

interface User {
  id: any;
  name: string;
  email: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User>({
    name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    const token = Cookies.get("token"); // read JWT from cookies
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token); // type-safe decode
        setUser({
          name: decoded.name || "User",
          email: decoded.email || "",
          role: decoded.role || "",
        });
      } catch (error) {
        console.error("Invalid JWT token:", error);
        setUser({ name: "", email: "", role: "" });
      }
    }
  }, []);

  const logout = () => {
    Cookies.remove("token"); // remove token cookie
    window.location.href = "/login"; // redirect to login
  };

  return { user, logout, role: user.role };
};
