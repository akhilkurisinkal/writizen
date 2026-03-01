import { useState, useEffect } from 'react';
import { BarChart2, MessageSquare, X, Check, Server } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import clsx from 'clsx';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    vaultPath: string;
}

export function SettingsModal({ isOpen, onClose, vaultPath }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<'analytics' | 'comments'>('analytics');

    // Analytics State
    const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
    const [enablePlausible, setEnablePlausible] = useState(false);
    const [plausibleDomain, setPlausibleDomain] = useState('');

    // Comments State
    const [enableComments, setEnableComments] = useState(false);
    const [commentProvider, setCommentProvider] = useState<'disqus' | 'giscus'>('giscus');
    const [disqusShortname, setDisqusShortname] = useState('');
    const [giscusRepo, setGiscusRepo] = useState('');
    const [giscusRepoId, setGiscusRepoId] = useState('');
    const [giscusCategory, setGiscusCategory] = useState('');
    const [giscusCategoryId, setGiscusCategoryId] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && vaultPath) {
            loadConfig();
        }
    }, [isOpen, vaultPath]);

    const loadConfig = async () => {
        try {
            const configStr: string = await invoke('get_config', { vaultPath });
            const config = JSON.parse(configStr);

            if (config.analytics) {
                setGoogleAnalyticsId(config.analytics.googleAnalyticsId || '');
                setEnablePlausible(config.analytics.enablePlausible || false);
                setPlausibleDomain(config.analytics.plausibleDomain || '');
            }

            if (config.comments) {
                setEnableComments(config.comments.enabled || false);
                setCommentProvider(config.comments.provider || 'giscus');
                setDisqusShortname(config.comments.disqusShortname || '');
                setGiscusRepo(config.comments.giscusRepo || '');
                setGiscusRepoId(config.comments.giscusRepoId || '');
                setGiscusCategory(config.comments.giscusCategory || '');
                setGiscusCategoryId(config.comments.giscusCategoryId || '');
            }
        } catch (error) {
            console.error("Failed to load config:", error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const config = {
                analytics: {
                    googleAnalyticsId,
                    enablePlausible,
                    plausibleDomain
                },
                comments: {
                    enabled: enableComments,
                    provider: commentProvider,
                    disqusShortname,
                    giscusRepo,
                    giscusRepoId,
                    giscusCategory,
                    giscusCategoryId
                }
            };

            await invoke('save_config', {
                vaultPath,
                config: JSON.stringify(config, null, 2)
            });

            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Failed to save config:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[32rem] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex overflow-hidden animate-in zoom-in-95 duration-200 select-none"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className="w-56 bg-slate-50 dark:bg-slate-950/50 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4">
                    <div className="flex items-center gap-2 px-2 pb-6 pt-2">
                        <Server size={18} className="text-indigo-500" />
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">Site Configuration</h2>
                    </div>

                    <nav className="flex-1 space-y-1">
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                activeTab === 'analytics'
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <BarChart2 size={16} />
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                activeTab === 'comments'
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <MessageSquare size={16} />
                            Comments
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-end p-4 border-b border-slate-100 dark:border-slate-800/50">
                        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        {activeTab === 'analytics' && (
                            <div className="max-w-md animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Analytics</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Track your blog's visitors and performance.</p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Google Analytics Measurement ID
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="G-XXXXXXXXXX"
                                            value={googleAnalyticsId}
                                            onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                        />
                                        <p className="mt-1.5 text-xs text-slate-500">Starts with G-. Leave empty to disable.</p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                        <label className="flex items-center gap-3 cursor-pointer mb-4">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={enablePlausible}
                                                    onChange={(e) => setEnablePlausible(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Plausible Analytics</span>
                                        </label>

                                        {enablePlausible && (
                                            <div className="pl-12 animate-in fade-in zoom-in-95 duration-200">
                                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                    Tracking Domain
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="yourdomain.com"
                                                    value={plausibleDomain}
                                                    onChange={(e) => setPlausibleDomain(e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <div className="max-w-md animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Comments System</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Allow readers to comment on your posts.</p>

                                <div className="space-y-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={enableComments}
                                                onChange={(e) => setEnableComments(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Comments</span>
                                    </label>

                                    {enableComments && (
                                        <div className="space-y-5 pt-2 animate-in fade-in duration-300">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Provider
                                                </label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => setCommentProvider('giscus')}
                                                        className={clsx(
                                                            "px-3 py-2 border rounded-lg text-sm font-medium transition-all text-center",
                                                            commentProvider === 'giscus'
                                                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                                                                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                                                        )}
                                                    >
                                                        Giscus (GitHub)
                                                    </button>
                                                    <button
                                                        onClick={() => setCommentProvider('disqus')}
                                                        className={clsx(
                                                            "px-3 py-2 border rounded-lg text-sm font-medium transition-all text-center",
                                                            commentProvider === 'disqus'
                                                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                                                                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                                                        )}
                                                    >
                                                        Disqus
                                                    </button>
                                                </div>
                                            </div>

                                            {commentProvider === 'giscus' ? (
                                                <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                                            Repo (user/repo)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={giscusRepo}
                                                            onChange={(e) => setGiscusRepo(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                                            Repo ID
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={giscusRepoId}
                                                            onChange={(e) => setGiscusRepoId(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                                            Category
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={giscusCategory}
                                                            onChange={(e) => setGiscusCategory(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                                            Category ID
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={giscusCategoryId}
                                                            onChange={(e) => setGiscusCategoryId(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                                        Disqus Shortname
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={disqusShortname}
                                                        onChange={(e) => setDisqusShortname(e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || saveSuccess}
                            className={clsx(
                                "px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                saveSuccess
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                            )}
                        >
                            {saveSuccess ? (
                                <>
                                    <Check size={16} />
                                    Saved
                                </>
                            ) : isSaving ? (
                                "Saving..."
                            ) : (
                                "Save Configuration"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
