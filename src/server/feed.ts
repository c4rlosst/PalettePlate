import "server-only";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import {
  comments,
  images,
  posts,
  reactions,
  recipes,
  user,
} from "@/db/schema";
import { requireOwnerOrAdmin, requireVerified, type Actor } from "./policy";
import { deleteImage } from "./storage";

const id = z.string().uuid();
const postInput = z.object({
  imageId: id,
  content: z.string().trim().max(1000).default(""),
  recipeId: z.union([id, z.literal("")]).default(""),
});
export async function createPost(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const data = postInput.parse(input);
  const db = getDb();
  const postId = crypto.randomUUID();
  const authorId = actor.id;
  await db.transaction(async (tx) => {
    const [image] = await tx
      .select({ id: images.id })
      .from(images)
      .where(
        and(
          eq(images.id, data.imageId),
          eq(images.ownerId, authorId),
          isNull(images.postId),
        ),
      )
      .limit(1);
    if (!image)
      throw new Error("That photo is not available. Upload it again.");
    if (data.recipeId) {
      const [recipe] = await tx
        .select({ id: recipes.id })
        .from(recipes)
        .where(eq(recipes.id, data.recipeId))
        .limit(1);
      if (!recipe) throw new Error("That recipe was not found.");
    }
    await tx.insert(posts).values({
      id: postId,
      userId: authorId,
      recipeId: data.recipeId || null,
      content: data.content,
      status: "approved",
    });
    await tx
      .update(images)
      .set({ postId })
      .where(and(eq(images.id, data.imageId), eq(images.ownerId, authorId)));
  });
  return postId;
}
export async function listFeed(actor: Actor | null) {
  requireVerified(actor);
  const db = getDb();
  const rows = await db
    .select({
      id: posts.id,
      userId: posts.userId,
      content: posts.content,
      createdAt: posts.createdAt,
      authorName: user.name,
      recipeId: posts.recipeId,
      recipeName: recipes.name,
      imageId: images.id,
    })
    .from(posts)
    .innerJoin(user, eq(user.id, posts.userId))
    .leftJoin(recipes, eq(recipes.id, posts.recipeId))
    .leftJoin(images, eq(images.postId, posts.id))
    .where(eq(posts.status, "approved"))
    .orderBy(desc(posts.createdAt))
    .limit(30);
  const unique = [...new Map(rows.map((r) => [r.id, r])).values()];
  if (!unique.length) return [];
  const ids = unique.map((p) => p.id);
  const [likes, talk] = await Promise.all([
    db
      .select({ postId: reactions.postId, userId: reactions.userId })
      .from(reactions)
      .where(inArray(reactions.postId, ids)),
    db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        authorName: user.name,
      })
      .from(comments)
      .innerJoin(user, eq(user.id, comments.userId))
      .where(inArray(comments.postId, ids))
      .orderBy(asc(comments.createdAt)),
  ]);
  return unique.map((p) => ({
    ...p,
    likeCount: likes.filter((l) => l.postId === p.id).length,
    liked: likes.some((l) => l.postId === p.id && l.userId === actor.id),
    comments: talk.filter((c) => c.postId === p.id).slice(-50),
  }));
}
async function requirePublishedPost(postId: string) {
  const [post] = await getDb()
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.status, "approved")))
    .limit(1);
  if (!post) throw new Error("This post is no longer available.");
}
export async function toggleReaction(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const postId = id.parse(input);
  await requirePublishedPost(postId);
  const db = getDb();
  const [existing] = await db
    .select({ postId: reactions.postId })
    .from(reactions)
    .where(and(eq(reactions.postId, postId), eq(reactions.userId, actor.id)))
    .limit(1);
  if (existing)
    await db
      .delete(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.userId, actor.id)));
  else
    await db
      .insert(reactions)
      .values({ postId, userId: actor.id })
      .onDuplicateKeyUpdate({ set: { postId } });
}
export async function addComment(
  actor: Actor | null,
  postInputId: unknown,
  content: unknown,
) {
  requireVerified(actor);
  const postId = id.parse(postInputId);
  const text = z
    .string()
    .trim()
    .min(1, "Write a comment first.")
    .max(500, "Comments can be up to 500 characters.")
    .parse(content);
  await requirePublishedPost(postId);
  await getDb().insert(comments).values({
    id: crypto.randomUUID(),
    postId,
    userId: actor.id,
    content: text,
  });
}
export async function deleteComment(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const commentId = id.parse(input);
  const db = getDb();
  const [comment] = await db
    .select({ userId: comments.userId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!comment) throw new Error("This comment was not found.");
  requireOwnerOrAdmin(actor, comment.userId);
  await db.delete(comments).where(eq(comments.id, commentId));
}
export async function deletePost(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const postId = id.parse(input);
  const db = getDb();
  const [post] = await db
    .select({ userId: posts.userId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (!post) throw new Error("This post was not found.");
  requireOwnerOrAdmin(actor, post.userId);
  const attached = await db
    .select({ id: images.id, path: images.path })
    .from(images)
    .where(eq(images.postId, postId));
  await db.transaction(async (tx) => {
    // images.post_id is RESTRICT, so the photo rows go first.
    await tx.delete(images).where(eq(images.postId, postId));
    await tx.delete(posts).where(eq(posts.id, postId));
  });
  // Best effort: a leftover object is harmless and private.
  await Promise.allSettled(attached.map((i) => deleteImage(i.path)));
}
