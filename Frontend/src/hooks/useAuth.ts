// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import {jwtDecode} from "jwt-decode";

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  name?: string;
  exp?: number;
}

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<TokenPayload | null>(null);
 
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decoded: TokenPayload = jwtDecode(storedToken);
        setToken(storedToken);
        setRole(decoded.role);
        setUser({
          id: decoded.id,      // ✅ ensure ID is included
          email: decoded.email,
          role: decoded.role,
          name: decoded.name
        });
        
      } catch (err) {
        console.error("Invalid token", err);
        logout(); // auto logout on invalid token
      } 
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setRole(null);
    setUser(null);
    // Optionally, redirect to login page:
     window.location.href = "/login";
  }, []);

  return { token, role, user, logout };
};
