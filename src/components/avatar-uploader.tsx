"use client";
import { useRef, useState, useTransition } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { setAvatarAction, removeAvatarAction } from "@/app/actions";

/** Crop to a centered square and shrink, which also removes camera metadata such as GPS. */
async function squarePhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot prepare photos.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 512, 512);
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    512,
    512,
  );
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.88),
  );
  if (!blob) throw new Error("That photo could not be prepared.");
  return blob;
}

export function AvatarUploader({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  function pick(file: File | undefined) {
    if (!file) return;
    setMessage("");
    start(async () => {
      try {
        const body = new FormData();
        body.append("file", await squarePhoto(file), "avatar.jpg");
        const res = await fetch("/api/uploads?kind=avatar", {
          method: "POST",
          body,
        });
        const data = (await res.json().catch(() => ({}))) as {
          id?: string;
          message?: string;
        };
        if (!res.ok || !data.id) {
          setMessage(data.message || "The photo could not be uploaded.");
          return;
        }
        const result = await setAvatarAction(data.id);
        if (!result.ok) setMessage(result.message);
      } catch (e) {
        setMessage(
          e instanceof Error ? e.message : "Something went wrong. Try again.",
        );
      } finally {
        if (input.current) input.current.value = "";
      }
    });
  }

  return (
    <section className="avatar-uploader" aria-label="Profile picture">
      <Avatar name={name} src={image} size={88} />
      <div>
        <h2>Profile picture</h2>
        <p className="muted">Shown on your posts, comments and profile page.</p>
        <div className="avatar-actions">
          <label className="button button-secondary button-small avatar-pick">
            <Camera size={16} /> {image ? "Change photo" : "Add a photo"}
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={pending}
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>
          {image && (
            <button
              type="button"
              className="button button-secondary button-small"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await removeAvatarAction();
                  if (!result.ok) setMessage(result.message);
                })
              }
            >
              <Trash2 size={15} /> Remove
            </button>
          )}
        </div>
        <p role="status" className="form-message">
          {pending ? "Saving…" : message}
        </p>
      </div>
    </section>
  );
}
