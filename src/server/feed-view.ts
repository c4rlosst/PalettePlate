import type { Actor } from "./policy";
import type { listFeed } from "./feed";
import type { FeedPost } from "@/components/feed";
type Row = Awaited<ReturnType<typeof listFeed>>[number];
export const stamp = (date: Date) =>
  new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
/** Turn database rows into the plain objects the post cards need, including who may delete what. */
export function toFeedPosts(rows: Row[], actor: Actor): FeedPost[] {
  const isAdmin = actor.role === "admin";
  return rows.map((p) => ({
    id: p.id,
    authorId: p.userId,
    authorName: p.authorName,
    authorImage: p.authorImage,
    when: stamp(p.createdAt),
    content: p.content,
    imageId: p.imageId,
    recipeId: p.recipeId,
    recipeName: p.recipeName,
    likeCount: p.likeCount,
    liked: p.liked,
    canDelete: isAdmin || p.userId === actor.id,
    comments: p.comments.map((c) => ({
      id: c.id,
      authorId: c.userId,
      authorName: c.authorName,
      authorImage: c.authorImage,
      content: c.content,
      when: stamp(c.createdAt),
      canDelete: isAdmin || c.userId === actor.id,
    })),
  }));
}
