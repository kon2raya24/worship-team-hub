// Pure constants + label helpers for roles. Safe to import from client components.

export type Role = "leader" | "member";

/**
 * Display label for a role. We keep `leader` / `member` as the database value
 * (no migration needed) but show friendlier "Editor" / "Member" everywhere.
 */
export function roleLabel(role: Role | string): string {
  return role === "leader" ? "Editor" : "Member";
}
