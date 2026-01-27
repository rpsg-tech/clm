'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api-client';
import { Card, Button, Badge, Spinner } from '@repo/ui';
import {
    ArrowLeft,
    Save,
    Shield,
    Check,
    Loader2,
    Lock,
    AlertCircle
} from 'lucide-react';

interface Permission {
    id: string;
    code: string;
    name: string;
    description?: string;
}

interface GroupedPermissions {
    [module: string]: Permission[];
}

export default function RoleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const roleId = params.id as string;
    const isNew = roleId === 'new';

    const [role, setRole] = useState<any>(null);
    const [allPermissions, setAllPermissions] = useState<GroupedPermissions>({});
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        loadData();
    }, [roleId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load permissions
            const permData = await api.permissions.list();
            setAllPermissions(permData.grouped);

            // Load role if editing
            if (!isNew) {
                const roleData = await api.roles.get(roleId);
                setRole(roleData);
                setName(roleData.name);
                setCode(roleData.code);
                setDescription(roleData.description || '');
                setSelectedPermissions(new Set(roleData.permissions.map((p: any) => p.id)));
            }
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (permissionId: string) => {
        if (role?.isSystem) return; // Can't edit system roles

        const newSet = new Set(selectedPermissions);
        if (newSet.has(permissionId)) {
            newSet.delete(permissionId);
        } else {
            newSet.add(permissionId);
        }
        setSelectedPermissions(newSet);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            if (isNew) {
                await api.roles.create({
                    name,
                    code,
                    description,
                    permissionIds: Array.from(selectedPermissions)
                });
            } else {
                await api.roles.update(roleId, {
                    name,
                    description,
                    permissionIds: Array.from(selectedPermissions)
                });
            }

            router.push('/dashboard/roles');
        } catch (error) {
            console.error('Failed to save role', error);
            alert('Failed to save role');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4 animate-in fade-in duration-500">
                <Spinner size="lg" color="orange" />
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Loading Configuration...</p>
            </div>
        );
    }

    const isReadOnly = role?.isSystem;

    return (
        <div className="space-y-8 pb-20 selection:bg-orange-100 max-w-5xl mx-auto relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/dashboard/roles')}
                            className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {isNew ? 'New Configuration' : (isReadOnly ? 'System Role' : 'Custom Role')}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {isNew ? 'Create New Role' : (isReadOnly ? `View ${role.name}` : `Edit ${role.name}`)}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">
                        {isReadOnly ? 'Standard system roles are immutable to ensure security.' : 'Configure custom access levels and permissions.'}
                    </p>
                </div>
                {!isReadOnly && (
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/dashboard/roles')}
                            className="text-slate-500 hover:text-slate-900 font-bold text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || !name || !code}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 h-11 shadow-lg text-xs font-bold tracking-wide flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {isNew ? 'Create Role' : 'Save Changes'}</>}
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Role Details */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                            <div className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                                <Shield className="w-5 h-5 text-orange-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">Role Configuration</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Role Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isReadOnly}
                                    placeholder="e.g. Finance Manager"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed placeholder-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Unique Code</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                                        disabled={isReadOnly || !isNew}
                                        placeholder="FINANCE_MANAGER"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed placeholder-slate-400 uppercase tracking-wide"
                                    />
                                    {!isNew && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isReadOnly}
                                    placeholder="Describe the responsibilities..."
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed placeholder-slate-400 resize-none"
                                />
                            </div>
                        </div>

                        {isReadOnly && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex gap-3">
                                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                    This is a default system role. To modify these permissions, please duplicate this role or create a new one.
                                </p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column: Permissions */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-900">Access Permissions</h3>
                                <p className="text-xs text-slate-500 font-medium">Define what this role can see and do.</p>
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold py-1 px-3 rounded-lg">
                                {selectedPermissions.size} Selected
                            </Badge>
                        </div>

                        <div className="space-y-8">
                            {Object.entries(allPermissions).map(([module, permissions]) => (
                                <div key={module} className="space-y-3">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                        {module.replace(/_/g, ' ')}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {permissions.map((perm) => {
                                            const isSelected = selectedPermissions.has(perm.id);
                                            return (
                                                <button
                                                    key={perm.id}
                                                    onClick={() => togglePermission(perm.id)}
                                                    disabled={isReadOnly}
                                                    className={`group relative flex items-start p-3 rounded-xl border2 transition-all duration-200 text-left w-full
                                                        ${isSelected
                                                            ? 'bg-orange-50/50 border-orange-200 shadow-sm'
                                                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                                                        } ${isReadOnly ? 'cursor-default opacity-80' : 'cursor-pointer'} border`}
                                                >
                                                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0
                                                        ${isSelected
                                                            ? 'bg-orange-500 border-orange-600 shadow-sm'
                                                            : 'bg-white border-slate-300 group-hover:border-slate-400'
                                                        }`}>
                                                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                                    </div>

                                                    <div className="ml-3">
                                                        <p className={`text-sm font-bold transition-colors ${isSelected ? 'text-orange-900' : 'text-slate-700'}`}>
                                                            {perm.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-wide">
                                                            {perm.code}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
