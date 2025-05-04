import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  pages: defineTable({
    title: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("pages")),
    ownerId: v.id("users"),
    type: v.optional(v.union(v.literal("document"), v.literal("database"))),
    schema: v.optional(v.array(v.object({
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
    }))),
  })
    .index("by_parent", ["parentId"])
    .index("by_owner", ["ownerId"]),

  items: defineTable({
    pageId: v.id("pages"),
    fields: v.record(v.string(), v.union(
      v.string(),
      v.number(),
      v.array(v.string()),
      v.null()
    )),
    ownerId: v.id("users"),
  })
    .index("by_page", ["pageId"])
    .index("by_owner", ["ownerId"])
    .index("by_page_and_owner", ["pageId", "ownerId"]),

  views: defineTable({
    pageId: v.id("pages"),
    name: v.string(),
    type: v.union(
      v.literal("table"),
      v.literal("list"),
      v.literal("gallery"),
      v.literal("calendar"),
      v.literal("kanban")
    ),
    config: v.object({
      sortBy: v.optional(v.string()),
      sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
      groupBy: v.optional(v.string()),
      calendarField: v.optional(v.string()),
      kanbanField: v.optional(v.string()),
    }),
    ownerId: v.id("users"),
  })
    .index("by_page", ["pageId"])
    .index("by_owner", ["ownerId"])
    .index("by_page_and_owner", ["pageId", "ownerId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
