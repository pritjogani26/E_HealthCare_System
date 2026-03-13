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
// // // import { apiService } from "../services/api";
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
// // //         const refreshed = await apiService.refreshToken();
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
// // //       const profile = await apiService.getCurrentUserProfile();
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
// // //     const { access_token, user: userData } = await apiService.login({
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
// // //       await apiService.logout();
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
// //         const refreshed = await apiService.refreshToken();
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
// //       const profile = await apiService.getCurrentUserProfile();
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
// //     const { access_token, user: userData } = await apiService.login({ email, password });
// //     if (!isTokenValid(access_token)) throw new Error("Server returned an invalid access token.");
// //     localStorage.setItem("access_token", access_token);
// //     setUser(extractBaseUser(userData));
// //   }, []);

// //   const logout = useCallback(async () => {
// //     setIsInactivityModalVisible(false);
// //     restorableFormsRef.current.clear();
// //     try {
// //       await apiService.logout();
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
//         const refreshed = await apiService.refreshToken();
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
//       const profile = await apiService.getCurrentUserProfile();
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
//     const { access_token, user: userData } = await apiService.login({ email, password });
//     if (!isTokenValid(access_token)) throw new Error("Server returned an invalid access token.");
//     localStorage.setItem("access_token", access_token);
//     setUser(extractBaseUser(userData));
//   }, []);

//   const logout = useCallback(async () => {
//     setIsInactivityModalVisible(false);
//     restorableFormsRef.current.clear();
//     try {
//       await apiService.logout();
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
import { apiService } from "../services/api";
import { useInactivityTimer } from "../hooks/useInactivityTimer";
import { RestorableFormEntry } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  setAuthUser: (user: AuthUser, token: string) => void;
  registerRestorableForm: (
    formId: string,
    onRestore: () => void,
    onBeforeTimeout?: () => void
  ) => void;
  unregisterRestorableForm: (formId: string) => void;
  // Consumed by InactivityModalPortal in App.tsx
  isInactivityModalVisible: boolean;
  handleInactivityContinue: () => void;
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
  const [isInactivityModalVisible, setIsInactivityModalVisible] = useState(false);

  const restorableFormsRef = useRef<Map<string, RestorableFormEntry>>(new Map());

  // ── Session init ────────────────────────────────────────────────────────────

  const initAuth = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!isTokenValid(token)) {
      try {
        const refreshed = await apiService.refreshToken();
        localStorage.setItem("access_token", refreshed.access_token);
        if (refreshed.user) setUser(extractBaseUser(refreshed.user));
      } catch {
        localStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    try {
      const profile = await apiService.getCurrentUserProfile();
      setUser(extractBaseUser(profile));
    } catch {
      localStorage.removeItem("access_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { initAuth(); }, [initAuth]);

  // ── Auth Actions ────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    const { access_token, user: userData } = await apiService.login({ email, password });
    if (!isTokenValid(access_token)) throw new Error("Server returned an invalid access token.");
    localStorage.setItem("access_token", access_token);
    setUser(extractBaseUser(userData));
  }, []);

  const logout = useCallback(async () => {
    setIsInactivityModalVisible(false);
    restorableFormsRef.current.clear();
    try {
      await apiService.logout();
    } catch {
      // non-critical
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => { await initAuth(); }, [initAuth]);

  const setAuthUser = useCallback((authUser: AuthUser, token: string) => {
    localStorage.setItem("access_token", token);
    setUser(authUser);
  }, []);

  // ── Back-button lock ────────────────────────────────────────────────────────
  //
  // Problem: when the inactivity modal is visible, pressing the browser back
  // button navigates the history stack, unmounting the modal without any
  // re-authentication — a security bypass.
  //
  // Fix:
  //   1. When the modal opens, push a dummy history entry. Now the back button
  //      hits THIS entry instead of the real previous page.
  //   2. Listen for `popstate` (fired when back/forward is pressed). When it
  //      fires while the modal is open, immediately push ANOTHER dummy entry.
  //      This keeps the user trapped on the current URL until they complete
  //      re-auth or click Logout.
  //   3. When the modal closes (success or logout), remove the listener.
  //      On success we also call history.back() once to consume the dummy
  //      entry so the browser history is clean.

  useEffect(() => {
    if (!isInactivityModalVisible) return;

    // Push a dummy entry so the very first back-press hits this and not
    // the real previous page.
    window.history.pushState({ inactivityBlock: true }, "");

    const handlePopState = (e: PopStateEvent) => {
      // The user tried to navigate away — push another guard entry to
      // keep them on the current page.
      window.history.pushState({ inactivityBlock: true }, "");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isInactivityModalVisible]);

  // ── Inactivity ──────────────────────────────────────────────────────────────

  const handleInactivityTimeout = useCallback(() => {
    if (!user) return;
    // Snapshot all registered forms before the modal appears (Scenario B)
    restorableFormsRef.current.forEach((entry) => entry.onBeforeTimeout?.());
    setIsInactivityModalVisible(true);
  }, [user]);

  // Timer is paused while the modal is open so typing the password doesn't
  // race against the idle counter.
  useInactivityTimer({
    onTimeout: handleInactivityTimeout,
    enabled: !!user && !isInactivityModalVisible,
  });

  // ── Form Registry ───────────────────────────────────────────────────────────

  const registerRestorableForm = useCallback(
    (formId: string, onRestore: () => void, onBeforeTimeout?: () => void) => {
      restorableFormsRef.current.set(formId, { formId, onRestore, onBeforeTimeout });
    }, []
  );

  const unregisterRestorableForm = useCallback((formId: string) => {
    restorableFormsRef.current.delete(formId);
  }, []);

  // ── Modal handlers ──────────────────────────────────────────────────────────

  const handleInactivityContinue = useCallback(() => {
    // Remove the dummy history entry we pushed when the modal opened,
    // so the browser history is clean after a successful re-auth.
    window.history.back();
    setIsInactivityModalVisible(false);
    restorableFormsRef.current.forEach((entry) => entry.onRestore());
  }, []);

  // ── Value ───────────────────────────────────────────────────────────────────

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
      refreshUser,
      setAuthUser,
      registerRestorableForm,
      unregisterRestorableForm,
      isInactivityModalVisible,
      handleInactivityContinue,
    }),
    [user, isLoading, login, logout, refreshUser, setAuthUser,
     registerRestorableForm, unregisterRestorableForm,
     isInactivityModalVisible, handleInactivityContinue]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}