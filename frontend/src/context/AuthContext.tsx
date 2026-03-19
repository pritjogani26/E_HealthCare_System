// // // // frontend/src/context/AuthContext.tsx

// // // import React, {
// // //   createContext,
// // //   useCallback,
// // //   useContext,
// // //   useEffect,
// // //   useMemo,
// // //   useRef,
// // //   useState,
// // // } from "react";
// // // import { getCurrentUserProfile, login, logout, refreshToken } from "../services/api";
// // // import { useInactivityTimer } from "../hooks/useInactivityTimer";
// // // import { InactivityModal } from "../pages/InactivityModel";
// // // import { RestorableFormEntry } from "../types";

// // // // ── Types ─────────────────────────────────────────────────────────────────────

// // // export interface AuthUser {
// // //   user_id: string;
// // //   email: string;
// // //   role: string;
// // //   is_email_verified?: boolean;
// // //   is_active?: boolean;
// // // }

// // // interface JwtPayload {
// // //   user_id?: string;
// // //   exp?: number;
// // //   iat?: number;
// // //   [key: string]: unknown;
// // // }

// // // interface AuthContextValue {
// // //   user: AuthUser | null;
// // //   isAuthenticated: boolean;
// // //   isLoading: boolean;
// // //   login: (email: string, password: string) => Promise<void>;
// // //   logout: () => Promise<void>;
// // //   refreshUser: () => Promise<void>;
// // //   /** Used by SSO flows (e.g. Google) to set auth state directly. */
// // //   setAuthUser: (user: AuthUser, token: string) => void;
// // //   /** Scenario B — register a form to have its state snapshot + restored. */
// // //   registerRestorableForm: (
// // //     formId: string,
// // //     onRestore: () => void,
// // //     onBeforeTimeout?: () => void
// // //   ) => void;
// // //   unregisterRestorableForm: (formId: string) => void;
// // // }

// // // // ── Helpers ───────────────────────────────────────────────────────────────────

// // // /**
// // //  * Extracts base user fields from either a nested profile
// // //  * (Patient/Doctor/Lab) or a flat one (Admin/Staff).
// // //  */
// // // function extractBaseUser(profile: any): AuthUser {
// // //   const base = profile.user || profile;

// // //   let role = base.role;
// // //   if (!role) {
// // //     if (base.patient_id) role = "PATIENT";
// // //     else if (base.doctor_id) role = "DOCTOR";
// // //     else if (base.lab_id) role = "LAB";
// // //   }

// // //   return {
// // //     user_id: base.user_id ?? base.patient_id ?? base.doctor_id ?? base.lab_id,
// // //     email: base.email,
// // //     role,
// // //     is_email_verified: base.email_verified ?? base.is_email_verified,
// // //     is_active: base.is_active,
// // //   };
// // // }

// // // /** Decodes a JWT payload without verifying the signature. */
// // // function decodeJwt(token: string): JwtPayload | null {
// // //   try {
// // //     const parts = token.split(".");
// // //     if (parts.length !== 3) return null;
// // //     const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
// // //     return JSON.parse(payload) as JwtPayload;
// // //   } catch {
// // //     return null;
// // //   }
// // // }

// // // /** Returns false if the token is missing, malformed, or within 30 s of expiry. */
// // // function isTokenValid(token: string | null | undefined): boolean {
// // //   if (!token) return false;
// // //   const payload = decodeJwt(token);
// // //   if (!payload || typeof payload.exp !== "number") return false;
// // //   return payload.exp * 1000 > Date.now() + 30_000;
// // // }

// // // // ── Context ───────────────────────────────────────────────────────────────────

// // // const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// // // // ── Provider ──────────────────────────────────────────────────────────────────

// // // export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
// // //   children,
// // // }) => {
// // //   const [user, setUser] = useState<AuthUser | null>(null);
// // //   const [isLoading, setIsLoading] = useState(true);

// // //   // ── Inactivity modal ────────────────────────────────────────────────────────
// // //   const [isModalVisible, setIsModalVisible] = useState(false);

// // //   // ── Scenario B: form registry ───────────────────────────────────────────────
// // //   // Stored in a ref so registrations never cause a re-render and are always
// // //   // current inside callbacks (no stale closure issues).
// // //   const restorableFormsRef = useRef<Map<string, RestorableFormEntry>>(new Map());

// // //   // ── Session initialisation ──────────────────────────────────────────────────

// // //   const initAuth = useCallback(async () => {
// // //     const token = localStorage.getItem("access_token");

// // //     if (!isTokenValid(token)) {
// // //       // Access token missing / expired — attempt a silent refresh via the
// // //       // httpOnly refresh-token cookie before giving up.
// // //       try {
// // //         const refreshed = await refreshToken();
// // //         localStorage.setItem("access_token", refreshed.access_token);
// // //         if (refreshed.user) {
// // //           setUser(extractBaseUser(refreshed.user));
// // //         }
// // //       } catch {
// // //         localStorage.removeItem("access_token");
// // //         setUser(null);
// // //       } finally {
// // //         setIsLoading(false);
// // //       }
// // //       return;
// // //     }

// // //     try {
// // //       const profile = await getCurrentUserProfile();
// // //       setUser(extractBaseUser(profile));
// // //     } catch {
// // //       // Token was syntactically valid but rejected server-side.
// // //       localStorage.removeItem("access_token");
// // //       setUser(null);
// // //     } finally {
// // //       setIsLoading(false);
// // //     }
// // //   }, []);

// // //   useEffect(() => {
// // //     initAuth();
// // //   }, [initAuth]);

// // //   // ── Auth Actions ────────────────────────────────────────────────────────────

// // //   const login = useCallback(async (email: string, password: string) => {
// // //     const { access_token, user: userData } = await login({
// // //       email,
// // //       password,
// // //     });
// // //     if (!isTokenValid(access_token)) {
// // //       throw new Error("Server returned an invalid access token.");
// // //     }
// // //     localStorage.setItem("access_token", access_token);
// // //     setUser(extractBaseUser(userData));
// // //   }, []);

// // //   const logout = useCallback(async () => {
// // //     // 1. Close modal (prevents setState-on-unmount warnings in children)
// // //     setIsModalVisible(false);

// // //     // 2. Clear form registry
// // //     restorableFormsRef.current.clear();

// // //     // 3. Call backend — invalidates refresh-token cookie
// // //     try {
// // //       await logout();
// // //     } catch {
// // //       // Non-critical — clear local state regardless
// // //     } finally {
// // //       localStorage.removeItem("access_token");
// // //       setUser(null);
// // //     }
// // //   }, []);

// // //   const refreshUser = useCallback(async () => {
// // //     await initAuth();
// // //   }, [initAuth]);

// // //   const setAuthUser = useCallback((authUser: AuthUser, token: string) => {
// // //     localStorage.setItem("access_token", token);
// // //     setUser(authUser);
// // //   }, []);

// // //   // ── Inactivity Callbacks ────────────────────────────────────────────────────

// // //   const handleInactivityTimeout = useCallback(() => {
// // //     if (!user) return; // Guard: only act when actually authenticated

// // //     // ── Scenario B: snapshot all registered forms before the modal appears ──
// // //     // Each form component registers an optional `onBeforeTimeout` callback
// // //     // (typically its `takeSnapshot` function). We call all of them now so
// // //     // the snapshot is captured at the exact moment of inactivity expiry.
// // //     restorableFormsRef.current.forEach((entry) => {
// // //       entry.onBeforeTimeout?.();
// // //     });

// // //     setIsModalVisible(true);
// // //   }, [user]);

// // //   // ── Inactivity Timer ────────────────────────────────────────────────────────
// // //   // Disabled while the modal is open so typing the password doesn't reset
// // //   // the timer and cause a race condition.

// // //   useInactivityTimer({
// // //     onTimeout: handleInactivityTimeout,
// // //     enabled: !!user && !isModalVisible,
// // //   });

// // //   // ── Scenario B: Form Registry ───────────────────────────────────────────────

// // //   const registerRestorableForm = useCallback(
// // //     (
// // //       formId: string,
// // //       onRestore: () => void,
// // //       onBeforeTimeout?: () => void
// // //     ) => {
// // //       restorableFormsRef.current.set(formId, {
// // //         formId,
// // //         onRestore,
// // //         onBeforeTimeout,
// // //       });
// // //     },
// // //     []
// // //   );

// // //   const unregisterRestorableForm = useCallback((formId: string) => {
// // //     restorableFormsRef.current.delete(formId);
// // //   }, []);

// // //   // ── Modal Handlers ──────────────────────────────────────────────────────────

// // //   /**
// // //    * Called by InactivityModal after successful re-authentication.
// // //    * Scenario B: stay on the current page and restore all registered forms.
// // //    */
// // //   const handleModalContinue = useCallback(() => {
// // //     setIsModalVisible(false);

// // //     // Restore each registered form from its in-memory snapshot.
// // //     restorableFormsRef.current.forEach((entry) => {
// // //       entry.onRestore();
// // //     });
// // //     // No navigation — user stays exactly where they were.
// // //   }, []);

// // //   // ── Context Value ───────────────────────────────────────────────────────────

// // //   const value = useMemo<AuthContextValue>(
// // //     () => ({
// // //       user,
// // //       isAuthenticated: user !== null,
// // //       isLoading,
// // //       login,
// // //       logout,
// // //       refreshUser,
// // //       setAuthUser,
// // //       registerRestorableForm,
// // //       unregisterRestorableForm,
// // //     }),
// // //     [
// // //       user,
// // //       isLoading,
// // //       login,
// // //       logout,
// // //       refreshUser,
// // //       setAuthUser,
// // //       registerRestorableForm,
// // //       unregisterRestorableForm,
// // //     ]
// // //   );

// // //   // ── Render ──────────────────────────────────────────────────────────────────

// // //   return (
// // //     <AuthContext.Provider value={value}>
// // //       {children}

// // //       {/* Inactivity modal — rendered at the top of the tree so it overlays
// // //           everything. Only mounted while visible to avoid stale refs. */}
// // //       {isModalVisible && (
// // //         <InactivityModal
// // //           onContinue={handleModalContinue}
// // //           onLogout={logout}
// // //         />
// // //       )}
// // //     </AuthContext.Provider>
// // //   );
// // // };

// // // // ── Hook ──────────────────────────────────────────────────────────────────────

// // // export function useAuth(): AuthContextValue {
// // //   const ctx = useContext(AuthContext);
// // //   if (!ctx) {
// // //     throw new Error("useAuth must be used within <AuthProvider>");
// // //   }
// // //   return ctx;
// // // }

// // // frontend/src/context/AuthContext.tsx

// // import React, {
// //   createContext,
// //   useCallback,
// //   useContext,
// //   useEffect,
// //   useMemo,
// //   useRef,
// //   useState,
// // } from "react";
// // import { apiService } from "../services/api";
// // import { useInactivityTimer } from "../hooks/useInactivityTimer";
// // import { RestorableFormEntry } from "../types";

// // // ── Types ─────────────────────────────────────────────────────────────────────

// // export interface AuthUser {
// //   user_id: string;
// //   email: string;
// //   role: string;
// //   is_email_verified?: boolean;
// //   is_active?: boolean;
// // }

// // interface JwtPayload {
// //   user_id?: string;
// //   exp?: number;
// //   iat?: number;
// //   [key: string]: unknown;
// // }

// // interface AuthContextValue {
// //   user: AuthUser | null;
// //   isAuthenticated: boolean;
// //   isLoading: boolean;
// //   login: (email: string, password: string) => Promise<void>;
// //   logout: () => Promise<void>;
// //   refreshUser: () => Promise<void>;
// //   setAuthUser: (user: AuthUser, token: string) => void;
// //   registerRestorableForm: (
// //     formId: string,
// //     onRestore: () => void,
// //     onBeforeTimeout?: () => void
// //   ) => void;
// //   unregisterRestorableForm: (formId: string) => void;
// //   // Consumed by InactivityModalPortal in App.tsx
// //   isInactivityModalVisible: boolean;
// //   handleInactivityContinue: () => void;
// // }

// // // ── Helpers ───────────────────────────────────────────────────────────────────

// // function extractBaseUser(profile: any): AuthUser {
// //   const base = profile.user || profile;
// //   let role = base.role;
// //   if (!role) {
// //     if (base.patient_id) role = "PATIENT";
// //     else if (base.doctor_id) role = "DOCTOR";
// //     else if (base.lab_id) role = "LAB";
// //   }
// //   return {
// //     user_id: base.user_id ?? base.patient_id ?? base.doctor_id ?? base.lab_id,
// //     email: base.email,
// //     role,
// //     is_email_verified: base.email_verified ?? base.is_email_verified,
// //     is_active: base.is_active,
// //   };
// // }

// // function decodeJwt(token: string): JwtPayload | null {
// //   try {
// //     const parts = token.split(".");
// //     if (parts.length !== 3) return null;
// //     const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
// //     return JSON.parse(payload) as JwtPayload;
// //   } catch {
// //     return null;
// //   }
// // }

// // function isTokenValid(token: string | null | undefined): boolean {
// //   if (!token) return false;
// //   const payload = decodeJwt(token);
// //   if (!payload || typeof payload.exp !== "number") return false;
// //   return payload.exp * 1000 > Date.now() + 30_000;
// // }

// // // ── Context ───────────────────────────────────────────────────────────────────

// // const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// // // ── Provider ──────────────────────────────────────────────────────────────────

// // export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
// //   children,
// // }) => {
// //   const [user, setUser] = useState<AuthUser | null>(null);
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [isInactivityModalVisible, setIsInactivityModalVisible] = useState(false);

// //   const restorableFormsRef = useRef<Map<string, RestorableFormEntry>>(new Map());

// //   // ── Session init ────────────────────────────────────────────────────────────

// //   const initAuth = useCallback(async () => {
// //     const token = localStorage.getItem("access_token");
// //     if (!isTokenValid(token)) {
// //       try {
// //         const refreshed = await refreshToken();
// //         localStorage.setItem("access_token", refreshed.access_token);
// //         if (refreshed.user) setUser(extractBaseUser(refreshed.user));
// //       } catch {
// //         localStorage.removeItem("access_token");
// //         setUser(null);
// //       } finally {
// //         setIsLoading(false);
// //       }
// //       return;
// //     }
// //     try {
// //       const profile = await getCurrentUserProfile();
// //       setUser(extractBaseUser(profile));
// //     } catch {
// //       localStorage.removeItem("access_token");
// //       setUser(null);
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   }, []);

// //   useEffect(() => { initAuth(); }, [initAuth]);

// //   // ── Auth Actions ────────────────────────────────────────────────────────────

// //   const login = useCallback(async (email: string, password: string) => {
// //     const { access_token, user: userData } = await login({ email, password });
// //     if (!isTokenValid(access_token)) throw new Error("Server returned an invalid access token.");
// //     localStorage.setItem("access_token", access_token);
// //     setUser(extractBaseUser(userData));
// //   }, []);

// //   const logout = useCallback(async () => {
// //     setIsInactivityModalVisible(false);
// //     restorableFormsRef.current.clear();
// //     try {
// //       await logout();
// //     } catch {
// //       // non-critical
// //     } finally {
// //       localStorage.removeItem("access_token");
// //       setUser(null);
// //     }
// //   }, []);

// //   const refreshUser = useCallback(async () => { await initAuth(); }, [initAuth]);

// //   const setAuthUser = useCallback((authUser: AuthUser, token: string) => {
// //     localStorage.setItem("access_token", token);
// //     setUser(authUser);
// //   }, []);

// //   // ── Inactivity ──────────────────────────────────────────────────────────────

// //   const handleInactivityTimeout = useCallback(() => {
// //     if (!user) return;
// //     restorableFormsRef.current.forEach((entry) => entry.onBeforeTimeout?.());
// //     setIsInactivityModalVisible(true);
// //   }, [user]);

// //   useInactivityTimer({
// //     onTimeout: handleInactivityTimeout,
// //     enabled: !!user && !isInactivityModalVisible,
// //   });

// //   // ── Form Registry ───────────────────────────────────────────────────────────

// //   const registerRestorableForm = useCallback(
// //     (formId: string, onRestore: () => void, onBeforeTimeout?: () => void) => {
// //       restorableFormsRef.current.set(formId, { formId, onRestore, onBeforeTimeout });
// //     }, []
// //   );

// //   const unregisterRestorableForm = useCallback((formId: string) => {
// //     restorableFormsRef.current.delete(formId);
// //   }, []);

// //   const handleInactivityContinue = useCallback(() => {
// //     setIsInactivityModalVisible(false);
// //     restorableFormsRef.current.forEach((entry) => entry.onRestore());
// //   }, []);

// //   // ── Value ───────────────────────────────────────────────────────────────────

// //   const value = useMemo<AuthContextValue>(
// //     () => ({
// //       user,
// //       isAuthenticated: user !== null,
// //       isLoading,
// //       login,
// //       logout,
// //       refreshUser,
// //       setAuthUser,
// //       registerRestorableForm,
// //       unregisterRestorableForm,
// //       isInactivityModalVisible,
// //       handleInactivityContinue,
// //     }),
// //     [user, isLoading, login, logout, refreshUser, setAuthUser,
// //      registerRestorableForm, unregisterRestorableForm,
// //      isInactivityModalVisible, handleInactivityContinue]
// //   );

// //   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// // };

// // // ── Hook ──────────────────────────────────────────────────────────────────────

// // export function useAuth(): AuthContextValue {
// //   const ctx = useContext(AuthContext);
// //   if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
// //   return ctx;
// // }

// // frontend/src/context/AuthContext.tsx

// import React, {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { apiService } from "../services/api";
// import { useInactivityTimer } from "../hooks/useInactivityTimer";
// import { RestorableFormEntry } from "../types";

// // ── Types ─────────────────────────────────────────────────────────────────────

// export interface AuthUser {
//   user_id: string;
//   email: string;
//   role: string;
//   is_email_verified?: boolean;
//   is_active?: boolean;
// }

// interface JwtPayload {
//   user_id?: string;
//   exp?: number;
//   iat?: number;
//   [key: string]: unknown;
// }

// interface AuthContextValue {
//   user: AuthUser | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => Promise<void>;
//   refreshUser: () => Promise<void>;
//   setAuthUser: (user: AuthUser, token: string) => void;
//   registerRestorableForm: (
//     formId: string,
//     onRestore: () => void,
//     onBeforeTimeout?: () => void
//   ) => void;
//   unregisterRestorableForm: (formId: string) => void;
//   // Consumed by InactivityModalPortal in App.tsx
//   isInactivityModalVisible: boolean;
//   handleInactivityContinue: () => void;
// }

// // ── Helpers ───────────────────────────────────────────────────────────────────

// function extractBaseUser(profile: any): AuthUser {
//   const base = profile.user || profile;
//   let role = base.role;
//   if (!role) {
//     if (base.patient_id) role = "PATIENT";
//     else if (base.doctor_id) role = "DOCTOR";
//     else if (base.lab_id) role = "LAB";
//   }
//   return {
//     user_id: base.user_id ?? base.patient_id ?? base.doctor_id ?? base.lab_id,
//     email: base.email,
//     role,
//     is_email_verified: base.email_verified ?? base.is_email_verified,
//     is_active: base.is_active,
//   };
// }

// function decodeJwt(token: string): JwtPayload | null {
//   try {
//     const parts = token.split(".");
//     if (parts.length !== 3) return null;
//     const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
//     return JSON.parse(payload) as JwtPayload;
//   } catch {
//     return null;
//   }
// }

// function isTokenValid(token: string | null | undefined): boolean {
//   if (!token) return false;
//   const payload = decodeJwt(token);
//   if (!payload || typeof payload.exp !== "number") return false;
//   return payload.exp * 1000 > Date.now() + 30_000;
// }

// // ── Context ───────────────────────────────────────────────────────────────────

// const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// // ── Provider ──────────────────────────────────────────────────────────────────

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [user, setUser] = useState<AuthUser | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isInactivityModalVisible, setIsInactivityModalVisible] = useState(false);

//   const restorableFormsRef = useRef<Map<string, RestorableFormEntry>>(new Map());

//   // ── Session init ────────────────────────────────────────────────────────────

//   const initAuth = useCallback(async () => {
//     const token = localStorage.getItem("access_token");
//     if (!isTokenValid(token)) {
//       try {
//         const refreshed = await refreshToken();
//         localStorage.setItem("access_token", refreshed.access_token);
//         if (refreshed.user) setUser(extractBaseUser(refreshed.user));
//       } catch {
//         localStorage.removeItem("access_token");
//         setUser(null);
//       } finally {
//         setIsLoading(false);
//       }
//       return;
//     }
//     try {
//       const profile = await getCurrentUserProfile();
//       setUser(extractBaseUser(profile));
//     } catch {
//       localStorage.removeItem("access_token");
//       setUser(null);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => { initAuth(); }, [initAuth]);

//   // ── Auth Actions ────────────────────────────────────────────────────────────

//   const login = useCallback(async (email: string, password: string) => {
//     const { access_token, user: userData } = await login({ email, password });
//     if (!isTokenValid(access_token)) throw new Error("Server returned an invalid access token.");
//     localStorage.setItem("access_token", access_token);
//     setUser(extractBaseUser(userData));
//   }, []);

//   const logout = useCallback(async () => {
//     setIsInactivityModalVisible(false);
//     restorableFormsRef.current.clear();
//     try {
//       await logout();
//     } catch {
//       // non-critical
//     } finally {
//       localStorage.removeItem("access_token");
//       setUser(null);
//     }
//   }, []);

//   const refreshUser = useCallback(async () => { await initAuth(); }, [initAuth]);

//   const setAuthUser = useCallback((authUser: AuthUser, token: string) => {
//     localStorage.setItem("access_token", token);
//     setUser(authUser);
//   }, []);

//   // ── Inactivity ──────────────────────────────────────────────────────────────

//   const handleInactivityTimeout = useCallback(() => {
//     if (!user) return;
//     restorableFormsRef.current.forEach((entry) => entry.onBeforeTimeout?.());
//     setIsInactivityModalVisible(true);
//   }, [user]);

//   useInactivityTimer({
//     onTimeout: handleInactivityTimeout,
//     enabled: !!user && !isInactivityModalVisible,
//   });

//   // ── Form Registry ───────────────────────────────────────────────────────────

//   const registerRestorableForm = useCallback(
//     (formId: string, onRestore: () => void, onBeforeTimeout?: () => void) => {
//       restorableFormsRef.current.set(formId, { formId, onRestore, onBeforeTimeout });
//     }, []
//   );

//   const unregisterRestorableForm = useCallback((formId: string) => {
//     restorableFormsRef.current.delete(formId);
//   }, []);

//   const handleInactivityContinue = useCallback(() => {
//     setIsInactivityModalVisible(false);
//     restorableFormsRef.current.forEach((entry) => entry.onRestore());
//   }, []);

//   // ── Value ───────────────────────────────────────────────────────────────────

//   const value = useMemo<AuthContextValue>(
//     () => ({
//       user,
//       isAuthenticated: user !== null,
//       isLoading,
//       login,
//       logout,
//       refreshUser,
//       setAuthUser,
//       registerRestorableForm,
//       unregisterRestorableForm,
//       isInactivityModalVisible,
//       handleInactivityContinue,
//     }),
//     [user, isLoading, login, logout, refreshUser, setAuthUser,
//      registerRestorableForm, unregisterRestorableForm,
//      isInactivityModalVisible, handleInactivityContinue]
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// // ── Hook ──────────────────────────────────────────────────────────────────────

// export function useAuth(): AuthContextValue {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
//   return ctx;
// }

// frontend/src/context/AuthContext.tsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { login as apiLogin, logout as apiLogout, refreshToken as apiRefreshToken, getCurrentUserProfile as apiGetCurrentUserProfile, googleLogin as apiGoogleLogin } from "../services/api";
import { useInactivityTimer } from "../hooks/useInactivityTimer";
import { RestorableFormEntry } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  user_id: string;
  email: string;
  role: string;
  is_email_verified?: boolean;
  is_active?: boolean;
  permissions?: string[];
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
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAuthUser: (user: AuthUser, token: string, perms?: string[]) => void;
  registerRestorableForm: (
    formId: string,
    onRestore: () => void,
    onBeforeTimeout?: () => void,
  ) => void;
  unregisterRestorableForm: (formId: string) => void;
  isInactivityModalVisible: boolean;
  handleInactivityContinue: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INACTIVITY_FLAG_KEY = "inactivity_timeout_pending";

function setInactivityFlag() {
  sessionStorage.setItem(INACTIVITY_FLAG_KEY, "1");
}

function clearInactivityFlag() {
  sessionStorage.removeItem(INACTIVITY_FLAG_KEY);
}

function hasInactivityFlag(): boolean {
  return sessionStorage.getItem(INACTIVITY_FLAG_KEY) === "1";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractBaseUser(profile: any): AuthUser {
  const base = profile.user || profile;
  let role = base.role;
  if (!role) {
    if (base.patient_id) role = "PATIENT";
    else if (base.doctor_id) role = "DOCTOR";
    else if (base.lab_id) role = "LAB";
  }
  return {
    user_id: base.user_id ?? base.patient_id ?? base.doctor_id ?? base.lab_id,
    email: base.email,
    role,
    is_email_verified: base.email_verified ?? base.is_email_verified,
    is_active: base.is_active,
  };
}

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

function isTokenValid(token: string | null | undefined): boolean {
  if (!token) return false;
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp * 1000 > Date.now() + 30_000;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("user_permissions");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isInactivityModalVisible, setIsInactivityModalVisible] =
    useState<boolean>(() => hasInactivityFlag());

  const restorableFormsRef = useRef<Map<string, RestorableFormEntry>>(
    new Map(),
  );

  // ── Helpers for toggling modal + keeping flag in sync ───────────────────────

  const showModal = useCallback(() => {
    setInactivityFlag(); 
    setIsInactivityModalVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    clearInactivityFlag();
    setIsInactivityModalVisible(false);
  }, []);

  // ── Session init ────────────────────────────────────────────────────────────

  const initAuth = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!isTokenValid(token)) {
      try {
        const refreshed = await apiRefreshToken();
        localStorage.setItem("access_token", refreshed.access_token);
        if (refreshed.user) setUser(extractBaseUser(refreshed.user));
      } catch {
        localStorage.removeItem("access_token");
        clearInactivityFlag();
        setIsInactivityModalVisible(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    try {
      const profile = await apiGetCurrentUserProfile();
      setUser(extractBaseUser(profile));
    } catch {
      localStorage.removeItem("access_token");
      clearInactivityFlag();
      setIsInactivityModalVisible(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // ── Auth Actions ────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin({ email, password });
    const { access_token, user: userData, permissions: perms } = response;
    if (!isTokenValid(access_token))
      throw new Error("Server returned an invalid access token.");
    localStorage.setItem("access_token", access_token);
    const userPerms = perms ?? [];
    localStorage.setItem("user_permissions", JSON.stringify(userPerms));
    setPermissions(userPerms);
    setUser(extractBaseUser(userData));
  }, []);

  const logout = useCallback(async () => {
    hideModal();
    restorableFormsRef.current.clear();
    try {
      await apiLogout();
    } catch {
      // non-critical
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_permissions");
      setPermissions([]);
      setUser(null);
    }
  }, [hideModal]);

  const refreshUser = useCallback(async () => {
    await initAuth();
  }, [initAuth]);

  const setAuthUser = useCallback((authUser: AuthUser, token: string, perms?: string[]) => {
    localStorage.setItem("access_token", token);
    const userPerms = perms ?? authUser.permissions ?? [];
    localStorage.setItem("user_permissions", JSON.stringify(userPerms));
    setPermissions(userPerms);
    setUser(authUser);
  }, []);

  // ── Back-button lock ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isInactivityModalVisible) return;

    window.history.pushState({ inactivityBlock: true }, "");

    const handlePopState = () => {
      window.history.pushState({ inactivityBlock: true }, "");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isInactivityModalVisible]);

  // ── Inactivity timer ────────────────────────────────────────────────────────

  const handleInactivityTimeout = useCallback(() => {
    if (!user) return;
    restorableFormsRef.current.forEach((entry) => entry.onBeforeTimeout?.());
    showModal();
  }, [user, showModal]);

  useInactivityTimer({
    onTimeout: handleInactivityTimeout,
    enabled: !!user && !isInactivityModalVisible,
  });

  // ── Form Registry ───────────────────────────────────────────────────────────

  const registerRestorableForm = useCallback(
    (formId: string, onRestore: () => void, onBeforeTimeout?: () => void) => {
      restorableFormsRef.current.set(formId, {
        formId,
        onRestore,
        onBeforeTimeout,
      });
    },
    [],
  );

  const unregisterRestorableForm = useCallback((formId: string) => {
    restorableFormsRef.current.delete(formId);
  }, []);

  // ── Modal: continue (re-auth success) ──────────────────────────────────────

  const handleInactivityContinue = useCallback(() => {
    window.history.back();
    hideModal();
    restorableFormsRef.current.forEach((entry) => entry.onRestore());
  }, [hideModal]);

  // ── Value ───────────────────────────────────────────────────────────────────

  const hasPermission = useCallback(
    (permission: string) => {
      return permissions.includes(permission);
    },
    [permissions],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      permissions,
      hasPermission,
      login,
      logout,
      refreshUser,
      setAuthUser,
      registerRestorableForm,
      unregisterRestorableForm,
      isInactivityModalVisible,
      handleInactivityContinue,
    }),
    [
      user,
      isLoading,
      permissions,
      hasPermission,
      login,
      logout,
      refreshUser,
      setAuthUser,
      registerRestorableForm,
      unregisterRestorableForm,
      isInactivityModalVisible,
      handleInactivityContinue,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
