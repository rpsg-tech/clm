'use client';
// Force rebuild: 2026-02-03-v2

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Input, Switch } from '@repo/ui';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { Settings, Sparkles, PenTool, LayoutTemplate, Shield, Zap, Sliders, X, CheckCircle, Save } from 'lucide-react';

export default function AdminModulesPage() {
    const { currentOrg, hasPermission } = useAuth();
    const toast = useToast();
    const [features, setFeatures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [configuringFeature, setConfiguringFeature] = useState<any | null>(null);
    const [configForm, setConfigForm] = useState<any>({});
    const [savingConfig, setSavingConfig] = useState(false);

    const canManageOrg = hasPermission('org:manage');

    useEffect(() => {
        if (currentOrg) {
            loadFeatures();
        }
    }, [currentOrg]);

    const loadFeatures = async () => {
        try {
            setLoading(true);
            const data = await api.featureFlags.list();
            setFeatures(data);
        } catch (error) {
            console.error('Failed to load features', error);
            toast.error('Error', 'Failed to load module settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (code: string, newState: boolean, currentConfig: any) => {
        if (!canManageOrg) return;

        // Optimistic update
        setFeatures(prev => prev.map(f => f.code === code ? { ...f, isEnabled: newState } : f));

        try {
            await api.featureFlags.toggle(code, newState, currentConfig);
            toast.success('Module Updated', `${newState ? 'Enabled' : 'Disabled'} module successfully.`);
        } catch (error) {
            // Revert on failure
            setFeatures(prev => prev.map(f => f.code === code ? { ...f, isEnabled: !newState } : f));
            toast.error('Update Failed', 'Could not save changes.');
        }
    };

    const openConfiguration = (feature: any) => {
        setConfiguringFeature(feature);
        // Deep copy config or use empty object
        setConfigForm(feature.config ? JSON.parse(JSON.stringify(feature.config)) : {});
    };

    const saveConfiguration = async () => {
        if (!configuringFeature) return;
        setSavingConfig(true);
        try {
            // Update the feature with new config AND ensure it's enabled if we are configuring it? 
            // Usually configuration doesn't enforce enable, but let's keep current enabled state.
            await api.featureFlags.toggle(configuringFeature.code, configuringFeature.isEnabled, configForm);

            // Update local state
            setFeatures(prev => prev.map(f => f.code === configuringFeature.code ? { ...f, config: configForm } : f));

            toast.success('Configuration Saved', `${configuringFeature.name} settings updated.`);
            setConfiguringFeature(null);
        } catch (error) {
            toast.error('Save Failed', 'Could not update configuration.');
        } finally {
            setSavingConfig(false);
        }
    };

    const getIcon = (code: string) => {
        switch (code) {
            case 'AI_CONTRACT_REVIEW': return <Sparkles className="w-5 h-5 text-purple-600" />;
            case 'AI_CLAUSE_GENERATION': return <Zap className="w-5 h-5 text-amber-500" />;
            case 'E_SIGNATURE': return <PenTool className="w-5 h-5 text-blue-600" />;
            case 'USER_ACCESS_CONTROL': return <Shield className="w-5 h-5 text-emerald-600" />;
            case 'CUSTOM_WORKFLOWS': return <Sliders className="w-5 h-5 text-slate-600" />;
            default: return <LayoutTemplate className="w-5 h-5 text-slate-500" />;
        }
    };

    const renderConfigurationForm = () => {
        if (!configuringFeature) return null;

        switch (configuringFeature.code) {
            case 'AI_CONTRACT_REVIEW':
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">AI Provider</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                value={configForm.provider || 'google'}
                                onChange={(e) => {
                                    const provider = e.target.value;
                                    setConfigForm({
                                        ...configForm,
                                        provider,
                                        model: provider === 'google' ? 'gemini-1.5-flash' : 'gpt-4-turbo'
                                    });
                                }}
                            >
                                <option value="google">Google Gemini</option>
                                <option value="openai">OpenAI</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Model</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                value={configForm.model || (configForm.provider === 'openai' ? 'gpt-4-turbo' : 'gemini-1.5-flash')}
                                onChange={(e) => setConfigForm({ ...configForm, model: e.target.value })}
                            >
                                {configForm.provider === 'openai' ? (
                                    <>
                                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                        <option value="gpt-4o">GPT-4o</option>
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Powerful)</option>
                                    </>
                                )}
                            </select>
                            <p className="text-xs text-slate-500">Select the underlying LLM for contract analysis.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Confidence Threshold ({Number(configForm.confidence_threshold || 0.7) * 100}%)</label>
                            <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.1"
                                className="w-full accent-orange-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                value={configForm.confidence_threshold || 0.7}
                                onChange={(e) => setConfigForm({ ...configForm, confidence_threshold: parseFloat(e.target.value) })}
                            />
                            <p className="text-xs text-slate-500">Only flag risks with confidence higher than this value.</p>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="space-y-0.5">
                                <label className="text-sm font-bold text-slate-900">Auto-Review</label>
                                <p className="text-xs text-slate-500">Automatically scan new contracts upon upload.</p>
                            </div>
                            <Switch
                                checked={configForm.auto_review_enabled || false}
                                onCheckedChange={(checked) => setConfigForm({ ...configForm, auto_review_enabled: checked })}
                            />
                        </div>
                    </div>
                );
            case 'E_SIGNATURE':
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Provider</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                value={configForm.provider || 'mock'}
                                onChange={(e) => setConfigForm({ ...configForm, provider: e.target.value })}
                            >
                                <option value="mock">Mock Provider (Dev)</option>
                                <option value="docusign">DocuSign</option>
                                <option value="adobe_sign">Adobe Sign</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="space-y-0.5">
                                <label className="text-sm font-bold text-slate-900">Sandbox Mode</label>
                                <p className="text-xs text-slate-500">Use test environments for signatures.</p>
                            </div>
                            <Switch
                                checked={configForm.sandbox_mode || false}
                                onCheckedChange={(checked) => setConfigForm({ ...configForm, sandbox_mode: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="space-y-0.5">
                                <label className="text-sm font-bold text-slate-900">Auto-Reminders</label>
                                <p className="text-xs text-slate-500">Send daily reminders to pending signers.</p>
                            </div>
                            <Switch
                                checked={configForm.reminders_enabled || false}
                                onCheckedChange={(checked) => setConfigForm({ ...configForm, reminders_enabled: checked })}
                            />
                        </div>
                    </div>
                );
            case 'CUSTOM_WORKFLOWS':
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Max Approvers</label>
                            <Input
                                type="number"
                                value={configForm.max_approvers || 3}
                                onChange={(e) => setConfigForm({ ...configForm, max_approvers: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="space-y-0.5">
                                <label className="text-sm font-bold text-slate-900">Allow Parallel Approvals</label>
                                <p className="text-xs text-slate-500">If disabled, approvals must happen sequentially.</p>
                            </div>
                            <Switch
                                checked={configForm.allow_parallel || false}
                                onCheckedChange={(checked) => setConfigForm({ ...configForm, allow_parallel: checked })}
                            />
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="text-center py-8 text-slate-500">
                        <p>No advanced configuration available for this module.</p>
                    </div>
                );
        }
    };

    if (!currentOrg) return null;

    return (
        <div className="max-w-[1000px] mx-auto relative">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                    <Settings className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Module Command Center</h1>
                    <p className="text-sm font-medium text-slate-500">
                        Configure critical system modules for <span className="font-bold text-slate-900">{currentOrg.name}</span>.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <Spinner className="w-8 h-8 text-orange-600" />
                    </div>
                ) : features.map((feature) => (
                    <Card key={feature.code} className={`border-l-4 overflow-hidden transition-all group ${feature.isEnabled ? 'border-l-emerald-500 shadow-md ring-1 ring-emerald-900/5' : 'border-l-slate-200 opacity-80 bg-slate-50'}`}>
                        <div className="p-6 flex items-start justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 ${feature.isEnabled ? 'bg-white border-slate-100' : 'bg-slate-100 border-transparent'}`}>
                                    {getIcon(feature.code)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-slate-900 text-lg tracking-tight">{feature.name}</h3>
                                        {feature.isEnabled ? (
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2 py-0.5 text-[10px] uppercase tracking-wide">Active</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-400 border-slate-200 font-bold px-2 py-0.5 text-[10px] uppercase tracking-wide">Disabled</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed max-w-lg mb-3">
                                        {feature.description}
                                    </p>

                                    {/* Config Preview Badges */}
                                    {feature.isEnabled && feature.config && Object.keys(feature.config).length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {feature.code === 'AI_CONTRACT_REVIEW' && (
                                                <>
                                                    {feature.config.provider && (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${feature.config.provider === 'openai' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                            {feature.config.provider === 'openai' ? 'OpenAI' : 'Gemini'}
                                                        </span>
                                                    )}
                                                    {feature.config.model && (
                                                        <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100 font-bold flex items-center gap-1">
                                                            <Sparkles className="w-3 h-3" /> {feature.config.model}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            {feature.code === 'E_SIGNATURE' && feature.config.provider && (
                                                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-bold flex items-center gap-1">
                                                    <PenTool className="w-3 h-3" /> {feature.config.provider}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                <div className="flex items-center gap-2">
                                    {feature.isEnabled && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openConfiguration(feature)}
                                            className="h-7 px-3 text-xs font-bold border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                        >
                                            <Settings className="w-3.5 h-3.5 mr-1" /> Configure
                                        </Button>
                                    )}
                                    <div className="flex items-center gap-2 pl-2 border-l border-slate-100 ml-2">
                                        <span className={`text-xs font-bold ${feature.isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {feature.isEnabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                        <Switch
                                            checked={feature.isEnabled}
                                            onCheckedChange={(checked) => handleToggle(feature.code, checked, feature.config)}
                                            disabled={!canManageOrg}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {!canManageOrg && (
                <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-3 text-orange-800">
                    <Shield className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-bold">You need Organization Manager permissions to change these settings.</p>
                </div>
            )}

            {/* Configuration Drawer/Modal */}
            {configuringFeature && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setConfiguringFeature(null)} />
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                    {getIcon(configuringFeature.code)}
                                    {configuringFeature.name}
                                </h3>
                                <p className="text-sm text-slate-500">Advanced Configuration</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setConfiguringFeature(null)} className="rounded-full hover:bg-slate-200/50">
                                <X className="w-5 h-5 text-slate-500" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {renderConfigurationForm()}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3 shrink-0">
                            <Button variant="ghost" onClick={() => setConfiguringFeature(null)} className="font-bold text-slate-500">Cancel</Button>
                            <Button
                                onClick={saveConfiguration}
                                disabled={savingConfig}
                                className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 font-bold px-6"
                            >
                                {savingConfig ? (
                                    <Spinner className="w-4 h-4 text-white" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" /> Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
