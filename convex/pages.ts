import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("pages")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
  },
});

export const getChildren = query({
  args: { parentId: v.optional(v.id("pages")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("pages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .filter((q) => q.eq(q.field("ownerId"), userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    parentId: v.optional(v.id("pages")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("pages", {
      title: args.title,
      content: "",
      parentId: args.parentId,
      ownerId: userId,
      type: "document",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("pages"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const page = await ctx.db.get(args.id);
    if (!page || page.ownerId !== userId) {
      throw new Error("Page not found or access denied");
    }

    const updates: { title?: string; content?: string } = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("pages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const page = await ctx.db.get(args.id);
    if (!page || page.ownerId !== userId) {
      throw new Error("Page not found or access denied");
    }

    await ctx.db.delete(args.id);
  },
});
