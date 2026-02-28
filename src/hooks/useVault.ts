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
}

export interface VaultNode {
    name: string;
    path: string;
    isDir: boolean;
    children: VaultNode[];
}

export function useVault(vaultPath: string | null) {
    const [isInitializing, setIsInitializing] = useState(true);
    const [vaultError, setVaultError] = useState<string | null>(null);

    // Derived paths — only valid when vaultPath is set
    const POSTS_DIR = vaultPath ? `${vaultPath}/posts` : '';
    const ASSETS_DIR = vaultPath ? `${vaultPath}/assets` : '';
    const SYSTEM_DIR = vaultPath ? `${vaultPath}/.system` : '';

    const initVault = useCallback(async () => {
        if (!vaultPath) {
            setIsInitializing(false);
            return;
        }

        const ensureDir = async (dirPath: string) => {
            try {
                const dirExists = await exists(dirPath, { baseDir: BaseDirectory.Home });
                if (!dirExists) {
                    await mkdir(dirPath, { baseDir: BaseDirectory.Home, recursive: true });
                }
            } catch (e) {
                console.error(`Error ensuring directory ${dirPath}`, e);
                throw e;
            }
        };

        try {
            setIsInitializing(true);
            setVaultError(null);

            await ensureDir(vaultPath);
            await ensureDir(POSTS_DIR);
            await ensureDir(ASSETS_DIR);
            await ensureDir(SYSTEM_DIR);

            // Create a welcome post if posts folder is empty
            const welcomePath = await join(POSTS_DIR, 'Welcome.md');
            const welcomeExists = await exists(welcomePath, { baseDir: BaseDirectory.Home });
            if (!welcomeExists) {
                const today = new Date().toISOString().split("T")[0];
                await writeTextFile(
                    welcomePath,
                    `---\ntitle: "Welcome"\ndate: "${today}"\nslug: "welcome"\nstatus: "draft"\n---\n\nWelcome to your new local-first blog!\n\nThis markdown file lives safely on your machine.`,
                    { baseDir: BaseDirectory.Home }
                );
            }
        } catch (error) {
            console.error("Failed to initialize vault", error);
            setVaultError("Vault Init Error: " + String(error));
        } finally {
            setIsInitializing(false);
        }
    }, [vaultPath, POSTS_DIR, ASSETS_DIR, SYSTEM_DIR]);

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

    const savePost = useCallback(async (path: string, content: string) => {
        try {
            setVaultError(null);
            await writeTextFile(path, content, { baseDir: BaseDirectory.Home });
        } catch (error) {
            console.error("Failed to save post", error);
            setVaultError("Save Error: " + String(error));
        }
    }, []);

    const createPost = useCallback(async (): Promise<Post | null> => {
        if (!POSTS_DIR) return null;
        try {
            setVaultError(null);

            const id = Date.now().toString();
            const baseName = `Untitled-${id}`;
            const filename = `${baseName}.md`;
            const title = "Untitled";
            const slug = `untitled-${id}`;

            const path = await join(POSTS_DIR, filename);
            const today = new Date().toISOString().split("T")[0];

            const frontmatter = `---\ntitle: "${title}"\ndate: "${today}"\nslug: "${slug}"\nstatus: "draft"\n---\n`;
            await writeTextFile(path, frontmatter, { baseDir: BaseDirectory.Home });

            return {
                name: baseName,
                path: `${POSTS_DIR}/${filename}`,
            };
        } catch (error) {
            console.error("Failed to create new post", error);
            setVaultError("Create Post Error: " + String(error));
            return null;
        }
    }, [POSTS_DIR]);

    const saveAsset = useCallback(async (sourceFile: string | File): Promise<string | null> => {
        if (!ASSETS_DIR) return null;
        try {
            setVaultError(null);
            const { copyFile, writeFile } = await import('@tauri-apps/plugin-fs');
            let uniqueFilename = "";

            if (typeof sourceFile === "string") {
                const filenameMatch = sourceFile.match(/[^/]+$/);
                if (!filenameMatch) throw new Error("Could not parse filename from dropped path");

                uniqueFilename = `${Date.now()}-${filenameMatch[0].replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                const targetVaultRelativePath = `${ASSETS_DIR}/${uniqueFilename}`;
                await copyFile(sourceFile, targetVaultRelativePath, { toPathBaseDir: BaseDirectory.Home });
            } else if (sourceFile instanceof File) {
                const originalName = sourceFile.name || 'pasted-image.png';
                uniqueFilename = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                const targetVaultRelativePath = `${ASSETS_DIR}/${uniqueFilename}`;
                const arrayBuffer = await sourceFile.arrayBuffer();
                const buffer = new Uint8Array(arrayBuffer);
                await writeFile(targetVaultRelativePath, buffer, { baseDir: BaseDirectory.Home });
            } else {
                return null;
            }

            return `../assets/${uniqueFilename}`;
        } catch (error) {
            console.error("Failed to copy asset into vault", error);
            setVaultError("Asset Save Error: " + String(error));
            return null;
        }
    }, [ASSETS_DIR]);

    const renamePost = useCallback(async (oldPath: string, newTitle: string): Promise<Post | null> => {
        try {
            const { readTextFile, writeTextFile, remove, exists } = await import('@tauri-apps/plugin-fs');
            const { join } = await import('@tauri-apps/api/path');
            const { parseFrontmatter, serializeFrontmatter, slugify } = await import('../utils/markdown');

            let safeName = slugify(newTitle);
            if (!safeName) return null;

            const parts = oldPath.split("/");
            parts.pop();
            const dir = parts.join("/");

            let newFilename = `${safeName}.md`;
            let newPath = await join(dir, newFilename);

            if (oldPath === newPath) return null;

            const targetExists = await exists(newPath, { baseDir: BaseDirectory.Home });
            if (targetExists) {
                const { message } = await import('@tauri-apps/plugin-dialog');
                await message(`A post with the title "${newTitle}" already exists.`, { title: "Rename Failed", kind: "error" });
                return null;
            }

            // Read the old file to update its frontmatter slug and title
            const rawContent = await readTextFile(oldPath, { baseDir: BaseDirectory.Home });
            const { meta, body } = parseFrontmatter(rawContent);
            meta.title = newTitle;
            meta.slug = safeName;

            const updatedContent = serializeFrontmatter(meta) + body;

            // Write the new file and delete the old one to avoid ghost files
            await writeTextFile(newPath, updatedContent, { baseDir: BaseDirectory.Home });
            await remove(oldPath, { baseDir: BaseDirectory.Home });

            return {
                name: safeName,
                path: `${dir}/${newFilename}`,
            };
        } catch (error) {
            console.error("Failed to rename post", error);
            return null;
        }
    }, []);

    // Recursively scan the entire vault directory
    const scanDir = useCallback(async (dirPath: string, folderName: string): Promise<VaultNode> => {
        const node: VaultNode = { name: folderName, path: dirPath, isDir: true, children: [] };
        try {
            const entries = await readDir(dirPath, { baseDir: BaseDirectory.Home });
            for (const entry of entries) {
                if (entry.name.startsWith('.')) continue;
                const childPath = `${dirPath}/${entry.name}`;
                if (entry.isDirectory) {
                    const child = await scanDir(childPath, entry.name);
                    node.children.push(child);
                } else {
                    node.children.push({ name: entry.name, path: childPath, isDir: false, children: [] });
                }
            }
            node.children.sort((a, b) => {
                if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
        } catch (err) {
            console.error(`Failed to scan ${dirPath}`, err);
        }
        return node;
    }, []);

    const getVaultTree = useCallback(async (): Promise<VaultNode | null> => {
        if (!vaultPath) return null;
        try {
            setVaultError(null);
            const vaultName = vaultPath.split('/').pop() || 'vault';
            return await scanDir(vaultPath, vaultName);
        } catch (error) {
            console.error('Failed to scan vault', error);
            setVaultError('Vault Scan Error: ' + String(error));
            return null;
        }
    }, [vaultPath, scanDir]);

    return {
        isInitializing,
        vaultError,
        setVaultError,
        initVault,
        getVaultTree,
        readPost,
        savePost,
        createPost,
        saveAsset,
        renamePost
    };
}
