import React, { useState, useEffect } from 'react';
import { Github, Key, User, Mail, Loader2, X, Check, Globe } from 'lucide-react';
import { load } from '@tauri-apps/plugin-store';

export interface PublishSettings {
    repoUrl: string;
    pat: string;
    authorName: string;
    authorEmail: string;
    customDomain?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: PublishSettings) => void;
}

export default function PublishSettingsDialog({ isOpen, onClose, onSave }: Props) {
    const [settings, setSettings] = useState<PublishSettings>({
        repoUrl: '',
        pat: '',
        authorName: '',
        authorEmail: '',
        customDomain: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const store = await load('settings.json');
            const repoUrl = await store.get<string>('github_repo_url') || '';
            const pat = await store.get<string>('github_pat') || '';
            const authorName = await store.get<string>('github_author_name') || '';
            const authorEmail = await store.get<string>('github_author_email') || '';
            const customDomain = await store.get<string>('github_custom_domain') || '';

            setSettings({ repoUrl, pat, authorName, authorEmail, customDomain });
        } catch (err) {
            console.error("Failed to load settings:", err);
            setError("Could not load saved settings.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings.repoUrl || !settings.pat || !settings.authorName || !settings.authorEmail) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            const store = await load('settings.json');
            await store.set('github_repo_url', settings.repoUrl);
            await store.set('github_pat', settings.pat);
            await store.set('github_author_name', settings.authorName);
            await store.set('github_author_email', settings.authorEmail);
            await store.set('github_custom_domain', settings.customDomain || '');
            await store.save();

            onSave(settings);
            onClose();
        } catch (err) {
            console.error("Failed to save settings:", err);
            setError("Failed to save credentials safely.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-100 dark:bg-indigo-500/20 p-1.5 rounded-lg">
                            <Github size={18} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Publishing Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                            <Loader2 size={24} className="animate-spin mb-2" />
                            <span className="text-sm">Loading secure storage...</span>
                        </div>
                    ) : (
                        <form id="settings-form" onSubmit={handleSave} className="space-y-4">

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg border border-red-100 dark:border-red-900/30 flex items-start gap-2">
                                    <span className="shrink-0 font-bold">!</span>
                                    <p>{error}</p>
                                </div>
                            )}

                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Connect your vault to a remote GitHub repository. Writizen will push your Markdown files automatically when you publish.
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    GitHub Repository URL
                                </label>
                                <div className="relative">
                                    <Github size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="url"
                                        required
                                        value={settings.repoUrl}
                                        onChange={e => setSettings({ ...settings, repoUrl: e.target.value })}
                                        placeholder="https://github.com/username/my-blog.git"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span>Personal Access Token</span>
                                    <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-600 lowercase normal-case text-[11px] font-medium">Get token &rarr;</a>
                                </label>
                                <div className="relative">
                                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={settings.pat}
                                        onChange={e => setSettings({ ...settings, pat: e.target.value })}
                                        placeholder="ghp_..."
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow font-mono"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">Requires standard repo scopes.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                        Author Name
                                    </label>
                                    <div className="relative">
                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            value={settings.authorName}
                                            onChange={e => setSettings({ ...settings, authorName: e.target.value })}
                                            placeholder="Jane Doe"
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                        Author Email
                                    </label>
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            value={settings.authorEmail}
                                            onChange={e => setSettings({ ...settings, authorEmail: e.target.value })}
                                            placeholder="jane@example.com"
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span>Custom Domain (Optional)</span>
                                </label>
                                <div className="relative">
                                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={settings.customDomain}
                                        onChange={e => setSettings({ ...settings, customDomain: e.target.value })}
                                        placeholder="blog.example.com"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                                    />
                                </div>
                                <div className="mt-1 flex flex-col gap-1">
                                    <p className="text-[11px] text-slate-400">If using your own domain, Writizen will auto-generate the CNAME file.</p>
                                    <a href="https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site" target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-600 text-[11px] font-medium w-fit">
                                        How to configure DNS records at your registrar &rarr;
                                    </a>
                                </div>
                            </div>

                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="settings-form"
                        disabled={isLoading || isSaving}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-indigo-600/20"
                    >
                        {isSaving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Check size={16} />
                        )}
                        Save & Publish
                    </button>
                </div>

            </div>
        </div>
    );
}
