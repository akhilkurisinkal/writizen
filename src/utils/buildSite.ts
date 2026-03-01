import { readDir, readTextFile, writeTextFile, mkdir, exists, copyFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { marked } from 'marked';
import { generateBlogHTML, generateIndexHTML } from './template';
import { parseFrontmatter, slugify } from './markdown';

export async function buildStaticSite(
  vaultPath: string,
  customDomain?: string,
  authorName?: string,
  authorAvatar?: string
): Promise<string> {
  try {
    const { remove } = await import('@tauri-apps/plugin-fs');
    const postsDir = await join(vaultPath, 'posts');
    const outDir = await join(vaultPath, 'public_html');
    const assetsDir = await join(vaultPath, 'assets');
    const outAssetsDir = await join(outDir, 'assets');

    // 1. Create/Ensure out directories exist
    if (!(await exists(outDir))) {
      await mkdir(outDir, { recursive: true });
    }
    const outPostsDir = await join(outDir, 'posts');
    if (await exists(outPostsDir)) {
      await remove(outPostsDir, { recursive: true });
    }
    await mkdir(outPostsDir, { recursive: true });

    if (await exists(outAssetsDir)) {
      await remove(outAssetsDir, { recursive: true });
    }

    // 2. Read all markdown files
    const entries = await readDir(postsDir);
    const mdFiles = entries.filter(e => e.isFile && e.name && e.name.endsWith('.md'));

    const postLinks: { title: string, date: string, slug: string, excerpt: string }[] = [];

    // 3. Process each post
    for (const file of mdFiles) {
      if (!file.name) continue;

      const mdPath = await join(postsDir, file.name);
      let rawContent = await readTextFile(mdPath);

      // Parse frontmatter
      const { meta, body } = parseFrontmatter(rawContent);

      // SKIP DRAFTS
      if (meta.status !== 'ready') {
        console.log(`Skipping draft: ${file.name}`);
        continue;
      }

      const title = meta.title || file.name.replace('.md', '');
      const date = meta.date || new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

      // Convert Markdown to HTML
      const htmlContent = await marked.parse(body);

      // Generate text excerpt for Index Page 
      const plainText = htmlContent.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const excerpt = meta.excerpt || meta.description || (plainText.length > 180 ? plainText.substring(0, 180) + '...' : plainText);

      // Generate full HTML page
      const fullHtml = generateBlogHTML({
        title,
        htmlContent,
        date,
        authorName,
        authorAvatar
      });

      // Write to out/posts folder
      const fallbackSlug = slugify(file.name.replace('.md', ''));
      const normalizedSlug = slugify(meta.slug) || fallbackSlug;
      const slug = `${normalizedSlug}.html`;
      const outPath = await join(outPostsDir, slug);
      await writeTextFile(outPath, fullHtml);

      postLinks.push({
        title,
        date,
        slug: `posts/${slug}`,
        excerpt
      });
    }

    // 4. Generate Index Page
    const indexHtml = generateIndexHTML(postLinks);
    const indexPath = await join(outDir, 'index.html');
    await writeTextFile(indexPath, indexHtml);

    // 4.5. Generate GitHub Actions Deploy Workflow
    // This completely automates GitHub Pages without the user touching settings
    const githubWorkflowsDir = await join(outDir, '.github', 'workflows');
    if (!(await exists(githubWorkflowsDir))) {
      await mkdir(githubWorkflowsDir, { recursive: true });
    }

    const deployYml = `
name: Deploy static content to Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;
    const deployYmlPath = await join(githubWorkflowsDir, 'deploy.yml');
    await writeTextFile(deployYmlPath, deployYml.trim());

    // 4.6 Handle Custom Domain CNAME Generation
    const cnamePath = await join(outDir, 'CNAME');
    if (customDomain && customDomain.trim() !== '') {
      await writeTextFile(cnamePath, customDomain.trim());
    } else {
      if (await exists(cnamePath)) {
        // Clearing the CNAME file contents achieves the same effect on GitHub Pages without requiring fs:remove blanket permissions
        await writeTextFile(cnamePath, "");
      }
    }

    // 5. Copy Assets (Images) if they exist
    if (await exists(assetsDir)) {
      if (!(await exists(outAssetsDir))) {
        await mkdir(outAssetsDir, { recursive: true });
      }
      const assetEntries = await readDir(assetsDir);
      for (const asset of assetEntries) {
        if (asset.isFile && asset.name) {
          const srcPath = await join(assetsDir, asset.name);
          const destPath = await join(outAssetsDir, asset.name);
          // Note: read/write binary for images instead of copyFile if Tauri copyFile is flaky, 
          // but copyFile should work on desktop.
          try {
            // Basic naive copy - @tauri-apps/plugin-fs copyFile is experimental but usually available
            await copyFile(srcPath, destPath);
          } catch (e) {
            console.warn("Could not copy asset", asset.name, e);
          }
        }
      }
    }

    return outDir;
  } catch (error) {
    console.error("Static build failed:", error);
    throw error;
  }
}
