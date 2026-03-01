import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { MarkdownSerializer } from "prosemirror-markdown";
import { marked } from "marked";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Undo, Redo, Link as LinkIcon, Image as ImageIcon, Loader2 } from "lucide-react";
import { useVault } from "../hooks/useVault";
import { PostMeta, parseFrontmatter, serializeFrontmatter, slugify } from "../utils/markdown";

// ─── HOME DIR CACHE ───────────────────────────────────────────────────────────
// Home dir is now passed from App.tsx via props for stability and reactivity.

// ─── CUSTOM IMAGE ─────────────────────────────────────────────────────────────
const createCustomImage = (vaultPath: string, homeDir: string) => Image.extend({
    renderHTML({ HTMLAttributes }) {
        let src = HTMLAttributes.src as string;
        if (src?.startsWith("../assets/") && homeDir && vaultPath) {
            const filename = src.split("/").pop()!;
            // Remove any potential double slashes
            const cleanHome = homeDir.endsWith('/') ? homeDir.slice(0, -1) : homeDir;
            const cleanVault = vaultPath.startsWith('/') ? vaultPath.slice(1) : vaultPath;
            src = convertFileSrc(`${cleanHome}/${cleanVault}/assets/${filename}`);
        }
        return ["img", { ...HTMLAttributes, src }];
    },
});

// ─── TIPTAP-COMPATIBLE MARKDOWN SERIALIZER ────────────────────────────────────
// The default prosemirror-markdown serializer expects mark names like "strong"
// and "em", but Tiptap uses "bold" and "italic". This custom serializer maps
// Tiptap's names correctly so serialization doesn't throw errors.
const tiptapSerializer = new MarkdownSerializer(
    {
        doc(state: any, node: any) { state.renderContent(node); },
        paragraph(state: any, node: any) {
            state.renderInline(node);
            state.closeBlock(node);
        },
        heading(state: any, node: any) {
            state.write("#".repeat(node.attrs.level) + " ");
            state.renderInline(node);
            state.closeBlock(node);
        },
        bulletList(state: any, node: any) {
            state.renderList(node, "  ", () => "- ");
        },
        orderedList(state: any, node: any) {
            const start = node.attrs.start || 1;
            state.renderList(node, "  ", (i: number) => `${start + i}. `);
        },
        listItem(state: any, node: any) {
            state.renderContent(node);
        },
        blockquote(state: any, node: any) {
            state.wrapBlock("> ", null, node, () => state.renderContent(node));
        },
        codeBlock(state: any, node: any) {
            const lang = node.attrs.language || "";
            state.write("```" + lang + "\n");
            state.text(node.textContent, false);
            state.ensureNewLine();
            state.write("```");
            state.closeBlock(node);
        },
        hardBreak() {
            // hardBreak is handled inline — nothing needed here
        },
        horizontalRule(state: any, node: any) {
            state.write("---");
            state.closeBlock(node);
        },
        image(state: any, node: any) {
            const alt = state.esc(node.attrs.alt || "");
            const src = state.esc(node.attrs.src || "");
            const title = node.attrs.title ? ` "${state.esc(node.attrs.title)}"` : "";
            state.write(`![${alt}](${src}${title})`);
        },
        text(state: any, node: any) {
            state.text(node.text || "");
        },
    },
    {
        // Mark names must match Tiptap's internal names exactly
        bold: { open: "**", close: "**", mixable: true, expelEnclosingWhitespace: true },
        italic: { open: "_", close: "_", mixable: true, expelEnclosingWhitespace: true },
        strike: { open: "~~", close: "~~", mixable: true, expelEnclosingWhitespace: true },
        code: { open: "`", close: "`", escape: false },
        link: {
            open: () => "[",
            close(_s: any, mark: any): string {
                const title = mark.attrs.title ? ` "${mark.attrs.title}"` : "";
                return `](${mark.attrs.href}${title})`;
            },
        },
    }
);

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface EditorProps {
    content: string;
    postPath: string;
    vaultPath: string;
    homeDir: string;
    onChange: (markdown: string, path: string) => void;
}

// ─── TOOLBAR ──────────────────────────────────────────────────────────────────
function Toolbar({ editor, onInsertImage }: { editor: ReturnType<typeof useEditor>; onInsertImage: () => void }) {
    // Force re-render on every transaction so active states stay in sync
    const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);
    const [showLinkInput, setShowLinkInput] = React.useState(false);
    const [linkUrl, setLinkUrl] = React.useState("");
    const linkInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!editor) return;
        editor.on("transaction", forceUpdate);
        return () => { editor.off("transaction", forceUpdate); };
    }, [editor]);

    // Auto-focus the link input when it appears
    useEffect(() => {
        if (showLinkInput && linkInputRef.current) {
            linkInputRef.current.focus();
        }
    }, [showLinkInput]);

    if (!editor) return null;

    const btn = (
        label: string,
        icon: React.ReactNode,
        isActive: boolean,
        action: () => void
    ) => (
        <button
            key={label}
            title={label}
            onMouseDown={(e) => {
                e.preventDefault();
                action();
            }}
            className={`p-1.5 rounded transition-colors ${isActive
                ? "bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
        >
            {icon}
        </button>
    );

    const Divider = () => <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />;

    const handleLinkSubmit = () => {
        if (linkUrl.trim()) {
            const href = /^https?:\/\//i.test(linkUrl.trim()) ? linkUrl.trim() : `https://${linkUrl.trim()}`;
            editor.chain().focus().setLink({ href }).run();
        }
        setLinkUrl("");
        setShowLinkInput(false);
    };

    const handleLinkClick = () => {
        if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
        } else {
            // Only allow link creation when text is selected
            const { from, to } = editor.state.selection;
            if (from === to) return; // no selection — do nothing
            setShowLinkInput(!showLinkInput);
            setLinkUrl("");
        }
    };

    return (
        <div className="relative z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="px-8 lg:px-12 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-0.5 flex-wrap py-2 -ml-1.5">
                    {btn("Bold (⌘B)", <Bold size={15} />, editor.isActive("bold"), () =>
                        editor.chain().focus().toggleBold().run()
                    )}
                    {btn("Italic (⌘I)", <Italic size={15} />, editor.isActive("italic"), () =>
                        editor.chain().focus().toggleItalic().run()
                    )}
                    {btn("Strikethrough", <Strikethrough size={15} />, editor.isActive("strike"), () =>
                        editor.chain().focus().toggleStrike().run()
                    )}

                    <Divider />

                    {btn("Heading 1", <Heading1 size={15} />, editor.isActive("heading", { level: 1 }), () =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                    )}
                    {btn("Heading 2", <Heading2 size={15} />, editor.isActive("heading", { level: 2 }), () =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    )}

                    <Divider />

                    {btn("Bullet List", <List size={15} />, editor.isActive("bulletList"), () =>
                        editor.chain().focus().toggleBulletList().run()
                    )}
                    {btn("Numbered List", <ListOrdered size={15} />, editor.isActive("orderedList"), () =>
                        editor.chain().focus().toggleOrderedList().run()
                    )}

                    <Divider />

                    {btn("Link", <LinkIcon size={15} />, editor.isActive("link") || showLinkInput, handleLinkClick)}
                    {btn("Insert Image", <ImageIcon size={15} />, false, onInsertImage)}

                    <Divider />

                    {btn("Undo", <Undo size={15} />, false, () => editor.chain().focus().undo().run())}
                    {btn("Redo", <Redo size={15} />, false, () => editor.chain().focus().redo().run())}
                </div>
            </div>

            {/* Inline link URL input */}
            {showLinkInput && (
                <div className="absolute left-0 right-0 top-full z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 px-8 py-2 lg:px-12 max-w-4xl mx-auto w-full">
                        <input
                            ref={linkInputRef}
                            type="url"
                            placeholder="Paste or type a URL…"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); handleLinkSubmit(); }
                                if (e.key === "Escape") { setShowLinkInput(false); setLinkUrl(""); editor.chain().focus().run(); }
                            }}
                            className="flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                        />
                        <button
                            onClick={handleLinkSubmit}
                            className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            Apply
                        </button>
                        <button
                            onClick={() => { setShowLinkInput(false); setLinkUrl(""); editor.chain().focus().run(); }}
                            className="px-2 py-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}



// ─── METADATA HEADER ──────────────────────────────────────────────────────────
function MetadataHeader({
    meta,
    onMetaChange,
}: {
    meta: PostMeta;
    onMetaChange: (updated: PostMeta) => void;
}) {
    const updateField = (field: keyof PostMeta, value: string) => {
        const updated = { ...meta, [field]: value };
        // Auto-generate slug from title if slug hasn't been manually edited
        if (field === "title") {
            updated.slug = slugify(value);
        }
        onMetaChange(updated);
    };

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4 px-8 py-4 lg:px-12 max-w-4xl mx-auto w-full">
                {/* Title */}
                <input
                    type="text"
                    value={meta.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Post title…"
                    className="flex-1 text-xl font-semibold bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />

                {/* Status toggle */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium transition-colors ${meta.status === "ready" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                        }`}>
                        {meta.status === "ready" ? "Ready to Publish" : "Draft"}
                    </span>
                    <button
                        onClick={() =>
                            onMetaChange({
                                ...meta,
                                status: meta.status === "draft" ? "ready" : "draft",
                            })
                        }
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${meta.status === "ready"
                            ? "bg-emerald-500"
                            : "bg-slate-300 dark:bg-slate-600"
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${meta.status === "ready" ? "translate-x-4" : "translate-x-0"
                                }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── MAIN EDITOR ──────────────────────────────────────────────────────────────
export const EditorWrapper = ({ content, postPath, vaultPath, homeDir, onChange }: EditorProps) => {
    const { saveAsset } = useVault(vaultPath);

    if (!homeDir) {
        return (
            <div className="flex items-center justify-center flex-1 text-slate-400 gap-2 h-full">
                <Loader2 size={18} className="animate-spin" />
                <span>Initializing editor…</span>
            </div>
        );
    }

    const onChangeRef = useRef(onChange);
    const postPathRef = useRef(postPath);
    onChangeRef.current = onChange;
    postPathRef.current = postPath;

    const parsed = useRef(parseFrontmatter(content || ""));
    const [meta, setMeta] = React.useState<PostMeta>(parsed.current.meta);
    const metaRef = useRef(meta);
    metaRef.current = meta;

    const latestContentRef = useRef<string | null>(null);
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const debouncedOnChange = (fullMarkdown: string) => {
        latestContentRef.current = fullMarkdown;
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        debounceTimeout.current = setTimeout(() => {
            onChangeRef.current(fullMarkdown, postPathRef.current);
            latestContentRef.current = null;
        }, 800);
    };

    useEffect(() => {
        return () => {
            if (debounceTimeout.current && latestContentRef.current) {
                clearTimeout(debounceTimeout.current);
                onChangeRef.current(latestContentRef.current, postPathRef.current);
            }
        };
    }, []);

    const initialHtml = useRef(marked.parse(parsed.current.body || "") as string);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({}),
            createCustomImage(vaultPath, homeDir),
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: "https",
            }),
        ],
        content: initialHtml.current,
        onUpdate({ editor }) {
            try {
                const md = tiptapSerializer.serialize(editor.state.doc);
                const full = serializeFrontmatter(metaRef.current) + md;
                debouncedOnChange(full);
            } catch (err) {
                console.error("Markdown serialization error:", err);
            }
        },
    });

    // Save when metadata changes
    const handleMetaChange = (updated: PostMeta) => {
        setMeta(updated);
        metaRef.current = updated;
        if (editor) {
            try {
                const md = tiptapSerializer.serialize(editor.state.doc);
                const full = serializeFrontmatter(updated) + md;
                debouncedOnChange(full);
            } catch (err) {
                console.error("Metadata save error:", err);
            }
        }
    };

    // ── Drag-and-drop / paste images ──────────────────────────────────────────
    useEffect(() => {
        let unlisten: (() => void) | undefined;

        const setup = async () => {
            const { getCurrentWindow } = await import("@tauri-apps/api/window");
            unlisten = await getCurrentWindow().onDragDropEvent(async (event: any) => {
                if (
                    event.payload.type === "drop" &&
                    event.payload.paths?.length > 0 &&
                    editor
                ) {
                    const src = event.payload.paths[0];
                    if (!src.match(/\.(png|jpe?g|gif|webp|svg)$/i)) return;
                    const rel = await saveAsset(src);
                    if (rel) editor.chain().focus().setImage({ src: rel }).run();
                }
            });
        };

        const handlePaste = async (e: ClipboardEvent) => {
            if (!editor) return;
            const files = Array.from(e.clipboardData?.files ?? []);
            const img = files.find((f) => f.type.startsWith("image/"));
            if (!img) return;
            e.preventDefault();
            const rel = await saveAsset(img);
            if (rel) editor.chain().focus().setImage({ src: rel }).run();
        };

        setup().catch(console.error);
        document.addEventListener("paste", handlePaste);

        return () => {
            unlisten?.();
            document.removeEventListener("paste", handlePaste);
        };
    }, [editor, saveAsset]);

    // ── Image picker ──────────────────────────────────────────────────────────
    const handleInsertImage = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: "Image", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"] }],
            });
            if (selected && typeof selected === "string" && editor) {
                const rel = await saveAsset(selected);
                if (rel) editor.chain().focus().setImage({ src: rel }).run();
            }
        } catch (err) {
            console.error("Image insert failed:", err);
        }
    };

    return (
        <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
            <MetadataHeader meta={meta} onMetaChange={handleMetaChange} />
            <Toolbar editor={editor} onInsertImage={handleInsertImage} />

            <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-slate-900">
                <div className="max-w-4xl mx-auto px-8 py-12 lg:px-12 lg:py-16 min-h-full">
                    <EditorContent editor={editor} className="writizen-editor" />
                </div>
            </div>
        </div>
    );
};

export default EditorWrapper;
