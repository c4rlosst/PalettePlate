import { describe, it, expect, vi, beforeEach } from "vitest";
import { drizzle } from "drizzle-orm/mysql-proxy";
import * as schema from "../src/db/schema";
import { requireOwner, requireAdmin, type Actor } from "../src/server/policy";
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
  dailyEntries,
  deleteEntry,
  setPreference,
  saveProfile,
} from "../src/server/data";
const alice: Actor = { id: "alice", role: "user", emailVerified: true };
beforeEach(() => {
  state.calls = [];
  state.rows = [];
});
describe("default-deny authorization", () => {
  it("denies ownership bypass even for administrators", () => {
    expect(() => requireOwner(alice, "bob")).toThrow();
    expect(() => requireOwner({ ...alice, role: "admin" }, "bob")).toThrow();
  });
  it("denies non-admins, moderators, and unverified admins", () => {
    for (const actor of [
      null,
      alice,
      { ...alice, role: "moderator" },
      { ...alice, role: "admin", emailVerified: false },
    ])
      expect(() => requireAdmin(actor)).toThrow();
    expect(() => requireAdmin({ ...alice, role: "admin" })).not.toThrow();
  });
  it("does not query private data for anonymous or unverified users", async () => {
    await expect(dailyEntries(null, "2026-11-10")).rejects.toThrow();
    await expect(
      setPreference(
        { ...alice, emailVerified: false },
        { foodId: "x", preference: "liked" },
      ),
    ).rejects.toThrow();
    expect(state.calls).toHaveLength(0);
  });
  it("scopes daily reads to the authenticated user even if input supplies a different user", async () => {
    await dailyEntries(alice, "2026-11-10");
    expect(state.calls[0].sql).toContain("`entries`.`user_id` = ?");
    expect(state.calls[0].params[0]).toBe("alice");
  });
  it("prevents user A deleting user B’s meal before executing a delete", async () => {
    state.rows = [["bob"]];
    await expect(
      deleteEntry(alice, "43cf301d-fdf4-4079-a52c-dd440b9c43a2"),
    ).rejects.toThrow("access");
    expect(state.calls).toHaveLength(1);
    expect(state.calls[0].sql).toMatch(/^select/);
  });
  it("ignores attempted role and owner injection in profile updates", async () => {
    await saveProfile(alice, {
      name: "Alice",
      region: "Davao",
      gender: "",
      contactNumber: "",
      role: "admin",
      id: "bob",
    });
    expect(state.calls[0].sql).not.toContain("`role`");
    expect(state.calls[0].params.at(-1)).toBe("alice");
    expect(state.calls[0].params).not.toContain("bob");
  });
});
