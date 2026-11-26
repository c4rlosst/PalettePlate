import { Camera } from "lucide-react";
import { Shell } from "@/components/shell";
import { Setup } from "@/components/setup";
import { PostComposer, PostCard } from "@/components/feed";
import { pageActor } from "@/server/page-access";
import { listFeed } from "@/server/feed";
import { toFeedPosts } from "@/server/feed-view";
import { listRecipes } from "@/server/data";
export const dynamic = "force-dynamic";
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
  const posts = toFeedPosts(rows, actor);
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
              <PostCard key={post.id} post={post} viewerId={actor.id} />
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
