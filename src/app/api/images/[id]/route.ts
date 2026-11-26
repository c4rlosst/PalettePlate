import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { images, posts } from "@/db/schema";
import { currentActor } from "@/server/session";
import { getImage } from "@/server/storage";
export const runtime = "nodejs";
const notFound = () => new Response("Not found", { status: 404 });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!uuid.test(id)) return notFound();
  let actor;
  try {
    actor = await currentActor();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!actor?.emailVerified) return new Response("Unauthorized", { status: 401 });
  const db = getDb();
  const [image] = await db
    .select({
      path: images.path,
      mimeType: images.mimeType,
      ownerId: images.ownerId,
      postId: images.postId,
    })
    .from(images)
    .where(eq(images.id, id))
    .limit(1);
  if (!image) return notFound();
  // Visible to its owner, to admins, and to everyone once attached to a published post.
  let allowed = image.ownerId === actor.id || actor.role === "admin";
  if (!allowed && image.postId) {
    const [post] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.id, image.postId), eq(posts.status, "approved")))
      .limit(1);
    allowed = !!post;
  }
  if (!allowed) return notFound();
  try {
    const file = await getImage(image.path);
    return new Response(file.stream, {
      headers: {
        "Content-Type": image.mimeType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=86400",
        ...(file.length ? { "Content-Length": String(file.length) } : {}),
      },
    });
  } catch {
    return notFound();
  }
}
