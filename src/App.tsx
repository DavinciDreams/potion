import { Authenticated, Unauthenticated } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { PageTree } from "./components/PageTree";
import { Editor } from "./components/Editor";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  const [selectedPageId, setSelectedPageId] = useState<Id<"pages"> | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold accent-text">Notion Clone</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex">
        <Authenticated>
          <div className="w-64 border-r p-4 flex flex-col h-[calc(100vh-73px)]">
            <PageTree onSelectPage={setSelectedPageId} />
          </div>
          <div className="flex-1">
            {selectedPageId ? (
              <Editor pageId={selectedPageId} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a page or create a new one
              </div>
            )}
          </div>
        </Authenticated>
        <Unauthenticated>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-5xl font-bold accent-text mb-4">
                  Notion Clone
                </h1>
                <p className="text-xl text-slate-600">Sign in to get started</p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>
      </main>
      <Toaster />
    </div>
  );
}
