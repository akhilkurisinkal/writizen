export interface PostMeta {
    title: string;
    date: string;
    slug: string;
    status: "draft" | "ready";
}

export function parseFrontmatter(raw: string): { meta: PostMeta; body: string } {
    const match = raw.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    const defaults: PostMeta = {
        title: "Untitled",
        date: new Date().toISOString().split("T")[0],
        slug: "",
        status: "draft",
    };
    if (!match) return { meta: defaults, body: raw };

    const yaml = match[1];
    const body = match[2];
    const meta = { ...defaults };

    const lines = yaml.split(/\r?\n/);
    for (const line of lines) {
        const [key, ...rest] = line.split(":");
        if (!key || rest.length === 0) continue;
        const val = rest.join(":").trim().replace(/^["']|["']$/g, "");
        const k = key.trim();
        if (k === "title") meta.title = val;
        if (k === "date") meta.date = val;
        if (k === "slug") meta.slug = val;
        if (k === "status") meta.status = val === "ready" ? "ready" : "draft";
    }
    return { meta, body };
}

export function serializeFrontmatter(meta: PostMeta): string {
    return `---\ntitle: "${meta.title}"\ndate: "${meta.date}"\nslug: "${meta.slug}"\nstatus: "${meta.status}"\n---\n`;
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}
