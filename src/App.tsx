import { useState, useEffect } from "react";
import { FileText, Plus, Sun, Moon, Send, Loader2 } from "lucide-react";
import clsx from "clsx";
import Editor from "./components/Editor";
import { useVault, Post } from "./hooks/useVault";
import "./App.css";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'drafts' | 'published'>('drafts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [editorContent, setEditorContent] = useState<string>("");

  const { isInitializing, initVault, getPosts, readPost, savePost, createPost } = useVault();

  // Initialize vault on startup
  useEffect(() => {
    initVault();
  }, [initVault]);

  // Load posts whenever tab changes or vault finishes initializing
  useEffect(() => {
    if (!isInitializing) {
      const loadPosts = async () => {
        const fetchedPosts = await getPosts(activeTab === 'drafts');
        setPosts(fetchedPosts);
      };
      loadPosts();
    }
  }, [activeTab, isInitializing, getPosts]);

  // Read content when active post changes
  useEffect(() => {
    if (activePost) {
      const loadContent = async () => {
        const content = await readPost(activePost.path);
        setEditorContent(content);
      };
      loadContent();
    } else {
      setEditorContent("");
    }
  }, [activePost, readPost]);

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

  const handleCreatePost = async () => {
    const newPost = await createPost();
    if (newPost) {
      setActiveTab('drafts'); // switch to drafts visually
      setPosts(prev => [...prev, newPost]);
      setActivePost(newPost);
    }
  };

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

          <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm shadow-indigo-600/20 disabled:opacity-50" disabled={!activePost}>
            <Send size={14} />
            Publish to Web
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-[var(--border-color)] bg-[var(--sidebar-bg)] flex flex-col pt-12 relative z-40 relative">
        <div className="p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Writer</p>
          <div className="space-y-1 mb-6">
            <button
              onClick={() => { setActiveTab('drafts'); setActivePost(null); }}
              className={clsx(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md shadow-sm border font-medium transition-colors",
                activeTab === 'drafts'
                  ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  : "bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
              )}
            >
              <FileText size={16} className={activeTab === 'drafts' ? "text-indigo-500" : "text-slate-400"} />
              Drafts
            </button>
            <button
              onClick={() => { setActiveTab('published'); setActivePost(null); }}
              className={clsx(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md shadow-sm border font-medium transition-colors",
                activeTab === 'published'
                  ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  : "bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
              )}
            >
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </span>
              Published
            </button>
          </div>

          <div className="pt-2 border-t border-[var(--border-color)]">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {activeTab === 'drafts' ? 'Local Drafts' : 'Live Posts'}
            </p>

            <div className="space-y-0.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1 pb-4">
              {isInitializing ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-2 px-2">
                  <Loader2 size={14} className="animate-spin" />
                  Loading vault...
                </div>
              ) : posts.length === 0 ? (
                <div className="text-sm text-slate-400 py-2 px-2 italic">
                  No {activeTab} found
                </div>
              ) : (
                posts.map(post => (
                  <button
                    key={post.path}
                    onClick={() => setActivePost(post)}
                    className={clsx(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors truncate",
                      activePost?.path === post.path
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    {post.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-[var(--border-color)]">
          <button
            onClick={handleCreatePost}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} />
            New Post
          </button>
        </div>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col bg-[var(--bg-color)] relative z-30 pt-10">
        <div className="flex-1 overflow-y-auto w-full">
          {activePost ? (
            <div className="max-w-3xl mx-auto pt-16 pb-32 px-8">
              <Editor
                content={editorContent}
                onChange={(markdown) => {
                  setEditorContent(markdown);
                  savePost(activePost.path, markdown);
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={24} className="text-slate-400" />
                </div>
                <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">No file selected</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                  Select a file from the sidebar to start writing, or create a new draft to begin.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <footer className="h-8 border-t border-[var(--border-color)] bg-[var(--bg-color)] flex items-center justify-between px-4 text-[11px] text-slate-400 z-40">
          <div className="flex items-center gap-2">
            <div className={clsx("w-1.5 h-1.5 rounded-full", activePost ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")}></div>
            {activePost ? `Editing: ${activePost.name}.md` : "All files saved locally."}
          </div>
          <div className="font-medium">
            {/* Word count to be implemented */}
            0 words
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
