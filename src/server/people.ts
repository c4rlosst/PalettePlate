import "server-only";
import { and, count, eq, like, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { images, posts, user } from "@/db/schema";
import { requireVerified, type Actor } from "./policy";
import { deleteImage } from "./storage";

/** What other members may see about someone: never email, contact number, region or gender. */
export async function getPublicProfile(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const id = z.string().min(1).max(36).parse(input);
  const db = getDb();
  const [person] = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      joined: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  if (!person) return null;
  const [published] = await db
    .select({ n: count() })
    .from(posts)
    .where(and(eq(posts.userId, id), eq(posts.status, "approved")));
  return { ...person, postCount: published?.n ?? 0 };
}
const avatarUrl = (id: string) => `/api/images/${id}`;
async function dropAvatarFiles(ownerId: string, keepId?: string) {
  const db = getDb();
  const old = await db
    .select({ id: images.id, path: images.path })
    .from(images)
    .where(
      keepId
        ? and(
            eq(images.ownerId, ownerId),
            like(images.path, "avatars/%"),
            ne(images.id, keepId),
          )
        : and(eq(images.ownerId, ownerId), like(images.path, "avatars/%")),
    );
  for (const row of old) await db.delete(images).where(eq(images.id, row.id));
  // Best effort: a leftover object is private-by-default and harmless.
  await Promise.allSettled(old.map((o) => deleteImage(o.path)));
}
export async function setAvatar(actor: Actor | null, input: unknown) {
  requireVerified(actor);
  const imageId = z.string().uuid().parse(input);
  const db = getDb();
  const [image] = await db
    .select({ id: images.id })
    .from(images)
    .where(
      and(
        eq(images.id, imageId),
        eq(images.ownerId, actor.id),
        like(images.path, "avatars/%"),
      ),
    )
    .limit(1);
  if (!image) throw new Error("That photo is not available. Upload it again.");
  await db
    .update(user)
    .set({ image: avatarUrl(imageId), updatedAt: new Date() })
    .where(eq(user.id, actor.id));
  await dropAvatarFiles(actor.id, imageId);
}
export async function removeAvatar(actor: Actor | null) {
  requireVerified(actor);
  await getDb()
    .update(user)
    .set({ image: null, updatedAt: new Date() })
    .where(eq(user.id, actor.id));
  await dropAvatarFiles(actor.id);
}
