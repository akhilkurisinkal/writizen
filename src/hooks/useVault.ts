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

    // Save a physical file from the OS (drag and drop) into the vault's assets folder
    const saveAsset = useCallback(async (sourceFile: string | File): Promise<string | null> => {
        try {
            setVaultError(null);

            const { copyFile, writeFile } = await import('@tauri-apps/plugin-fs');

            let uniqueFilename = "";

            if (typeof sourceFile === "string") {
                // Handle dragged OS absolute path
                const filenameMatch = sourceFile.match(/[^/]+$/);
                if (!filenameMatch) throw new Error("Could not parse filename from dropped path");

                uniqueFilename = `${Date.now()}-${filenameMatch[0].replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                const targetVaultRelativePath = `${ASSETS_DIR}/${uniqueFilename}`;

                await copyFile(sourceFile, targetVaultRelativePath, { toPathBaseDir: BaseDirectory.Home });
            } else if (sourceFile instanceof File) {
                // Handle HTML clipboard File drop (e.g. Command+V)
                // Extract original filename or fallback to default
                const originalName = sourceFile.name || 'pasted-image.png';
                uniqueFilename = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

                const targetVaultRelativePath = `${ASSETS_DIR}/${uniqueFilename}`;

                const arrayBuffer = await sourceFile.arrayBuffer();
                const buffer = new Uint8Array(arrayBuffer);
                await writeFile(targetVaultRelativePath, buffer, { baseDir: BaseDirectory.Home });
            } else {
                return null;
            }

            // Return the relative markdown path to be inserted into the editor (e.g., ../assets/123-photo.png)
            return `../assets/${uniqueFilename}`;
        } catch (error) {
            console.error("Failed to copy asset into vault", error);
            setVaultError("Asset Save Error: " + String(error));
            return null;
        }
    }, [ASSETS_DIR]);

    return {
        isInitializing,
        vaultError,
        setVaultError,
        initVault,
        getPosts,
        readPost,
        savePost,
        createPost,
        saveAsset
    };
}
