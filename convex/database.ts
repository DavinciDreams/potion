import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createDatabase = mutation({
  args: {
    title: v.string(),
    parentId: v.optional(v.id("pages")),
    schema: v.array(v.object({
      name: v.string(),
      type: v.union(
        v.literal("text"),
        v.literal("number"),
        v.literal("date"),
        v.literal("select"),
        v.literal("multiselect"),
        v.literal("status")
      ),
      options: v.optional(v.array(v.object({
        label: v.string(),
        color: v.string(),
      }))),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const pageId = await ctx.db.insert("pages", {
      title: args.title,
      content: "",
      parentId: args.parentId,
      ownerId: userId,
      type: "database",
      schema: args.schema,
    });

    // Create only a table view by default
    await ctx.db.insert("views", {
      pageId,
      name: "Table View",
      type: "table",
      config: {},
      ownerId: userId,
    });

    return pageId;
  },
});

export const addColumn = mutation({
  args: {
    pageId: v.id("pages"),
    column: v.object({
      name: v.string(),
      type: v.union(
        v.literal("text"),
        v.literal("number"),
        v.literal("date"),
        v.literal("select"),
        v.literal("multiselect"),
        v.literal("status")
      ),
      options: v.optional(v.array(v.object({
        label: v.string(),
        color: v.string(),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const page = await ctx.db.get(args.pageId);
    if (!page || page.ownerId !== userId || page.type !== "database") {
      throw new Error("Database not found or access denied");
    }

    const schema = [...(page.schema || []), args.column];
    await ctx.db.patch(args.pageId, { schema });
  },
});

export const getViews = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const views = await ctx.db
      .query("views")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .filter((q) => q.eq(q.field("ownerId"), userId))
      .collect();
    
    return views;
  },
});

export const getItems = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const items = await ctx.db
      .query("items")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .filter((q) => q.eq(q.field("ownerId"), userId))
      .collect();
    
    return items;
  },
});

export const createItem = mutation({
  args: {
    pageId: v.id("pages"),
    fields: v.record(v.string(), v.union(
      v.string(),
      v.number(),
      v.array(v.string()),
      v.null()
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const page = await ctx.db.get(args.pageId);
    if (!page || page.ownerId !== userId || page.type !== "database") {
      throw new Error("Database not found or access denied");
    }

    const itemId = await ctx.db.insert("items", {
      pageId: args.pageId,
      fields: args.fields,
      ownerId: userId,
    });
    return itemId;
  },
});

export const updateItem = mutation({
  args: {
    id: v.id("items"),
    fields: v.record(v.string(), v.union(
      v.string(),
      v.number(),
      v.array(v.string()),
      v.null()
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.id);
    if (!item || item.ownerId !== userId) {
      throw new Error("Item not found or access denied");
    }

    await ctx.db.patch(args.id, { fields: args.fields });
  },
});

export const deleteItem = mutation({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.id);
    if (!item || item.ownerId !== userId) {
      throw new Error("Item not found or access denied");
    }

    await ctx.db.delete(args.id);
  },
});
