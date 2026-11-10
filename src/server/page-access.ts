import "server-only";
import { redirect } from "next/navigation";
import { currentActor } from "./session";
export async function pageActor() {
  let actor;
  try {
    actor = await currentActor();
  } catch {
    return null;
  }
  if (!actor?.emailVerified) redirect("/auth");
  return actor;
}
