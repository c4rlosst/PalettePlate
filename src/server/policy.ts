export type Actor = { id: string; role: string; emailVerified: boolean };
export function requireVerified(actor: Actor | null): asserts actor is Actor {
  if (!actor || !actor.emailVerified)
    throw new Error("Sign in with a verified email to continue.");
}
export function requireOwner(actor: Actor | null, ownerId: string) {
  requireVerified(actor);
  if (actor.id !== ownerId)
    throw new Error("You do not have access to this item.");
}
export function requireOwnerOrAdmin(
  actor: Actor | null,
  ownerId: string,
): asserts actor is Actor {
  requireVerified(actor);
  if (actor.id !== ownerId && actor.role !== "admin")
    throw new Error("You do not have access to this item.");
}
export function requireAdmin(actor: Actor | null): asserts actor is Actor {
  requireVerified(actor);
  if (actor.role !== "admin")
    throw new Error("Administrator access is required.");
}
