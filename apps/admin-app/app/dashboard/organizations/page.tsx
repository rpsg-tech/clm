'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api-client';
import { Card, Button, Badge } from '@repo/ui';
import {
    Plus,
    Building,
    MoreVertical,
    Loader2,
    Globe,
    Layers,
    ArrowRight,
    Search,
    Network,
    Edit3,
    Trash2,
    Eye,
    AlertCircle
} from 'lucide-react';

interface Organization {
    id: string;
    name: string;
    code: string;
    type: 'PARENT' | 'ENTITY';
    isActive: boolean;
    parentId: string | null;
    createdAt: string;
    parent?: {
        name: string;
    };
}

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [type, setType] = useState<'PARENT' | 'ENTITY'>('ENTITY');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        try {
            setLoading(true);
            const data = await api.organizations.list();
            setOrganizations(data);
        } catch (error) {
            console.error('Failed to load organizations', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitLoading(true);
            await api.organizations.create({ name, code, type });
            setShowCreateModal(false);
            resetForm();
            await loadOrganizations();
        } catch (error) {
            console.error('Failed to create organization', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEditClick = (org: Organization) => {
        setSelectedOrg(org);
        setName(org.name);
        setCode(org.code);
        setType(org.type);
        setIsActive(org.isActive);
        setShowEditModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrg) return;
        try {
            setSubmitLoading(true);
            await api.organizations.update(selectedOrg.id, { name, isActive });
            setShowEditModal(false);
            resetForm();
            await loadOrganizations();
        } catch (error) {
            console.error('Failed to update organization', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this organization? This action will suspend access for all associated users.')) return;
        try {
            setSubmitLoading(true);
            await api.organizations.deactivate(id);
            await loadOrganizations();
        } catch (error) {
            console.error('Failed to deactivate organization', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setCode('');
        setType('ENTITY');
        setSelectedOrg(null);
    };

    return (
        <div className="space-y-8 pb-20 selection:bg-orange-100 relative">

            {/* Compact Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Organizations</h1>
                    <p className="text-slate-500 font-medium text-sm">Manage system-wide <span className="text-slate-900">business entities</span> and structures.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden lg:block group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search entities..."
                            className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 w-64 shadow-sm transition-all placeholder-slate-400"
                        />
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 h-10 shadow-lg shadow-orange-600/20 border-none transition-all font-bold tracking-tight text-xs flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Organization
                    </Button>
                </div>
            </div>

            {/* Compact Table Card */}
            <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs w-[30%]">Organization</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs w-[15%]">Code</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs w-[20%]">Type</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs w-[15%]">Status</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-right w-[20%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-8 h-8 bg-slate-50 rounded-lg" />
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-4 bg-slate-50 rounded-full w-1/4" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : organizations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center max-w-xs mx-auto space-y-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <Network className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold text-slate-900">No Organizations</h3>
                                                <p className="text-slate-400 font-medium text-xs">There are no business entities currently active.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : organizations.map((org) => (
                                <tr key={org.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all border
                                                ${org.type === 'PARENT'
                                                    ? 'bg-orange-50 text-orange-600 border-orange-100'
                                                    : 'bg-white text-slate-400 border-slate-100'}`}>
                                                {org.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm mb-0.5 group-hover:text-orange-600 transition-colors">{org.name}</div>
                                                {org.parent ? (
                                                    <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                                        <Layers className="w-3 h-3" />
                                                        Sub of {org.parent.name}
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />
                                                        Top Level
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                            {org.code}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge className={`shadow-sm font-bold uppercase tracking-wider text-[9px] px-2.5 py-1 rounded-lg border
                                            ${org.type === 'PARENT'
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-500 border-slate-100'}`}>
                                            {org.type === 'PARENT' ? 'Parent Company' : 'Subsidiary'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {org.isActive ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[11px] font-bold text-emerald-600">Active</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 opacity-50">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                <span className="text-[11px] font-bold text-slate-500">Inactive</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-100 transition-all duration-200">
                                            <Button
                                                onClick={() => { setSelectedOrg(org); setShowViewModal(true); }}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                onClick={() => handleEditClick(org)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                onClick={() => handleDelete(org.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <Card className="w-full max-w-lg bg-white border-transparent shadow-2xl rounded-2xl overflow-hidden p-0">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Create Organization</h3>
                            <p className="text-slate-500 text-sm">Register a new business entity.</p>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Name</label>
                                    <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Code</label>
                                        <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-bold uppercase focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all tracking-wide text-sm" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ACME" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Type</label>
                                        <div className="relative">
                                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all appearance-none font-medium text-sm relative z-10" value={type} onChange={(e) => setType(e.target.value as 'PARENT' | 'ENTITY')}>
                                                <option value="ENTITY">SUBSIDIARY</option>
                                                <option value="PARENT">PARENT COMPANY</option>
                                            </select>
                                            <MoreVertical className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-0" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-slate-500 hover:text-slate-900 font-bold text-xs">Cancel</Button>
                                <Button type="submit" disabled={submitLoading || !name || !code} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 h-10 shadow-lg shadow-orange-600/20 text-xs font-bold tracking-wide">
                                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Entity'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <Card className="w-full max-w-lg bg-white border-transparent shadow-2xl rounded-2xl overflow-hidden p-0">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Edit Organization</h3>
                            <p className="text-slate-500 text-sm">Update details for {selectedOrg?.name}.</p>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Name</label>
                                    <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Status</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Suspend operations.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsActive(!isActive)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-300 ${isActive ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={() => { setShowEditModal(false); resetForm(); }} className="text-slate-500 hover:text-slate-900 font-bold text-xs">Cancel</Button>
                                <Button type="submit" disabled={submitLoading || !name} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 h-10 shadow-lg text-xs font-bold tracking-wide">
                                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && selectedOrg && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <Card className="w-full max-w-lg bg-white border-transparent shadow-2xl rounded-2xl overflow-hidden p-0">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Entity Details</h3>
                            <p className="text-slate-500 text-sm">Overview for {selectedOrg.name}.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Entity Code</p>
                                    <p className="font-bold text-slate-900">{selectedOrg.code}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</p>
                                    <p className="font-bold text-slate-900">{selectedOrg.type}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created On</p>
                                    <p className="font-medium text-slate-900 text-sm">{new Date(selectedOrg.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">System ID</p>
                                    <p className="font-mono text-[10px] text-slate-600 truncate">{selectedOrg.id}</p>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button onClick={() => { setShowViewModal(false); setSelectedOrg(null); }} className="bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl px-6 h-10 font-bold text-xs">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
