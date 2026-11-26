"use client";
import { useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, Heart, ImagePlus, MessageCircle, Trash2, X } from "lucide-react";
import {
  createPostAction,
  toggleReactionAction,
  addCommentAction,
  deleteCommentAction,
  deletePostAction,
} from "@/app/actions";

/** Resize and re-encode in the browser: keeps uploads small and strips camera metadata such as GPS. */
async function preparePhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot prepare photos.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) throw new Error("That photo could not be prepared.");
  return blob;
}

export function PostComposer({
  recipes,
}: {
  recipes: { id: string; name: string }[];
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  function choose(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : "");
    setMessage("");
  }

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        if (!file) return;
        setMessage("");
        start(async () => {
          try {
            const body = new FormData();
            body.append("file", await preparePhoto(file), "photo.jpg");
            const res = await fetch("/api/uploads", { method: "POST", body });
            const data = (await res.json().catch(() => ({}))) as {
              id?: string;
              message?: string;
            };
            if (!res.ok || !data.id) {
              setMessage(data.message || "The photo could not be uploaded.");
              return;
            }
            const result = await createPostAction({
              imageId: data.id,
              content: caption,
              recipeId,
            });
            if (!result.ok) {
              setMessage(result.message);
              return;
            }
            choose(null);
            setCaption("");
            setRecipeId("");
            if (input.current) input.current.value = "";
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Something went wrong. Try again.",
            );
          }
        });
      }}
    >
      <h2>Share what you cooked</h2>
      {preview ? (
        <div className="composer-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview of your photo" />
          <button
            type="button"
            className="icon-button"
            aria-label="Remove photo"
            onClick={() => {
              choose(null);
              if (input.current) input.current.value = "";
            }}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <label className="photo-drop">
          <ImagePlus size={26} />
          <span>Add a photo</span>
          <small>JPEG, PNG or WebP</small>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => choose(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      <textarea
        rows={2}
        maxLength={1000}
        placeholder="Say something about it (optional)"
        aria-label="Caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <div className="composer-row">
        <select
          aria-label="Cookbook recipe"
          value={recipeId}
          onChange={(e) => setRecipeId(e.target.value)}
        >
          <option value="">No recipe</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <button className="button" disabled={pending || !file}>
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
      <p role="status" className="form-message">
        {message}
      </p>
    </form>
  );
}

export type FeedPost = {
  id: string;
  authorName: string;
  when: string;
  content: string;
  imageId: string | null;
  recipeId: string | null;
  recipeName: string | null;
  likeCount: number;
  liked: boolean;
  canDelete: boolean;
  comments: {
    id: string;
    authorName: string;
    content: string;
    when: string;
    canDelete: boolean;
  }[];
};

export function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likeCount);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [comments, addOptimisticComment] = useOptimistic(
    post.comments,
    (current, next: FeedPost["comments"][number]) => [...current, next],
  );

  function like() {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    start(async () => {
      const result = await toggleReactionAction(post.id);
      if (!result.ok) {
        setLiked(!next);
        setLikes((n) => n + (next ? -1 : 1));
        setMessage(result.message);
      }
    });
  }

  return (
    <article className="post-card">
      <header className="post-head">
        <span className="avatar" aria-hidden="true">
          {post.authorName.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div>
          <strong>{post.authorName}</strong>
          <small>{post.when}</small>
        </div>
        {post.canDelete && (
          <button
            className="icon-button post-delete"
            aria-label="Delete post"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("Delete this post?")) return;
              start(async () => {
                const result = await deletePostAction(post.id);
                if (!result.ok) setMessage(result.message);
              });
            }}
          >
            <Trash2 size={17} />
          </button>
        )}
      </header>
      {post.imageId && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="post-photo"
          src={`/api/images/${post.imageId}`}
          alt={post.content || `A dish shared by ${post.authorName}`}
          loading="lazy"
        />
      )}
      {post.recipeId && post.recipeName && (
        <Link href={`/recipes/${post.recipeId}`} className="recipe-chip">
          <BookOpen size={15} /> {post.recipeName}
        </Link>
      )}
      {post.content && <p className="post-text">{post.content}</p>}
      <div className="post-actions">
        <button
          className="like-button"
          aria-pressed={liked}
          onClick={like}
          disabled={pending}
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
          <span>{likes}</span>
          <span className="visually-hidden">{likes === 1 ? "like" : "likes"}</span>
        </button>
        <span className="comment-count">
          <MessageCircle size={18} /> {comments.length}
          <span className="visually-hidden">comments</span>
        </span>
      </div>
      {comments.length > 0 && (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id}>
              <p>
                <strong>{c.authorName}</strong> {c.content}
              </p>
              <small>{c.when}</small>
              {c.canDelete && (
                <button
                  className="comment-delete"
                  aria-label="Delete comment"
                  onClick={() =>
                    start(async () => {
                      const result = await deleteCommentAction(c.id);
                      if (!result.ok) setMessage(result.message);
                    })
                  }
                >
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        className="comment-form"
        onSubmit={(event) => {
          event.preventDefault();
          const text = comment.trim();
          if (!text) return;
          setMessage("");
          setComment("");
          start(async () => {
            addOptimisticComment({
              id: `pending-${Date.now()}`,
              authorName: "You",
              content: text,
              when: "Just now",
              canDelete: false,
            });
            const result = await addCommentAction(post.id, text);
            if (!result.ok) {
              setMessage(result.message);
              setComment(text);
            }
          });
        }}
      >
        <input
          aria-label="Add a comment"
          placeholder="Add a comment"
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button className="button button-small" disabled={pending || !comment.trim()}>
          Send
        </button>
      </form>
      {message && (
        <p role="alert" className="error">
          {message}
        </p>
      )}
    </article>
  );
}
