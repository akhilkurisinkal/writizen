import { useState, useCallback } from 'react';
import {
    exists,
    mkdir,
    readDir,
    readTextFile,
    writeTextFile,
    BaseDirectory
} from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

export interface Post {
    name: string;
    path: string;
    isDraft: boolean;
}

export function useVault() {
    const [isInitializing, setIsInitializing] = useState(true);

    // Core Vault Paths based on BaseDirectory.Home
    const VAULT_NAME = 'My_Blog_Vault';
    const DRAFTS_DIR = `${VAULT_NAME}/content/drafts`;
    const PUBLISHED_DIR = `${VAULT_NAME}/content/published`;
    const ASSETS_DIR = `${VAULT_NAME}/assets`;
    const SYSTEM_DIR = `${VAULT_NAME}/.system`;

    const initVault = useCallback(async () => {
        try {
            setIsInitializing(true);

            const vaultExists = await exists(VAULT_NAME, { baseDir: BaseDirectory.Home });
            if (!vaultExists) {
                console.log("Vault doesn't exist, creating directory structure...");

                // Create base vault
                await mkdir(VAULT_NAME, { baseDir: BaseDirectory.Home, recursive: true });

                // Create subdirectories
                await mkdir(DRAFTS_DIR, { baseDir: BaseDirectory.Home, recursive: true });
                await mkdir(PUBLISHED_DIR, { baseDir: BaseDirectory.Home, recursive: true });
                await mkdir(ASSETS_DIR, { baseDir: BaseDirectory.Home, recursive: true });
                await mkdir(SYSTEM_DIR, { baseDir: BaseDirectory.Home, recursive: true });

                // Create a welcome post as the first draft
                const welcomePath = await join(DRAFTS_DIR, 'Welcome.md');
                await writeTextFile(
                    welcomePath,
                    "# Welcome to your new local-first blog!\n\nThis markdown file lives safely on your machine.",
                    { baseDir: BaseDirectory.Home }
                );
            }
        } catch (error) {
            console.error("Failed to initialize vault", error);
            alert("Tauri FS Error (initVault): " + String(error));
        } finally {
            setIsInitializing(false);
        }
    }, [VAULT_NAME, DRAFTS_DIR, PUBLISHED_DIR, ASSETS_DIR, SYSTEM_DIR]);

    const getPosts = useCallback(async (isDraft: boolean): Promise<Post[]> => {
        try {
            const dirPath = isDraft ? DRAFTS_DIR : PUBLISHED_DIR;
            const entries = await readDir(dirPath, { baseDir: BaseDirectory.Home });

            return entries
                .filter(entry => entry.isFile && entry.name.endsWith('.md'))
                .map(entry => ({
                    name: entry.name.replace('.md', ''),
                    path: `${dirPath}/${entry.name}`,
                    isDraft
                }));
        } catch (error) {
            console.error(`Failed to read posts from ${isDraft ? 'drafts' : 'published'}`, error);
            return [];
        }
    }, [DRAFTS_DIR, PUBLISHED_DIR]);

    const readPost = useCallback(async (path: string): Promise<string> => {
        try {
            return await readTextFile(path, { baseDir: BaseDirectory.Home });
        } catch (error) {
            console.error(`Failed to read file at ${path}`, error);
            return "";
        }
    }, []);

    const savePost = useCallback(async (path: string, content: string): Promise<boolean> => {
        try {
            await writeTextFile(path, content, { baseDir: BaseDirectory.Home });
            return true;
        } catch (error) {
            console.error(`Failed to save file at ${path}`, error);
            return false;
        }
    }, []);

    const createPost = useCallback(async (): Promise<Post | null> => {
        try {
            const id = Date.now().toString();
            const filename = `Untitled-${id}.md`;
            const path = await join(DRAFTS_DIR, filename);

            await writeTextFile(path, "# Untitled\n", { baseDir: BaseDirectory.Home });

            return {
                name: `Untitled-${id}`,
                path: `${DRAFTS_DIR}/${filename}`,
                isDraft: true
            };
        } catch (error) {
            console.error("Failed to create new post", error);
            return null;
        }
    }, [DRAFTS_DIR]);

    return {
        isInitializing,
        initVault,
        getPosts,
        readPost,
        savePost,
        createPost
    };
}
