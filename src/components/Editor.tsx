// @ts-ignore
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/lib/theme/common/style.css";
// We use the frame theme which closely matches our UI
import "@milkdown/crepe/lib/theme/frame/style.css";
import { useEffect, useRef } from "react";

interface EditorProps {
    content: string;
    onChange: (markdown: string) => void;
}

export const EditorWrapper = ({ content, onChange }: EditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const crepeRef = useRef<Crepe | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        // Initialize Crepe (Milkdown's official WYSIWYG editor)
        const crepe = new Crepe({
            root: editorRef.current,
            defaultValue: content || "# Welcome to your new local-first blog!",
            features: {
                // Enable the Notion-style slash menu and popup formatting toolbar
                [Crepe.Feature.BlockEdit]: true,
                [Crepe.Feature.Cursor]: true,
                [Crepe.Feature.ListItem]: true
            }
        });

        // Set up the change listener to auto-save to the OS file system
        crepe.on((listener) => {
            listener.markdownUpdated((_, markdown, prevMarkdown) => {
                if (markdown !== prevMarkdown) {
                    onChange(markdown);
                }
            });
        });

        crepe.create().then(() => {
            crepeRef.current = crepe;
        });

        // Cleanup on unmount (e.g., when switching active files)
        return () => {
            if (crepeRef.current) {
                crepeRef.current.destroy();
                crepeRef.current = null;
            }
        };
    }, []); // Empty array! Never re-mount on keystrokes.

    return (
        <div className="crepe-container h-full w-full allow-select prose prose-indigo max-w-none">
            <div ref={editorRef} className="h-full w-full" />
        </div>
    );
};

export default EditorWrapper;
