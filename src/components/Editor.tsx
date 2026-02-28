import { Editor, rootCtx, defaultValueCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { useEditor, Milkdown, MilkdownProvider } from "@milkdown/react";
import { nord } from "@milkdown/theme-nord";

// A wrapper component that consumes the Milkdown context
const MilkdownEditor = () => {
    useEditor((root: any) => {
        return Editor.make()
            .config((ctx: any) => {
                ctx.set(rootCtx, root);
                ctx.set(defaultValueCtx, "# Welcome to your new blog\n\nStart typing and watch the Markdown syntax disappear seamlessly...");
            })
            .config(nord)
            .use(commonmark)
            .use(gfm);
    });

    return <Milkdown />;
};

// The exported Editor component wraps the provider
export const EditorWrapper = () => {
    return (
        <div className="milkdown-container h-full w-full allow-select">
            <MilkdownProvider>
                <MilkdownEditor />
            </MilkdownProvider>
        </div>
    );
};

export default EditorWrapper;
