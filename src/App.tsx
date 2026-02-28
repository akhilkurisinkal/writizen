import { useState, useEffect } from "react";
import { FileText, Plus, Sun, Moon, Send } from "lucide-react";
import Editor from "./components/Editor";
import "./App.css";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Synchronize dark mode with Tailwind dark class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Disable default browser context menus completely except where explicitly allowed
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[var(--bg-color)] text-[var(--text-color)] antialiased selection:bg-indigo-500/30 overflow-hidden">
      {/* 
        Custom Titlebar / Drag Region
        We place this absolute on top so the user can drag the frameless window 
      */}
      <div
        data-tauri-drag-region
        className="absolute top-0 left-0 right-0 h-10 z-50 flex items-center justify-between px-4 no-drag"
      >
        <div data-tauri-drag-region className="w-full h-full absolute inset-0 z-0"></div>
        <div className="z-10 flex items-center gap-2 pointer-events-auto">
          {/* Mac traffic lights typically overlay here automatically if translucent/hidden */}
          <div className="w-16"></div>
        </div>
        <div className="z-10 flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm shadow-indigo-600/20">
            <Send size={14} />
            Publish to Web
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-[var(--border-color)] bg-[var(--sidebar-bg)] flex flex-col pt-12 relative z-40 relative">
        <div className="p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Writer</p>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 font-medium">
              <FileText size={16} className="text-indigo-500" />
              Drafts
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors">
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </span>
              Published
            </button>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-[var(--border-color)]">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Plus size={16} />
            New Post
          </button>
        </div>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col bg-[var(--bg-color)] relative z-30 pt-10">
        <div className="flex-1 overflow-y-auto w-full">
          {/* Milkdown Editor Mounted Here */}
          <div className="max-w-3xl mx-auto pt-16 pb-32 px-8">
            <Editor />
          </div>
        </div>

        {/* Bottom Status Bar */}
        <footer className="h-8 border-t border-[var(--border-color)] bg-[var(--bg-color)] flex items-center justify-between px-4 text-[11px] text-slate-400 z-40">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
            All files saved locally.
          </div>
          <div className="font-medium">
            0 words
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
