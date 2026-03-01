export interface BlogHTMLOptions {
  title: string;
  htmlContent: string;
  date?: string;
  authorName?: string;
  isIndex?: boolean;
  googleAnalyticsId?: string;
  giscusConfig?: {
    repo: string;
    repoId: string;
    category: string;
    categoryId: string;
  };
}

export function generateBlogHTML({ title, htmlContent, date, authorName, isIndex = false, googleAnalyticsId, giscusConfig }: BlogHTMLOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* Modern Minimal Theme */
    :root {
      --bg: #fafafa;
      --text: #1a1a1a;
      --light-text: #6b7280;
      --border: #e5e7eb;
      --link: #1a1a1a;
      --link-hover: #4f46e5;
      --surface: #ffffff;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #09090b;
        --text: #f3f4f6;
        --light-text: #9ca3af;
        --border: #27272a;
        --link: #f3f4f6;
        --link-hover: #818cf8;
        --surface: #18181b;
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.7;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    a { color: var(--link); text-decoration: none; transition: color 0.2s ease; }
    a:hover { color: var(--link-hover); text-decoration: none; }

    /* Header styling */
    header {
      border-bottom: 1px solid var(--border);
      background-color: var(--bg);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-content {
      padding: 1rem 1.5rem;
      max-width: 680px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-logo {
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text);
    }
    .header-nav {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .nav-link {
      font-size: 0.9rem;
      color: var(--light-text);
      font-weight: 500;
    }
    .nav-link:hover { color: var(--text); }
    .rss-icon {
      color: var(--light-text);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }
    .rss-icon:hover { color: #f26522; }
    .rss-icon svg { width: 18px; height: 18px; stroke-width: 2; }

    /* Main Content */
    main {
      padding: 2.5rem 1.5rem 5rem;
      max-width: 680px;
      margin: 0 auto;
    }

    /* Post Header */
    .post-header {
      margin-bottom: 3.5rem;
      text-align: left;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 1.5rem;
      color: var(--light-text);
      font-size: 0.85rem;
      font-weight: 500;
      transition: color 0.2s;
    }
    .back-link:hover { color: var(--text); }
    .back-link svg { width: 14px; height: 14px; }
    
    .post-title {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0 0 0.5rem 0;
      line-height: 1.15;
      letter-spacing: -0.03em;
      color: var(--text);
    }
    .post-meta {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      color: var(--light-text);
      font-size: 0.9rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding-bottom: 2.5rem;
      border-bottom: 1px solid var(--border);
    }

    /* Article Body */
    article {
      font-size: 1.05rem;
    }
    article img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 2.5rem 0;
    }
    article h1, article h2, article h3 {
      font-weight: 700;
      margin-top: 3rem;
      margin-bottom: 1rem;
      line-height: 1.3;
      letter-spacing: -0.02em;
      color: var(--text);
    }
    article h2 { font-size: 1.75rem; }
    article h3 { font-size: 1.3rem; }
    article p { margin-top: 1.5rem; margin-bottom: 1.5rem; }
    article a { color: var(--link-hover); text-decoration: none; border-bottom: 1px solid transparent; }
    article a:hover { border-bottom-color: var(--link-hover); }
    article ul, article ol { padding-left: 1.5rem; margin-top: 1.5rem; margin-bottom: 1.5rem; }
    article li { margin-bottom: 0.5rem; }
    article pre {
      background: var(--surface);
      color: var(--text);
      padding: 1.25rem;
      border-radius: 8px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9rem;
      border: 1px solid var(--border);
      margin: 2rem 0;
    }
    article code {
      background: var(--border);
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85em;
    }
    article pre code { background: none; padding: 0; }
    article blockquote {
      border-left: 3px solid var(--border);
      padding-left: 1.5rem;
      margin: 2rem 0;
      color: var(--light-text);
      font-style: italic;
    }

    /* Index List */
    .index-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 3rem; }
    .index-item {
      display: flex;
      flex-direction: column;
      padding-bottom: 3rem;
      border-bottom: 1px solid var(--border);
    }
    .index-item:last-child {
      padding-bottom: 0;
      border-bottom: none;
    }
    .index-date {
      color: var(--light-text);
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .index-link {
      display: inline-block;
      margin-bottom: 0.5rem;
      text-decoration: none;
      border-bottom: none !important;
    }
    .index-link:hover {
      border-bottom: none !important;
    }
    .index-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      line-height: 1.3;
      letter-spacing: -0.02em;
      transition: color 0.2s ease;
      text-decoration: none;
    }
    .index-link:hover .index-title {
      color: var(--link-hover);
      text-decoration: underline;
      text-underline-offset: 4px;
    }
    .index-excerpt {
      margin: 0;
      font-size: 1rem;
      color: var(--light-text);
      line-height: 1.6;
    }

    /* Footer */
    footer {
      text-align: center;
      padding: 3rem 1.5rem;
      color: var(--light-text);
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
      max-width: 680px;
      margin: 0 auto;
    }
  </style>
  ${googleAnalyticsId ? `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${googleAnalyticsId}');
  </script>
  ` : ''}
</head>
<body>
  <header>
    <div class="header-content">
      <a href="${isIndex ? '#' : '../index.html'}" class="header-logo">
        ${authorName ? authorName + ' Blog' : 'My Blog'}
      </a>
      <div class="header-nav">
        <a href="#" class="nav-link">About</a>
        <a href="${isIndex ? 'rss.xml' : '../rss.xml'}" class="rss-icon" aria-label="RSS Feed" title="RSS Feed">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
        </a>
      </div>
    </div>
  </header>
  
  <main>
    ${!isIndex ? `
      <div class="post-header">
        <a href="../index.html" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to posts
        </a>
        <h1 class="post-title">${title}</h1>
        ${date ? `<div class="post-meta">
          <time datetime="${new Date(date).toISOString()}">${date}</time>
        </div>` : ''}
      </div>
    ` : ''}
    <article>
      ${htmlContent}
    </article>

    ${!isIndex && giscusConfig && giscusConfig.repo ? `
      <div style="margin-top: 5rem; padding-top: 3rem; border-top: 1px solid var(--border);">
        <script src="https://giscus.app/client.js"
                data-repo="${giscusConfig.repo}"
                data-repo-id="${giscusConfig.repoId}"
                data-category="${giscusConfig.category}"
                data-category-id="${giscusConfig.categoryId}"
                data-mapping="pathname"
                data-strict="0"
                data-reactions-enabled="1"
                data-emit-metadata="0"
                data-input-position="bottom"
                data-theme="preferred_color_scheme"
                data-lang="en"
                crossorigin="anonymous"
                async>
        </script>
      </div>
    ` : ''}
  </main>

  <footer>
    <p>Powered by <a href="https://github.com/writizen">Writizen</a></p>
  </footer>
</body>
</html>`;
}

export function generateIndexHTML(
  postLinks: { title: string, date: string, slug: string, excerpt?: string }[],
  authorName?: string,
  googleAnalyticsId?: string
): string {
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
    authorName,
    googleAnalyticsId
  });
}
