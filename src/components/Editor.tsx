import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCallback, useEffect, useState } from "react";
import { DatabaseView } from "./DatabaseView";

export function Editor({ pageId }: { pageId: Id<"pages"> }) {
  const page = useQuery(api.pages.list)?.find((p) => p._id === pageId);
  const updatePage = useMutation(api.pages.update);
  const [title, setTitle] = useState(page?.title || "");
  const [content, setContent] = useState(page?.content || "");

  useEffect(() => {
    setTitle(page?.title || "");
    setContent(page?.content || "");
  }, [page]);

  const debouncedUpdate = useCallback(
    async (updates: { title?: string; content?: string }) => {
      await updatePage({ id: pageId, ...updates });
    },
    [pageId, updatePage]
  );

  if (!page) return <div>Loading...</div>;

  if (page.type === "database") {
    return (
      <div className="p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            debouncedUpdate({ title: e.target.value });
          }}
          className="text-3xl font-bold w-full mb-4 px-2 py-1"
          placeholder="Untitled"
        />
        <DatabaseView pageId={pageId} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          debouncedUpdate({ title: e.target.value });
        }}
        className="text-3xl font-bold w-full mb-4 px-2 py-1"
        placeholder="Untitled"
      />
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          debouncedUpdate({ content: e.target.value });
        }}
        className="w-full h-[calc(100vh-200px)] p-2 border rounded"
        placeholder="Start writing..."
      />
    </div>
  );
}
