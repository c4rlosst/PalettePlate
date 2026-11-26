import Link from "next/link";
import { notFound } from "next/navigation";
import { Camera, Pencil } from "lucide-react";
import { Shell } from "@/components/shell";
import { Setup } from "@/components/setup";
import { Avatar } from "@/components/avatar";
import { PostCard } from "@/components/feed";
import { pageActor } from "@/server/page-access";
import { listFeed } from "@/server/feed";
import { toFeedPosts } from "@/server/feed-view";
import { getPublicProfile } from "@/server/people";
export const dynamic = "force-dynamic";
export default async function Person({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await pageActor();
  const { id } = await params;
  if (!actor)
    return (
      <Shell active="Feed">
        <Setup />
      </Shell>
    );
  const person = await getPublicProfile(actor, id).catch(() => null);
  if (!person) notFound();
  const posts = toFeedPosts(await listFeed(actor, { authorId: id }), actor);
  const mine = actor.id === person.id;
  const joined = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    year: "numeric",
  }).format(person.joined);
  return (
    <Shell active={mine ? "Profile" : "Feed"}>
      <div className="feed">
        <header className="person-head">
          <Avatar name={person.name} src={person.image} size={96} />
          <div>
            <h1>{person.name}</h1>
            <p>
              Joined {joined} · {person.postCount}{" "}
              {person.postCount === 1 ? "post" : "posts"}
            </p>
            {mine && (
              <Link href="/profile" className="button button-secondary button-small">
                <Pencil size={15} /> Edit profile
              </Link>
            )}
          </div>
        </header>
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
            <p>
              {mine
                ? "Share your first dish from the Feed page."
                : `${person.name} hasn't shared anything yet.`}
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}
