export interface PostMeta {
    title: string;
    date: string;
    slug: string;
    status: "draft" | "ready";
}

export function parseFrontmatter(raw: string): { meta: PostMeta; body: string } {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
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

    for (const line of yaml.split("\n")) {
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
