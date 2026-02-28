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
    const [vaultError, setVaultError] = useState<string | null>(null);

    // Core Vault Paths based on BaseDirectory.Home
    const VAULT_NAME = 'My_Blog_Vault';
    const DRAFTS_DIR = `${VAULT_NAME}/content/drafts`;
    const PUBLISHED_DIR = `${VAULT_NAME}/content/published`;
    const ASSETS_DIR = `${VAULT_NAME}/assets`;
    const SYSTEM_DIR = `${VAULT_NAME}/.system`;

    const initVault = useCallback(async () => {
        const ensureDir = async (dirPath: string) => {
            try {
                const dirExists = await exists(dirPath, { baseDir: BaseDirectory.Home });
                if (!dirExists) {
                    await mkdir(dirPath, { baseDir: BaseDirectory.Home, recursive: true });
                }
            } catch (e) {
                console.error(`Error ensuring directory ${dirPath}`, e);
                throw e; // Bubble up for the toast to catch
            }
        };

        try {
            setIsInitializing(true);
            setVaultError(null);

            await ensureDir(VAULT_NAME);
            await ensureDir(DRAFTS_DIR);
            await ensureDir(PUBLISHED_DIR);
            await ensureDir(ASSETS_DIR);
            await ensureDir(SYSTEM_DIR);

            // Create a welcome post if it doesn't exist
            const welcomePath = await join(DRAFTS_DIR, 'Welcome.md');
            const welcomeExists = await exists(welcomePath, { baseDir: BaseDirectory.Home });
            if (!welcomeExists) {
                await writeTextFile(
                    welcomePath,
                    "# Welcome to your new local-first blog!\n\nThis markdown file lives safely on your machine.",
                    { baseDir: BaseDirectory.Home }
                );
            }
        } catch (error) {
            console.error("Failed to initialize vault", error);
            setVaultError("Vault Init Error: " + String(error));
        } finally {
            setIsInitializing(false);
        }
    }, [VAULT_NAME, DRAFTS_DIR, PUBLISHED_DIR, ASSETS_DIR, SYSTEM_DIR]);

    const getPosts = useCallback(async (isDraft: boolean): Promise<Post[]> => {
        try {
            const dirPath = isDraft ? DRAFTS_DIR : PUBLISHED_DIR;
            const entries = await readDir(dirPath, { baseDir: BaseDirectory.Home });

            setVaultError(null);
            return entries
                .filter(entry => entry.isFile && entry.name.endsWith('.md'))
                .map(entry => ({
                    name: entry.name.replace('.md', ''),
                    path: `${dirPath}/${entry.name}`,
                    isDraft
                }));
        } catch (error) {
            console.error(`Failed to read posts from ${isDraft ? 'drafts' : 'published'}`, error);
            setVaultError(`Read Dir Error (${isDraft ? 'drafts' : 'published'}): ` + String(error));
            return [];
        }
    }, [DRAFTS_DIR, PUBLISHED_DIR]);

    const readPost = useCallback(async (path: string): Promise<string> => {
        try {
            setVaultError(null);
            return await readTextFile(path, { baseDir: BaseDirectory.Home });
        } catch (error) {
            console.error(`Failed to read file at ${path}`, error);
            setVaultError(`Read File Error (${path}): ` + String(error));
            return "";
        }
    }, []);

    const savePost = useCallback(async (path: string, content: string): Promise<boolean> => {
        try {
            await writeTextFile(path, content, { baseDir: BaseDirectory.Home });
            return true;
        } catch (error) {
            console.error(`Failed to save file at ${path}`, error);
            setVaultError(`Save File Error: ` + String(error));
            return false;
        }
    }, []);

    const createPost = useCallback(async (): Promise<Post | null> => {
        try {
            setVaultError(null);
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
            setVaultError("Create Post Error: " + String(error));
            return null;
        }
    }, [DRAFTS_DIR]);

    return {
        isInitializing,
        vaultError,
        setVaultError,
        initVault,
        getPosts,
        readPost,
        savePost,
        createPost
    };
}
