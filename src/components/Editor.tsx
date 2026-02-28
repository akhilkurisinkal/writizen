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

interface EditorProps {
    content: string;
    onChange: (markdown: string) => void;
}

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
            Image,
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
