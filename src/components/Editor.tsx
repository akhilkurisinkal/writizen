import { Editor, rootCtx, defaultValueCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { useEditor, Milkdown, MilkdownProvider } from "@milkdown/react";
import { nord } from "@milkdown/theme-nord";

interface EditorProps {
    content: string;
    onChange: (markdown: string) => void;
}

const MilkdownEditor = ({ content, onChange }: EditorProps) => {
    useEditor((root: any) => {
        return Editor.make()
            .config((ctx: any) => {
                ctx.set(rootCtx, root);
                ctx.set(defaultValueCtx, content || "# Welcome to your new local-first blog!");

                ctx.get(listenerCtx).markdownUpdated((_: any, markdown: string, prevMarkdown: string | null) => {
                    if (markdown !== prevMarkdown) {
                        onChange(markdown);
                    }
                });
            })
            .config(nord)
            .use(commonmark)
            .use(gfm)
            .use(listener);
    }, [content]); // Re-initialize if the underlying file content changes completely (e.g., clicking a new file)

    return <Milkdown />;
};

export const EditorWrapper = (props: EditorProps) => {
    return (
        <div className="milkdown-container h-full w-full allow-select prose prose-indigo max-w-none">
            <MilkdownProvider>
                <MilkdownEditor {...props} />
            </MilkdownProvider>
        </div>
    );
};

export default EditorWrapper;
