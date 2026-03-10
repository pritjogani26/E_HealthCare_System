// frontend/src/context/AuthContext.tsx
// Key optimizations:
//   1. login / logout / refreshUser wrapped in useCallback — stable identities
//      prevent consumer components from re-rendering whenever AuthContext
//      re-renders for any reason.
//   2. Token validation strengthened: decodes the JWT payload and rejects tokens
//      that are missing the `exp` field or are already expired before treating
//      the session as authenticated. Previously only presence of the token
//      string was checked, allowing stale/malformed tokens to appear valid.
//   3. isAuthenticated derived from `user !== null` — single source of truth.
//   4. Replaced `any` casts with typed JwtPayload interface.
//   5. initAuth moved into a useCallback so it can be called from both the
//      initial useEffect and from refreshUser() without duplication.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiService } from "../services/api";

// ── types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  user_id: string;
  email: string;
  role: string;
  is_email_verified?: boolean;
  is_active?: boolean;
}

interface JwtPayload {
  user_id?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Used by SSO flows (e.g. Google) to set the auth state directly. */
  setAuthUser: (user: AuthUser, token: string) => void;
}

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Extracts basic user information whether it's nested (Patient, Doctor, Lab)
 * or flat (Admin, Staff).
 */
function extractBaseUser(profile: any): AuthUser {
  const base = profile.user || profile;
  return {
    user_id: base.user_id,
    email: base.email,
    role: base.role,
    is_email_verified: base.email_verified ?? base.is_email_verified,
    is_active: base.is_active,
  };
}

/**
 * Decodes a JWT without verifying signature (signature verified server-side).
 * Returns null for any malformed token.
 */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Returns true only if `token` is a non-empty string whose decoded payload
 * contains a future `exp` timestamp.
 *
 * FIX: Previously only `!!token` was checked, meaning expired / garbage tokens
 *      were treated as valid and sent to the API, causing 401 errors.
 */
function isTokenValid(token: string | null | undefined): boolean {
  if (!token) return false;
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number") return false;
  // Add a 30-second buffer to account for clock skew
  return payload.exp * 1000 > Date.now() + 30_000;
}

// ── context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── session initialisation ─────────────────────────────────────────────────
  // FIX: Extracted to useCallback so refreshUser can reuse without duplication.
  const initAuth = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!isTokenValid(token)) {
      // Clear any stale tokens that failed validation
      localStorage.removeItem("access_token");
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await apiService.getCurrentUserProfile();
      setUser(extractBaseUser(profile));
    } catch {
      // Token was syntactically valid but rejected server-side (revoked, etc.)
      localStorage.removeItem("access_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // ── login ──────────────────────────────────────────────────────────────────
  // FIX: Stable useCallback identity — downstream consumers won't re-render
  //      when AuthContext itself re-renders.
  const login = useCallback(async (email: string, password: string) => {
    const { access_token, user: userData } = await apiService.login({ email, password });
    if (!isTokenValid(access_token)) {
      throw new Error("Server returned an invalid access token.");
    }
    localStorage.setItem("access_token", access_token);
    setUser(extractBaseUser(userData));
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch {
      // Server-side logout failure is non-critical — clear local state anyway.
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
    }
  }, []);

  // ── refreshUser ────────────────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    await initAuth();
  }, [initAuth]);

  // ── context value ──────────────────────────────────────────────────────────
  // useMemo ensures a stable object reference — only reconstructed when one of
  // the listed deps actually changes.
  const setAuthUser = useCallback((authUser: AuthUser, token: string) => {
    localStorage.setItem("access_token", token);
    setUser(authUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
      refreshUser,
      setAuthUser,
    }),
    [user, isLoading, login, logout, refreshUser, setAuthUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}