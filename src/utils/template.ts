interface BlogHTMLOptions {
  title: string;
  htmlContent: string;
  date?: string;
  authorName?: string;
  authorAvatar?: string;
  isIndex?: boolean;
}

export function generateBlogHTML({ title, htmlContent, date, authorName, authorAvatar, isIndex = false }: BlogHTMLOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg: #ffffff;
      --text: #111827; /* gray-900 */
      --border: #e5e7eb; /* gray-200 */
      --accent: #4f46e5;
      --muted: #6b7280; /* gray-500 */
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f111a;
        --text: #f3f4f6; /* gray-100 */
        --border: #1f2937; /* gray-800 */
        --accent: #818cf8;
        --muted: #9ca3af; /* gray-400 */
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.7;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    header {
      padding: 3rem 1.5rem 1rem;
      max-width: 720px;
      margin: 0 auto;
    }
    header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      line-height: 1.2;
    }
    .blog-title-link {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      margin-bottom: 2rem;
    }
    .back-link {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      margin-bottom: 2rem;
      transition: color 0.2s;
    }
    .back-link:hover { color: var(--text); }
    .back-link svg { margin-right: 0.5rem; width: 16px; height: 16px; }
    
    .meta-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      color: var(--muted);
      font-size: 0.875rem;
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      background-color: var(--border);
    }
    .author-name { font-weight: 600; color: var(--text); }

    main {
      padding: 0 1.5rem 4rem;
      max-width: 720px;
      margin: 0 auto;
    }
    article { position: relative; }
    article img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      margin: 2.5rem 0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    article h1, article h2, article h3 {
      font-weight: 700;
      margin-top: 3rem;
      margin-bottom: 1rem;
      letter-spacing: -0.025em;
      line-height: 1.3;
    }
    article h2 { font-size: 1.875rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    article h3 { font-size: 1.5rem; }
    article p { margin-top: 1.25rem; margin-bottom: 1.25rem; }
    article a { color: var(--accent); text-decoration: underline; text-underline-offset: 4px; }
    article ul, article ol { margin-top: 1.25rem; margin-bottom: 1.25rem; padding-left: 1.5rem; }
    article li { margin-bottom: 0.5rem; }
    article pre {
      background: #111827;
      color: #f3f4f6;
      padding: 1.25rem;
      border-radius: 8px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875rem;
      margin: 2rem 0;
    }
    article code {
      background: rgba(128, 128, 128, 0.15);
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-size: 0.875em;
      font-family: monospace;
      color: inherit;
    }
    article pre code { background: none; padding: 0; color: inherit; }
    article blockquote {
      border-left: 4px solid var(--accent);
      padding-left: 1.25rem;
      color: var(--muted);
      margin: 2rem 0;
      font-style: italic;
    }
    
    .index-list { list-style: none; padding: 0; margin: 0; }
    .index-item {
      padding: 2rem 0;
    }
    .index-item:not(:last-child) { border-bottom: 1px solid var(--border); }
    .index-link { display: block; text-decoration: none; transition: transform 0.2s; }
    .index-link:hover h2 { color: var(--accent); }
    .index-title { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: var(--text); font-weight: 700; line-height: 1.3; transition: color 0.2s; }
    .index-meta { color: var(--muted); font-size: 0.875rem; }
    
    footer {
      text-align: center;
      padding: 3rem 1.5rem;
      color: var(--muted);
      font-size: 0.875rem;
      max-width: 720px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <header>
    ${isIndex
      ? `<h1>My Blog</h1>`
      : `<a href="../index.html" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Blog
         </a>
         <h1>${title}</h1>
         `
    }
    ${!isIndex && (date || authorName) ? `
      <div class="meta-row">
        ${authorAvatar ? `<img src="${authorAvatar}" alt="${authorName || 'Author'}" class="avatar" />` : ''}
        <div>
          ${authorName ? `<div class="author-name">${authorName}</div>` : ''}
          ${date ? `<time datetime="${new Date(date).toISOString()}">${date}</time>` : ''}
        </div>
      </div>
    ` : ''}
  </header>
  <main>
    <article>
      ${htmlContent}
    </article>
  </main>
  <footer>
    <p>Published with <a href="https://github.com/writizen" style="color:var(--accent);text-decoration:none;">Writizen</a></p>
  </footer>
</body>
</html>`;
}

export function generateIndexHTML(postLinks: { title: string, date: string, slug: string }[]): string {
  const linksHtml = postLinks.map(post => `
    <li class="index-item">
      <a href="${post.slug}" class="index-link">
        <h2 class="index-title">${post.title}</h2>
        <time class="index-meta">${post.date}</time>
      </a>
    </li>
  `).join('');

  return generateBlogHTML({
    title: "My Blog",
    htmlContent: `
        <div>
          <ul class="index-list">
            ${linksHtml.length > 0 ? linksHtml : '<p style="color: var(--muted); padding: 2rem 0; text-align: center;">No posts published yet.</p>'}
          </ul>
        </div>
      `,
    isIndex: true
  });
}
