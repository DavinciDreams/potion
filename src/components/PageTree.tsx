import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

export function PageTree({ parentId, onSelectPage }: { parentId?: Id<"pages">, onSelectPage: (id: Id<"pages">) => void }) {
  const pages = useQuery(api.pages.getChildren, { parentId }) || [];
  const createPage = useMutation(api.pages.create);
  const createDatabase = useMutation(api.database.createDatabase);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingDatabase, setIsCreatingDatabase] = useState(false);

  return (
    <div className="pl-4">
      {pages.map((page) => (
        <div key={page._id} className="py-1">
          <button
            onClick={() => onSelectPage(page._id)}
            className="text-left hover:bg-gray-100 px-2 py-1 rounded w-full"
          >
            {page.type === "database" ? "📊" : "📄"} {page.title || "Untitled"}
          </button>
          <PageTree parentId={page._id} onSelectPage={onSelectPage} />
        </div>
      ))}
      {isCreating ? (
        <input
          autoFocus
          type="text"
          className="w-full px-2 py-1 border rounded"
          placeholder="Page title"
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              const title = e.currentTarget.value.trim();
              if (title) {
                await createPage({ title, parentId });
              }
              setIsCreating(false);
            } else if (e.key === "Escape") {
              setIsCreating(false);
            }
          }}
          onBlur={() => setIsCreating(false)}
        />
      ) : isCreatingDatabase ? (
        <input
          autoFocus
          type="text"
          className="w-full px-2 py-1 border rounded"
          placeholder="Database title"
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              const title = e.currentTarget.value.trim();
              if (title) {
                await createDatabase({
                  title,
                  parentId,
                  schema: [
                    { name: "Name", type: "text" },
                    {
                      name: "Status",
                      type: "select",
                      options: [
                        { label: "Not Started", color: "#ff0000" },
                        { label: "In Progress", color: "#ffaa00" },
                        { label: "Done", color: "#00ff00" },
                      ],
                    },
                    { name: "Due Date", type: "date" },
                  ],
                });
              }
              setIsCreatingDatabase(false);
            } else if (e.key === "Escape") {
              setIsCreatingDatabase(false);
            }
          }}
          onBlur={() => setIsCreatingDatabase(false)}
        />
      ) : (
        <div>
          <button
            onClick={() => setIsCreating(true)}
            className="text-gray-500 hover:text-gray-700 px-2 py-1 text-sm w-full text-left"
          >
            + New Page
          </button>
          <button
            onClick={() => setIsCreatingDatabase(true)}
            className="text-gray-500 hover:text-gray-700 px-2 py-1 text-sm w-full text-left"
          >
            + New Database
          </button>
        </div>
      )}
    </div>
  );
}
