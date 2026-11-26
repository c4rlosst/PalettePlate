import { describe, it, expect, vi, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/mysql-proxy";
import * as schema from "../src/db/schema";
import type { Actor } from "../src/server/policy";
import { detectImage } from "../src/lib/image-sniff";
const state = vi.hoisted(() => ({
  rows: [] as string[][],
  calls: [] as { sql: string; params: unknown[] }[],
}));
vi.mock("@/db", () => ({
  getDb: () =>
    drizzle(
      async (sql, params, method) => {
        state.calls.push({ sql, params });
        return {
          rows:
            method === "execute"
              ? [{ insertId: 0, affectedRows: 1 }]
              : state.rows,
        };
      },
      { schema },
    ),
}));
import {
  createPost,
  listFeed,
  toggleReaction,
  addComment,
  deleteComment,
  deletePost,
} from "../src/server/feed";
import {
  getPublicProfile,
  setAvatar,
  removeAvatar,
} from "../src/server/people";
const alice: Actor = { id: "alice", role: "user", emailVerified: true };
const uuid = "43cf301d-fdf4-4079-a52c-dd440b9c43a2";
beforeEach(() => {
  state.calls = [];
  state.rows = [];
});
describe("feed permissions", () => {
  it("does not touch the database for anonymous or unverified users", async () => {
    const unverified = { ...alice, emailVerified: false };
    for (const actor of [null, unverified]) {
      await expect(listFeed(actor)).rejects.toThrow();
      await expect(
        createPost(actor, { imageId: uuid, content: "hi" }),
      ).rejects.toThrow();
      await expect(toggleReaction(actor, uuid)).rejects.toThrow();
      await expect(addComment(actor, uuid, "nice")).rejects.toThrow();
      await expect(deleteComment(actor, uuid)).rejects.toThrow();
      await expect(deletePost(actor, uuid)).rejects.toThrow();
    }
    expect(state.calls).toHaveLength(0);
  });
  it("rejects malformed input before any query", async () => {
    await expect(
      createPost(alice, { imageId: "not-a-uuid", content: "" }),
    ).rejects.toThrow();
    await expect(
      createPost(alice, { imageId: uuid, content: "x".repeat(1001) }),
    ).rejects.toThrow();
    await expect(addComment(alice, uuid, "   ")).rejects.toThrow("comment");
    await expect(
      addComment(alice, uuid, "x".repeat(501)),
    ).rejects.toThrow("500");
    await expect(toggleReaction(alice, "nope")).rejects.toThrow();
    expect(state.calls).toHaveLength(0);
  });
  it("stops people deleting someone else's post or comment", async () => {
    state.rows = [["bob"]];
    await expect(deletePost(alice, uuid)).rejects.toThrow("access");
    expect(state.calls).toHaveLength(1);
    expect(state.calls[0].sql).toMatch(/^select/);
    state.calls = [];
    state.rows = [["bob"]];
    await expect(deleteComment(alice, uuid)).rejects.toThrow("access");
    expect(state.calls).toHaveLength(1);
  });
  it("only lists published posts", async () => {
    await listFeed(alice);
    expect(state.calls[0].sql).toContain("`posts`.`status` = ?");
    expect(state.calls[0].params).toContain("approved");
  });
});
describe("public profiles and profile pictures", () => {
  it("does not touch the database for anonymous or unverified users", async () => {
    const unverified = { ...alice, emailVerified: false };
    for (const actor of [null, unverified]) {
      await expect(getPublicProfile(actor, "bob")).rejects.toThrow();
      await expect(setAvatar(actor, uuid)).rejects.toThrow();
      await expect(removeAvatar(actor)).rejects.toThrow();
    }
    expect(state.calls).toHaveLength(0);
  });
  it("never reads private account fields for a public profile", async () => {
    await getPublicProfile(alice, "bob");
    const sql = state.calls.map((c) => c.sql).join("\n");
    expect(sql).toContain("`users`");
    for (const secret of [
      "`email`",
      "`contact_number`",
      "`region`",
      "`gender`",
      "`role`",
    ])
      expect(sql).not.toContain(secret);
  });
  it("only accepts the caller's own profile-picture upload", async () => {
    await expect(setAvatar(alice, "not-a-uuid")).rejects.toThrow();
    expect(state.calls).toHaveLength(0);
    await expect(setAvatar(alice, uuid)).rejects.toThrow("not available");
    expect(state.calls).toHaveLength(1);
    expect(state.calls[0].params).toContain("alice");
    expect(state.calls[0].sql).toContain("`images`.`owner_id` = ?");
  });
  it("limits a profile page to that person's published posts", async () => {
    await listFeed(alice, { authorId: "bob" });
    expect(state.calls[0].sql).toContain("`posts`.`user_id` = ?");
    expect(state.calls[0].params).toContain("bob");
    expect(state.calls[0].params).toContain("approved");
  });
});
describe("image type detection", () => {
  const pad = (...head: number[]) =>
    Uint8Array.from([...head, ...new Array(16).fill(0)]);
  it("recognises JPEG, PNG and WebP by their first bytes", () => {
    expect(detectImage(pad(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe("image/jpeg");
    expect(
      detectImage(pad(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.mime,
    ).toBe("image/png");
    const webp = Uint8Array.from([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0, 0,
    ]);
    expect(detectImage(webp)?.mime).toBe("image/webp");
  });
  it("rejects GIFs, text, scripts, SVG and tiny files", () => {
    const text = (s: string) => new TextEncoder().encode(s.padEnd(20, " "));
    expect(detectImage(text("GIF89a"))).toBeNull();
    expect(detectImage(text("<svg xmlns='x'></svg>"))).toBeNull();
    expect(detectImage(text("<script>alert(1)</script>"))).toBeNull();
    expect(detectImage(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});
