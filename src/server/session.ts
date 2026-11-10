import "server-only";
import { headers } from "next/headers";
import { getAuth } from "./auth";
import type { Actor } from "./policy";
export async function currentActor(): Promise<Actor | null> {
  const result = await getAuth().api.getSession({ headers: await headers() });
  return result
    ? {
        id: result.user.id,
        role: result.user.role,
        emailVerified: result.user.emailVerified,
      }
    : null;
}
