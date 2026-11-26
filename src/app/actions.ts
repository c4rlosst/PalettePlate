"use server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { currentActor } from "@/server/session";
import {
  setPreference,
  logMeal,
  deleteEntry,
  saveProfile,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "@/server/data";
import {
  createPost,
  toggleReaction,
  addComment,
  deleteComment,
  deletePost,
} from "@/server/feed";
export type ActionResult = { ok: boolean; message: string; id?: string };
// Refresh only the pages an action can change; refreshing everything makes every click slow.
async function run(
  work: () => Promise<unknown>,
  paths: string[],
): Promise<ActionResult> {
  try {
    const result = await work();
    for (const path of paths) revalidatePath(path);
    return {
      ok: true,
      message: "Saved.",
      ...(typeof result === "string" ? { id: result } : {}),
    };
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof ZodError
          ? e.issues[0]?.message || "Check the form and try again."
          : e instanceof Error && !("query" in e) && !("cause" in e)
            ? e.message
            : "Could not save. Check the database connection and try again.",
    };
  }
}
export async function preferenceAction(input: unknown) {
  return run(async () => setPreference(await currentActor(), input), ["/foods"]);
}
export async function mealAction(input: unknown) {
  return run(async () => logMeal(await currentActor(), input), ["/"]);
}
export async function deleteMealAction(id: string) {
  return run(async () => deleteEntry(await currentActor(), id), ["/"]);
}
export async function createRecipeAction(input: unknown) {
  return run(async () => createRecipe(await currentActor(), input), [
    "/recipes",
  ]);
}
export async function updateRecipeAction(id: string, input: unknown) {
  return run(async () => updateRecipe(await currentActor(), id, input), [
    "/recipes",
  ]);
}
export async function deleteRecipeAction(id: string) {
  return run(async () => deleteRecipe(await currentActor(), id), ["/recipes"]);
}
export async function createPostAction(input: unknown) {
  return run(async () => createPost(await currentActor(), input), ["/feed"]);
}
export async function toggleReactionAction(postId: string) {
  // The heart updates instantly in the browser, so no page refresh is needed.
  return run(async () => toggleReaction(await currentActor(), postId), []);
}
export async function addCommentAction(postId: string, content: string) {
  return run(async () => addComment(await currentActor(), postId, content), [
    "/feed",
  ]);
}
export async function deleteCommentAction(commentId: string) {
  return run(async () => deleteComment(await currentActor(), commentId), [
    "/feed",
  ]);
}
export async function deletePostAction(postId: string) {
  return run(async () => deletePost(await currentActor(), postId), ["/feed"]);
}
export async function profileAction(input: unknown) {
  return run(async () => saveProfile(await currentActor(), input), ["/profile"]);
}
