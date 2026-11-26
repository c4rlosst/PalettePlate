import { Camera } from "lucide-react";
import { Shell } from "@/components/shell";
import { Setup } from "@/components/setup";
import { PostComposer, PostCard, type FeedPost } from "@/components/feed";
import { pageActor } from "@/server/page-access";
import { listFeed } from "@/server/feed";
import { listRecipes } from "@/server/data";
export const dynamic = "force-dynamic";
const stamp = (date: Date) =>
  new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
export default async function Feed() {
  const actor = await pageActor();
  if (!actor)
    return (
      <Shell active="Feed">
        <Setup />
      </Shell>
    );
  const [rows, cookbook] = await Promise.all([
    listFeed(actor),
    listRecipes(actor),
  ]);
  const isAdmin = actor.role === "admin";
  const posts: FeedPost[] = rows.map((p) => ({
    id: p.id,
    authorName: p.authorName,
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
      authorName: c.authorName,
      content: c.content,
      when: stamp(c.createdAt),
      canDelete: isAdmin || c.userId === actor.id,
    })),
  }));
  return (
    <Shell active="Feed">
      <div className="feed">
        <div className="page-heading">
          <div>
            <h1>Feed</h1>
            <p>Dishes people made, with the cookbook recipe behind them.</p>
          </div>
        </div>
        <PostComposer
          recipes={cookbook.map((r) => ({ id: r.id, name: r.name }))}
        />
        {posts.length ? (
          <div className="post-list">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="empty-meals">
            <span className="empty-icon">
              <Camera size={28} />
            </span>
            <h3>No posts yet.</h3>
            <p>Be the first to share a photo of something you cooked.</p>
          </div>
        )}
      </div>
    </Shell>
  );
}
