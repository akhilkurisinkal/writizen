import { useState, useEffect } from "react";
import { FileText, FolderClosed, FolderOpen, Plus, Sun, Moon, Send, Loader2, ChevronRight, FolderPlus, LogOut, Settings } from "lucide-react";
import clsx from "clsx";
import { open } from "@tauri-apps/plugin-dialog";
import { homeDir } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import Editor from "./components/Editor";
import PublishSettingsDialog from "./components/PublishSettingsDialog";
import { useVault, Post, VaultNode } from "./hooks/useVault";
import { buildStaticSite } from "./utils/buildSite";
import "./App.css";

// ─── Storage helpers ──────────────────────────────────────────────────────────
const VAULT_PATH_KEY = "writizen_vault_path";

function getSavedVaultPath(): string | null {
  return localStorage.getItem(VAULT_PATH_KEY);
}

function saveVaultPath(path: string) {
  localStorage.setItem(VAULT_PATH_KEY, path);
}

// ─── Folder Tree Node ─────────────────────────────────────────────────────────
function TreeNode({
  node,
  depth,
  activePost,
  onSelectPost,
  expandedPaths,
  onToggleExpand,
}: {
  node: VaultNode;
  depth: number;
  activePost: Post | null;
  onSelectPost: (post: Post) => void;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
}) {
  if (node.isDir) {
    const isExpanded = expandedPaths.has(node.path);
    const isRoot = depth === 0;

    return (
      <div>
        <button
          onClick={() => onToggleExpand(node.path)}
          className="w-full flex items-center gap-1.5 py-1 text-sm rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ paddingLeft: `${depth * 14 + 6} px`, paddingRight: '6px' }}
        >
          <ChevronRight
            size={12}
            className={clsx(
              "shrink-0 transition-transform duration-150 text-slate-400",
              isExpanded && "rotate-90"
            )}
          />
          {isExpanded ? (
            <FolderOpen size={14} className="shrink-0 text-amber-500" />
          ) : (
            <FolderClosed size={14} className="shrink-0 text-amber-500/70" />
          )}
          <span className={clsx("truncate", isRoot ? "font-semibold" : "font-normal")}>
            {node.name}
          </span>
        </button>
        {isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map(child => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                activePost={activePost}
                onSelectPost={onSelectPost}
                expandedPaths={expandedPaths}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  const isActive = activePost?.path === node.path;
  const isMd = node.name.endsWith('.md');

  return (
    <button
      onClick={() => {
        if (isMd) {
          onSelectPost({
            name: node.name.replace('.md', ''),
            path: node.path,
          });
        }
      }}
      className={clsx(
        "w-full flex items-center gap-1.5 py-1 text-sm rounded-md transition-colors truncate",
        isActive
          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium"
          : isMd
            ? "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            : "text-slate-400 dark:text-slate-500 cursor-default"
      )}
      style={{ paddingLeft: `${depth * 14 + 6 + 14} px`, paddingRight: '6px' }}
      disabled={!isMd}
    >
      <FileText size={13} className={clsx("shrink-0", isActive ? "text-indigo-500" : "text-slate-400")} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

// ─── Vault Setup Screen ──────────────────────────────────────────────────────
function VaultSetup({ onVaultSelected }: { onVaultSelected: (path: string) => void }) {
  const [isCreating, setIsCreating] = useState(false);
  const [vaultName, setVaultName] = useState("My_Blog_Vault");

  const handleSelectFolder = async () => {
    if (!vaultName.trim()) return;

    try {
      const home = await homeDir();
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: home,
        title: "Choose where to create your blog vault",
      });

      if (selected && typeof selected === "string") {
        // Convert absolute path to relative from $HOME
        const homePath = home.endsWith('/') ? home.slice(0, -1) : home;
        const relativeParentPath = selected.startsWith(homePath)
          ? selected.slice(homePath.length + 1)
          : selected;

        // Create the vault as a subfolder inside the selected directory
        const safeVaultName = vaultName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
        const finalPath = relativeParentPath ? `${relativeParentPath}/${safeVaultName}` : safeVaultName;

        setIsCreating(true);
        onVaultSelected(finalPath);
      }
    } catch (err) {
      console.error("Folder selection failed:", err);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center max-w-md px-8 w-full">
        {/* Logo */}
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-600/20">
          <FileText size={36} className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Welcome to Writizen
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Choose where to store your blog. A new folder will be created at the location you select.
        </p>

        <div className="mb-6 text-left">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Vault Name
          </label>
          <input
            type="text"
            value={vaultName}
            onChange={(e) => setVaultName(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
            placeholder="My_Blog_Vault"
          />
        </div>

        <button
          onClick={handleSelectFolder}
          disabled={isCreating || !vaultName.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-60"
        >
          {isCreating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating Vault…
            </>
          ) : (
            <>
              <FolderPlus size={18} />
              Choose Location & Create
            </>
          )}
        </button>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
          Everything stays safely on your machine.
        </p>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [vaultPath, setVaultPath] = useState<string | null>(getSavedVaultPath());
  const [vaultTree, setVaultTree] = useState<VaultNode | null>(null);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [editorContent, setEditorContent] = useState<string>("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublishSettingsOpen, setIsPublishSettingsOpen] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const { isInitializing, vaultError, setVaultError, initVault, getVaultTree, readPost, savePost, createPost, renamePost } = useVault(vaultPath);
  useEffect(() => {
    if (vaultPath) {
      initVault();
    }
  }, [vaultPath, initVault]);

  // Load vault tree after init
  useEffect(() => {
    if (!isInitializing && vaultPath) {
      const loadTree = async () => {
        const tree = await getVaultTree();
        setVaultTree(tree);
        if (tree) {
          // Auto-expand root and posts folder only
          setExpandedPaths(prev => {
            const next = new Set(prev);
            next.add(tree.path);
            const postsChild = tree.children.find(c => c.isDir && c.name === 'posts');
            if (postsChild) next.add(postsChild.path);
            return next;
          });
        }
      };
      loadTree();
    }
  }, [isInitializing, vaultPath, getVaultTree]);

  // Read content when active post changes
  useEffect(() => {
    if (activePost) {
      setIsLoadingFile(true);
      const loadContent = async () => {
        const content = await readPost(activePost.path);
        setEditorContent(content);
        setIsLoadingFile(false);
      };
      loadContent();
    } else {
      setEditorContent("");
      setIsLoadingFile(false);
    }
  }, [activePost, readPost]);

  // Dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Disable context menus
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  const refreshTree = async () => {
    const tree = await getVaultTree();
    setVaultTree(tree);
  };

  const handleCreatePost = async () => {
    const newPost = await createPost();
    if (newPost) {
      await refreshTree();
      setActivePost(newPost);
    }
  };

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleVaultSelected = (path: string) => {
    saveVaultPath(path);
    setVaultPath(path);
  };

  const handleCloseVault = () => {
    localStorage.removeItem(VAULT_PATH_KEY);
    setVaultPath(null);
    setVaultTree(null);
    setActivePost(null);
    setEditorContent("");
    setExpandedPaths(new Set());
  };

  const handlePublish = async () => {
    try {
      if (!vaultPath) return;
      const store = await load('settings.json');
      const repoUrl = await store.get<string>('github_repo_url');
      const pat = await store.get<string>('github_pat');
      const authorName = await store.get<string>('github_author_name');
      const authorEmail = await store.get<string>('github_author_email');
      const customDomain = await store.get<string>('github_custom_domain') || '';

      if (!repoUrl || !pat) {
        setIsPublishSettingsOpen(true);
        return;
      }

      setIsPublishing(true);

      // 1. Resolve absolute path of the local vault
      const home = await homeDir();
      const absoluteVaultPath = vaultPath.startsWith('/')
        ? vaultPath
        : `${home.replace(/\/$/, '')}/${vaultPath}`;

      // 2. Build the HTML Static Site using the absolute path
      await buildStaticSite(absoluteVaultPath, customDomain);

      // 3. Resolve absolute path of the 'out' directory
      const absoluteOutPath = `${absoluteVaultPath}/out`;

      // 4. Push *only* the 'out' directory to GitHub
      await invoke('git_commit_and_push', {
        path: absoluteOutPath,
        repoUrl,
        pat,
        authorName,
        authorEmail
      });

      refreshTree();
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setVaultError("Publish Error: " + String(err));
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Show setup screen if no vault is configured ────────────────────────────
  if (!vaultPath) {
    return <VaultSetup onVaultSelected={handleVaultSelected} />;
  }

  return (
    <div className="flex h-screen w-full bg-[var(--bg-color)] text-[var(--text-color)] antialiased selection:bg-indigo-500/30 overflow-hidden">
      {/* In-App Error / Success Toasts */}
      {vaultError && (
        <div className="absolute bottom-4 right-4 bg-red-50 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-md shadow-xl z-50 max-w-sm pointer-events-auto">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-sm">System Error</span>
            <button onClick={() => setVaultError(null)} className="text-red-400 hover:text-red-700 dark:hover:text-red-100 font-bold ml-4 border-none bg-transparent cursor-pointer">✕</button>
          </div>
          <p className="text-xs break-words font-mono opacity-90">{vaultError}</p>
        </div>
      )}

      {publishSuccess && (
        <div className="absolute bottom-4 right-4 bg-emerald-50 dark:bg-emerald-900 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-200 p-4 rounded-md shadow-xl z-50 max-w-sm pointer-events-auto animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Published Successfully</span>
            <span className="text-emerald-500">✓</span>
          </div>
          <p className="text-xs mt-1 opacity-90">Your changes are now live on GitHub.</p>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-[var(--border-color)] bg-[var(--sidebar-bg)] flex flex-col relative z-40">
        {/* Vault label */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vault</p>
        </div>

        {/* File tree */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {isInitializing ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-2 px-2">
              <Loader2 size={14} className="animate-spin" />
              Loading vault...
            </div>
          ) : vaultTree ? (
            <TreeNode
              node={vaultTree}
              depth={0}
              activePost={activePost}
              onSelectPost={setActivePost}
              expandedPaths={expandedPaths}
              onToggleExpand={toggleExpand}
            />
          ) : null}
        </div>

        {/* Bottom: New Post + Close Vault */}
        <div className="p-3 border-t border-[var(--border-color)] space-y-2">
          <button
            onClick={handleCreatePost}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} />
            New Post
          </button>
          <button
            onClick={handleCloseVault}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={13} />
            Close Vault
          </button>
        </div>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col bg-[var(--bg-color)] relative z-30 min-w-0 overflow-hidden">

        {/* App Toolbar */}
        <header className="h-14 flex items-center justify-end px-6 border-b border-[var(--border-color)] relative z-10 w-full bg-[var(--bg-color)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={() => setIsPublishSettingsOpen(true)}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
              title="Publish Settings"
            >
              <Settings size={16} />
            </button>

            <button
              onClick={handlePublish}
              disabled={!activePost || isPublishing}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {isPublishing ? "Publishing..." : "Publish to Web"}
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col relative z-20">
          {activePost ? (
            <div className="w-full h-full flex flex-col min-h-0 relative">
              {isLoadingFile ? (
                <div className="flex items-center justify-center flex-1 text-slate-400 gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Loading document...</span>
                </div>
              ) : (
                <Editor
                  key={activePost.path}
                  content={editorContent}
                  postPath={activePost.path}
                  onChange={(markdown) => {
                    savePost(activePost.path, markdown);
                  }}
                  onRename={async (newTitle) => {
                    const renamed = await renamePost(activePost.path, newTitle);
                    if (renamed) {
                      setActivePost(renamed);
                      await refreshTree();
                    }
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={24} className="text-slate-400" />
                </div>
                <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">No file selected</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                  Select a file from the sidebar to start writing, or create a new post to begin.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <footer className="h-8 border-t border-[var(--border-color)] bg-[var(--bg-color)] flex items-center justify-between px-4 text-[11px] text-slate-400 z-40">
          <div className="flex items-center gap-2">
            <div className={clsx("w-1.5 h-1.5 rounded-full", activePost ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")}></div>
            {activePost ? (
              <span>Editing: {activePost.name}.md <span className="opacity-60 ml-1">— All changes save automatically</span></span>
            ) : "All files saved locally."}
          </div>
          <div className="font-medium">
            0 words
          </div>
        </footer>
      </main>

      <PublishSettingsDialog
        isOpen={isPublishSettingsOpen}
        onClose={() => setIsPublishSettingsOpen(false)}
        onSave={() => {
          setIsPublishSettingsOpen(false);
          handlePublish();
        }}
      />
    </div>
  );
}

export default App;
