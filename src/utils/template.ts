export function generateBlogHTML(title: string, htmlContent: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg: #ffffff;
      --text: #1a1a1a;
      --border: #f0f0f0;
      --accent: #4f46e5;
      --muted: #6b7280;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f111a;
        --text: #f3f4f6;
        --border: #1f2233;
        --accent: #818cf8;
        --muted: #9ca3af;
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
    header {
      padding: 2rem 1rem;
      max-width: 800px;
      margin: 0 auto;
      border-bottom: 1px solid var(--border);
    }
    header h1 {
      margin: 0;
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    header a {
      color: var(--text);
      text-decoration: none;
      transition: color 0.2s;
    }
    header a:hover { color: var(--accent); }
    main {
      padding: 3rem 1rem;
      max-width: 800px;
      margin: 0 auto;
    }
    article img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 2rem 0;
    }
    article h1, article h2, article h3 {
      font-weight: 700;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      letter-spacing: -0.025em;
    }
    article h2 { font-size: 1.875rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    article a { color: var(--accent); text-decoration: none; }
    article a:hover { text-decoration: underline; }
    article pre {
      background: #1f2937;
      color: #e5e7eb;
      padding: 1.25rem;
      border-radius: 8px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875rem;
      margin: 1.5rem 0;
    }
    article code {
      background: rgba(128, 128, 128, 0.1);
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-size: 0.875em;
      font-family: monospace;
    }
    article blockquote {
      border-left: 4px solid var(--accent);
      padding-left: 1rem;
      color: var(--muted);
      margin: 1.5rem 0;
      font-style: italic;
    }
    footer {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--muted);
      font-size: 0.875rem;
      border-top: 1px solid var(--border);
      max-width: 800px;
      margin: 3rem auto 0;
    }
  </style>
</head>
<body>
  <header>
    <h1><a href="/">My Blog</a></h1>
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
    <li style="margin-bottom: 1.5rem;">
      <a href="${post.slug}" style="display:block; text-decoration:none;">
        <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; color: var(--text);">${post.title}</h2>
        <time style="color: var(--muted); font-size: 0.875rem;">${post.date}</time>
      </a>
    </li>
  `).join('');

    return generateBlogHTML("My Blog", `
    <div>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${linksHtml.length > 0 ? linksHtml : '<p style="color: var(--muted);">No posts published yet.</p>'}
      </ul>
    </div>
  `);
}
