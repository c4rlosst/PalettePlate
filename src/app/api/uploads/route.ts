import { and, eq, isNull, count } from "drizzle-orm";
import { getDb } from "@/db";
import { images } from "@/db/schema";
import { currentActor } from "@/server/session";
import { putImage } from "@/server/storage";
import { detectImage, MAX_UPLOAD_BYTES } from "@/lib/image-sniff";
export const runtime = "nodejs";
const fail = (message: string, status: number) =>
  Response.json({ message }, { status });
export async function POST(request: Request) {
  let actor;
  try {
    actor = await currentActor();
  } catch {
    return fail("Sign in with a verified email to share photos.", 401);
  }
  if (!actor?.emailVerified)
    return fail("Sign in with a verified email to share photos.", 401);
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return fail("That upload could not be read.", 400);
  }
  if (!(file instanceof File) || file.size === 0)
    return fail("Choose a photo to upload.", 400);
  if (file.size > MAX_UPLOAD_BYTES)
    return fail("That photo is too large. Try a smaller one.", 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImage(bytes);
  if (!kind) return fail("Use a JPEG, PNG or WebP photo.", 415);
  try {
    const db = getDb();
    const [pending] = await db
      .select({ n: count() })
      .from(images)
      .where(and(eq(images.ownerId, actor.id), isNull(images.postId)));
    if ((pending?.n ?? 0) >= 10)
      return fail("Post or remove your earlier photos before adding more.", 429);
    const id = crypto.randomUUID();
    const key = `posts/${actor.id}/${id}.${kind.ext}`;
    await putImage(key, bytes, kind.mime);
    await db
      .insert(images)
      .values({ id, ownerId: actor.id, path: key, mimeType: kind.mime, size: bytes.length });
    return Response.json({ id });
  } catch {
    return fail("The photo could not be saved. Try again in a moment.", 500);
  }
}
