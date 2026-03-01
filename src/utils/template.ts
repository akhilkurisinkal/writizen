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
    /* Karpathy-style Minimal Theme */
    :root {
      --bg: #ffffff;
      --text: #333333;
      --light-text: #888888;
      --border: #f0f0f0;
      --link: #3b82f6; /* Karpathy blue */
      --link-hover: #2563eb;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #121212;
        --text: #e0e0e0;
        --light-text: #999999;
        --border: #333333;
        --link: #60a5fa;
        --link-hover: #93c5fd;
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    a { color: var(--link); text-decoration: none; }
    a:hover { text-decoration: underline; color: var(--link-hover); }

    /* Header styling */
    header {
      border-bottom: 1px solid var(--border);
      padding: 1.5rem 1rem;
    }
    .header-container {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-logo {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: var(--text);
      font-size: 1.5rem;
      font-weight: 400;
      letter-spacing: -0.02em;
    }
    .header-logo:hover {
      text-decoration: none;
      color: var(--text);
    }
    .rss-icon {
      background-color: #f26522;
      color: white;
      border-radius: 4px;
      width: 28px;
      height: 28px;
      padding: 4px;
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .rss-icon svg { width: 100%; height: 100%; stroke-width: 2.5; }
    .header-about {
      color: var(--light-text);
      font-size: 1rem;
      text-decoration: none;
    }

    /* Main Content */
    main {
      padding: 3rem 1rem;
      max-width: 800px;
      margin: 0 auto;
    }

    /* Post Header (Only on Post Pages) */
    .post-header {
      margin-bottom: 3rem;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 2rem;
      color: var(--light-text);
      font-size: 0.9rem;
    }
    .post-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      line-height: 1.2;
      letter-spacing: -0.02em;
      color: var(--text);
    }
    .post-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--light-text);
      font-size: 0.95rem;
    }
    .post-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
    .post-author-info {
      display: flex;
      flex-direction: column;
    }
    .post-author-name {
      font-weight: 600;
      color: var(--text);
    }

    /* Article Body */
    article img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 2rem 0;
    }
    article h1, article h2, article h3 {
      font-weight: 600;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      line-height: 1.3;
      color: var(--text);
    }
    article p { margin-top: 1.2rem; margin-bottom: 1.2rem; }
    article ul, article ol { padding-left: 1.5rem; margin-top: 1rem; margin-bottom: 1rem; }
    article li { margin-bottom: 0.5rem; }
    article pre {
      background: #f8f9fa;
      color: #333;
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9rem;
      border: 1px solid #e9ecef;
      margin: 1.5rem 0;
    }
    @media (prefers-color-scheme: dark) {
      article pre {
        background: #1e1e1e;
        color: #d4d4d4;
        border-color: #333;
      }
    }
    article code {
      background: rgba(128,128,128,0.1);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.9em;
    }
    article pre code { background: none; padding: 0; }
    article blockquote {
      border-left: 4px solid var(--border);
      padding-left: 1.2rem;
      margin: 1.5rem 0;
      color: var(--light-text);
      font-style: italic;
    }

    /* Index List (Karpathy Style) */
    .index-list { list-style: none; padding: 0; margin: 0; }
    .index-item {
      margin-bottom: 3.5rem;
    }
    .index-date {
      color: var(--light-text);
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
      display: block;
    }
    .index-link {
      display: inline-block;
      margin-bottom: 0.5rem;
    }
    .index-title {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 400;
      color: var(--link);
      line-height: 1.3;
    }
    .index-link:hover .index-title {
      text-decoration: underline;
      color: var(--link-hover);
    }
    .index-excerpt {
      margin: 0;
      font-size: 1.05rem;
      color: var(--text);
      line-height: 1.5;
    }

    /* Footer */
    footer {
      text-align: center;
      padding: 4rem 1rem 2rem;
      color: var(--light-text);
      font-size: 0.85rem;
      max-width: 800px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-container">
      <div style="display: flex; align-items: center;">
        <a href="${isIndex ? 'rss.xml' : '../rss.xml'}" class="rss-icon" title="RSS Feed">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
        </a>
        <a href="${isIndex ? '#' : '../index.html'}" class="header-logo">
          ${authorName ? authorName + ' blog' : 'My Blog'}
        </a>
      </div>
      <a href="#" class="header-about">About</a>
    </div>
  </header>
  <main>
    ${!isIndex ? `
      <div class="post-header">
        <a href="../index.html" class="back-link">← Back to home</a>
        <h1 class="post-title">${title}</h1>
        ${(date || authorName) ? `
          <div class="post-meta">
            ${authorAvatar ? `<img src="${authorAvatar}" alt="${authorName || 'Author'}" class="post-avatar" />` : ''}
            <div class="post-author-info">
              ${authorName ? `<span class="post-author-name">${authorName}</span>` : ''}
              ${date ? `<time datetime="${new Date(date).toISOString()}">Published on ${date}</time>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    ` : ''}
    <article>
      ${htmlContent}
    </article>
  </main>
  <footer>
    <p>Powered by <a href="https://github.com/writizen">Writizen</a></p>
  </footer>
</body>
</html>`;
}

export function generateIndexHTML(postLinks: { title: string, date: string, slug: string, excerpt?: string }[]): string {
  const linksHtml = postLinks.map(post => `
    <li class="index-item">
      <time class="index-date">${post.date}</time>
      <a href="${post.slug}" class="index-link">
        <h2 class="index-title">${post.title}</h2>
      </a>
      ${post.excerpt ? `<p class="index-excerpt">${post.excerpt}</p>` : ''}
    </li>
  `).join('');

  return generateBlogHTML({
    title: "My Blog",
    htmlContent: `
        <ul class="index-list">
          ${linksHtml.length > 0 ? linksHtml : '<li class="index-item"><p class="index-excerpt">No posts published yet.</p></li>'}
        </ul>
      `,
    isIndex: true,
    authorName: "" // Default fallback, but buildSite passes it during compilation
  });
}
