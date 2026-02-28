import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Quote } from "lucide-react";
import { marked } from "marked";

// Very basic Markdown Serializer for Tiptap (since we save as .md)
// In a production app, we would use a robust ast parser, but for now we rely on Tiptap's HTML -> Markdown parsing or a separate library.
// For phase 3, we simply emit HTML. (We can refine markdown export later)
import { defaultMarkdownSerializer } from "prosemirror-markdown";
import { convertFileSrc } from "@tauri-apps/api/core";

// Dynamically cache the home directory at launch for sync use inside Tiptap's AST renderer
let cachedHomeDir = "";
import('@tauri-apps/api/path').then(m => m.homeDir().then(dir => cachedHomeDir = dir));

// Custom Image Extension to render relative `.md` paths as native Tauri Asset URIs
const CustomImage = Image.extend({
    renderHTML({ HTMLAttributes }) {
        let src = HTMLAttributes.src;
        // If image is relative and home dir is loaded, convert to physical asset:// URL for webview security
        if (src && src.startsWith('../assets/') && cachedHomeDir) {
            const filename = src.split('/').pop();
            const absPath = `${cachedHomeDir}/My_Blog_Vault/assets/${filename}`;
            src = convertFileSrc(absPath);
        }
        return ['img', { ...HTMLAttributes, src }];
    }
});

interface EditorProps {
    content: string;
    onChange: (markdown: string) => void;
}

// Import useVault to access the physical file saving logic
import { useVault } from "../hooks/useVault";

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    const toggleCommand = (command: () => void) => {
        command();
        editor.view.focus();
    };

    return (
        <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-10 mx-auto w-full transition-colors">
            <button
                onClick={() => toggleCommand(() => editor.chain().focus().toggleBold().run())}
                className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                onClick={() => toggleCommand(() => editor.chain().focus().toggleItalic().run())}
                className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <button
                onClick={() => toggleCommand(() => editor.chain().focus().toggleStrike().run())}
                className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('strike') ? 'bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}
                title="Strikethrough"
            >
                <Strikethrough size={16} />
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-2" />
            <button
                onClick={() => toggleCommand(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
                className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}
                title="Heading 1"
            >
                <Heading1 size={16} />
            </button>
            <button
                onClick={() => toggleCommand(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
                className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}
                title="Heading 2"
            >
                <Heading2 size={16} />
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-2" />
            <button
                onClick={() => toggleCommand(() => editor.chain().focus().toggleBulletList().run())}
                className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}
                title="Bullet List"
            >
                <List size={16} />
            </button>
            <button
                onClick={() => toggleCommand(() => editor.chain().focus().toggleOrderedList().run())}
                className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}
                title="Ordered List"
            >
                <ListOrdered size={16} />
            </button>
            <button
                onClick={() => toggleCommand(() => editor.chain().focus().toggleBlockquote().run())}
                className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('blockquote') ? 'bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}
                title="Blockquote"
            >
                <Quote size={16} />
            </button>
        </div>
    );
};

export const EditorWrapper = ({ content, onChange }: EditorProps) => {
    // Parse the raw markdown from disk into HTML for initial Tiptap hydration
    const htmlContent = marked.parse(content || "");

    const editor = useEditor({
        extensions: [
            StarterKit,
            CustomImage,
        ],
        content: htmlContent,
        editorProps: {
            attributes: {
                // Tailwind Typography styling applied directly to the Prosemirror canvas instance
                class: 'prose prose-slate dark:prose-invert prose-indigo max-w-none focus:outline-none min-h-[500px] h-full',
            },
        },
        onUpdate: ({ editor }) => {
            // Re-serialize the editor document back into markdown format so the user's hard drive stays plain text
            const markdownOutput = defaultMarkdownSerializer.serialize(editor.state.doc);
            onChange(markdownOutput);
        },
    });

    const { saveAsset } = useVault();

    // Handle Tauri Native OS Drag and Drop
    useEffect(() => {
        let unlisten: (() => void) | undefined;

        const setupDragDrop = async () => {
            const { getCurrentWindow } = await import('@tauri-apps/api/window');

            // Listen for native OS drops anywhere on the window in Tauri v2
            unlisten = await getCurrentWindow().onDragDropEvent(async (event: any) => {
                if (event.payload.type === 'drop' && event.payload.paths && event.payload.paths.length > 0 && editor) {
                    // Grab the first dropped file's absolute OS path
                    const sourcePath = event.payload.paths[0];

                    // Verify it's an image
                    if (!sourcePath.match(/\.(png|jpe?g|gif|webp|svg)$/i)) {
                        console.warn("Dropped file is not a supported image format:", sourcePath);
                        return;
                    }

                    // Physically copy the file from the Desktop/OS into the local My_Blog_Vault/assets
                    const newRelativePath = await saveAsset(sourcePath);

                    if (newRelativePath) {
                        // Insert the image into the Tiptap canvas which will serialize to markdown ![alt](../assets/img.png)
                        editor.chain().focus().setImage({ src: newRelativePath }).run();
                    }
                }
            });
        };

        setupDragDrop();

        return () => {
            if (unlisten) unlisten();
        };
    }, [editor, saveAsset]);

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            if (editor) {
                editor.destroy();
            }
        };
    }, []);

    return (
        <div className="w-full h-full flex flex-col bg-slate-100 dark:bg-slate-900 border-x border-[var(--border-color)]">
            {/* 1. Fixed Action Toolbar (Word/Docs style) pinned completely outside the paper canvas */}
            <MenuBar editor={editor} />

            {/* 2. Scrollable Canvas Area */}
            <div className="flex-1 overflow-y-auto px-12 py-16 flex justify-center">

                {/* 3. A4 Paper Element Wrapper */}
                <div className="bg-white dark:bg-slate-950 w-full max-w-3xl min-h-[1000px] shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 rounded-sm p-12 transition-colors">
                    <EditorContent editor={editor} className="h-full" />
                </div>

            </div>
        </div>
    );
};

export default EditorWrapper;
