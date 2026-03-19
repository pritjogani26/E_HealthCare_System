// frontend\src\utils\roles.ts
export type UserRole = "ADMIN" | "STAFF" | "DOCTOR" | "PATIENT" | "LAB" | "SUPERADMIN";

export function getUserRole(user: any): UserRole | null {
  return user?.user?.role ?? user?.role ?? null;
}

export function isAdmin(user: any): boolean {
  const role = getUserRole(user);
  return role === "ADMIN" || role === "STAFF" || role === "SUPERADMIN";
}

export function isDoctor(user: any): boolean {
  return getUserRole(user) === "DOCTOR";
}
export function isPatient(user: any): boolean {
  return getUserRole(user) === "PATIENT";
}

export function isLab(user: any): boolean {
  return getUserRole(user) === "LAB";
}