import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

type SchemaField = {
  name: string;
  type: "text" | "number" | "date" | "select" | "multiselect" | "status";
  options?: Array<{
    label: string;
    color: string;
  }>;
};

type Item = {
  _id: Id<"items">;
  fields: Record<string, string | number | string[] | null>;
};

export function DatabaseView({ pageId }: { pageId: Id<"pages"> }) {
  const page = useQuery(api.pages.list)?.find((p) => p._id === pageId);
  const items = useQuery(api.database.getItems, { pageId }) || [];
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const addColumn = useMutation(api.database.addColumn);
  const deleteItem = useMutation(api.database.deleteItem);

  if (!page || page.type !== "database" || !page.schema) return null;

  const schema = page.schema as SchemaField[];

  const handleAddColumn = async (column: SchemaField) => {
    await addColumn({ pageId, column });
    setIsAddingColumn(false);
  };

  const handleDeleteItem = async (itemId: Id<"items">) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteItem({ id: itemId });
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setIsAddingColumn(true)}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
        >
          + Add Column
        </button>
      </div>

      {isAddingColumn && (
        <AddColumnForm onSubmit={handleAddColumn} onCancel={() => setIsAddingColumn(false)} />
      )}

      {editingItem ? (
        <ItemEditor
          item={editingItem}
          schema={schema}
          pageId={pageId}
          onClose={() => setEditingItem(null)}
        />
      ) : (
        <>
          <NewItemForm schema={schema} pageId={pageId} />
          <div className="border rounded overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {schema.map((field) => (
                    <th key={field.name} className="px-4 py-2 text-left border-b">
                      {field.name}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-left border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-b">
                    {schema.map((field) => (
                      <td key={field.name} className="px-4 py-2">
                        {renderField(item.fields[field.name], field)}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="text-blue-500 hover:text-blue-600 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function AddColumnForm({ onSubmit, onCancel }: { 
  onSubmit: (column: SchemaField) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SchemaField["type"]>("text");
  const [options, setOptions] = useState<Array<{ label: string; color: string }>>([]);
  const [newOption, setNewOption] = useState({ label: "", color: "#000000" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const column: SchemaField = {
      name,
      type,
      ...(["select", "multiselect", "status"].includes(type) && options.length > 0
        ? { options }
        : {}),
    };
    onSubmit(column);
  };

  const addOption = () => {
    if (newOption.label) {
      setOptions([...options, newOption]);
      setNewOption({ label: "", color: "#000000" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h3 className="text-lg font-medium mb-4">Add New Column</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Column Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2 py-1 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SchemaField["type"])}
            className="w-full px-2 py-1 border rounded"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="select">Select</option>
            <option value="multiselect">Multi-select</option>
            <option value="status">Status</option>
          </select>
        </div>
        {["select", "multiselect", "status"].includes(type) && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Options</label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span>{option.label}</span>
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: option.color }}
                  />
                  <button
                    type="button"
                    onClick={() => setOptions(options.filter((_, i) => i !== index))}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption.label}
                  onChange={(e) =>
                    setNewOption({ ...newOption, label: e.target.value })
                  }
                  placeholder="Option label"
                  className="flex-1 px-2 py-1 border rounded"
                />
                <input
                  type="color"
                  value={newOption.color}
                  onChange={(e) =>
                    setNewOption({ ...newOption, color: e.target.value })
                  }
                  className="w-10 h-8"
                />
                <button
                  type="button"
                  onClick={addOption}
                  className="px-2 py-1 bg-blue-500 text-white rounded"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Column
          </button>
        </div>
      </form>
    </div>
  );
}

function ItemEditor({ item, schema, pageId, onClose }: { 
  item: Item, 
  schema: SchemaField[], 
  pageId: Id<"pages">,
  onClose: () => void 
}) {
  const updateItem = useMutation(api.database.updateItem);
  const [fields, setFields] = useState(item.fields);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateItem({ id: item._id, fields });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h3 className="text-lg font-medium mb-4">Edit Item</h3>
        {schema.map((field) => (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium mb-1">{field.name}</label>
            {renderFieldInput(field, fields[field.name], (value) =>
              setFields((prev) => ({ ...prev, [field.name]: value }))
            )}
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function NewItemForm({ schema, pageId }: { schema: SchemaField[], pageId: Id<"pages"> }) {
  const createItem = useMutation(api.database.createItem);
  const [fields, setFields] = useState<Record<string, any>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createItem({ pageId, fields });
    setFields({});
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-4">New Item</h3>
      <div className="grid grid-cols-2 gap-4">
        {schema.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium mb-1">{field.name}</label>
            {renderFieldInput(field, fields[field.name], (value) =>
              setFields((prev) => ({ ...prev, [field.name]: value }))
            )}
          </div>
        ))}
      </div>
      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Item
      </button>
    </form>
  );
}

function renderFieldInput(
  field: SchemaField,
  value: any,
  onChange: (value: any) => void
) {
  switch (field.type) {
    case "text":
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 border rounded"
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-2 py-1 border rounded"
        />
      );
    case "date":
      return (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 border rounded"
        />
      );
    case "select":
    case "status":
      return (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 border rounded"
        >
          <option value="">Select...</option>
          {field.options?.map((option) => (
            <option key={option.label} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case "multiselect":
      return (
        <select
          multiple
          value={value || []}
          onChange={(e) =>
            onChange(
              Array.from(e.target.selectedOptions).map((option) => option.value)
            )
          }
          className="w-full px-2 py-1 border rounded"
        >
          {field.options?.map((option) => (
            <option key={option.label} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      );
    default:
      return null;
  }
}

function renderField(value: any, field: SchemaField) {
  if (value === null || value === undefined) return "-";

  switch (field.type) {
    case "text":
    case "number":
      return value;
    case "date":
      return new Date(value).toLocaleDateString();
    case "select":
    case "status":
      const option = field.options?.find((o) => o.label === value);
      return option ? (
        <span
          className="px-2 py-0.5 rounded text-sm"
          style={{ backgroundColor: option.color + "20", color: option.color }}
        >
          {option.label}
        </span>
      ) : value;
    case "multiselect":
      if (!Array.isArray(value)) return value;
      return (
        <div className="flex gap-1 flex-wrap">
          {value.map((v: string) => {
            const option = field.options?.find((o) => o.label === v);
            return option ? (
              <span
                key={v}
                className="px-2 py-0.5 rounded text-sm"
                style={{ backgroundColor: option.color + "20", color: option.color }}
              >
                {option.label}
              </span>
            ) : v;
          })}
        </div>
      );
    default:
      return value;
  }
}
