'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Card, Button, Badge, Spinner } from '@repo/ui';
import { Pagination } from '@/components/ui/pagination';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import {
    Search,
    Loader2,
    UserPlus,
    Mail,
    ArrowRight,
    MoreHorizontal,
    Fingerprint,
    Globe,
    Ghost,
    AlertCircle,
    Edit3,
    Check
} from 'lucide-react';

export default function UsersPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [organizations, setOrganizations] = useState<any[]>([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [roleId, setRoleId] = useState('');
    const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            loadData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        loadData();
    }, [page]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersResponse, rolesData, orgsData] = await Promise.all([
                api.users.list({ page, limit: 10, search: searchQuery }),
                api.roles.list().catch(() => []),
                api.organizations.list().catch(() => [])
            ]);

            setUsers(usersResponse.data);
            setMeta(usersResponse.meta);

            // Handle potentially paginated or array response for dropdowns
            // Ideally we should validte if it has .data or is array
            const rolesList = (rolesData as any).data || rolesData;
            const orgsList = (orgsData as any).data || orgsData; // Just in case I revert api-client or it behaves differently

            setRoles(Array.isArray(rolesList) ? rolesList : []);
            setOrganizations(Array.isArray(orgsList) ? orgsList : []);

            if (Array.isArray(rolesList) && rolesList.length > 0 && !roleId) {
                setRoleId(rolesList[0].id);
            }
        } catch (error) {
            console.error('Failed to load users data', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users; // Server side filtered

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitLoading(true);
            await api.users.invite({ email, name, roleId, organizationIds: selectedOrgIds });
            setShowInviteModal(false);
            resetForm();
            await loadData();
            toast.success('User Invited', `${name} has been added to the system.`);
        } catch (error) {
            toast.error('Invite Failed', 'Could not send invitation.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEditClick = (u: any) => {
        setSelectedUser(u);
        setName(u.name);
        setEmail(u.email);
        setRoleId(roles.find(r => r.name === u.role)?.id || '');
        setSelectedOrgIds(u.organizations?.map((o: any) => o.id) || []);
        setShowEditModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            setSubmitLoading(true);
            await api.users.update(selectedUser.id, {
                name,
                email,
                roleId,
                organizationIds: selectedOrgIds
            });
            setShowEditModal(false);
            resetForm();
            await loadData();
            toast.success('User Updated', 'User details saved successfully.');
        } catch (error) {
            toast.error('Update Failed', 'Could not save changes.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setName('');
        setSelectedOrgIds([]);
        if (roles.length > 0) setRoleId(roles[0].id);
        setSelectedUser(null);
    };

    const toggleOrg = (id: string) => {
        setSelectedOrgIds(prev =>
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    const getRoleColor = (roleName: string) => {
        const name = roleName.toLowerCase();
        if (name.includes('admin')) return 'bg-rose-50 text-rose-600 border-rose-100';
        if (name.includes('viewer')) return 'bg-slate-50 text-slate-500 border-slate-100';
        return 'bg-blue-50 text-blue-600 border-blue-100';
    };

    const UserForm = ({ onSubmit, buttonLabel }: any) => (
        <form onSubmit={onSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                        <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                        <input required type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Role</label>
                        <div className="relative">
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all appearance-none font-medium text-sm relative z-10" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>)}
                            </select>
                            <MoreHorizontal className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-0" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Organizations</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                            {organizations.map(org => (
                                <div
                                    key={org.id}
                                    onClick={() => toggleOrg(org.id)}
                                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all border-b border-slate-100 last:border-0 ${selectedOrgIds.includes(org.id) ? 'bg-orange-50 text-orange-700' : 'hover:bg-slate-100 text-slate-600'}`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wide">{org.name}</span>
                                    {selectedOrgIds.includes(org.id) && <Check className="w-3.5 h-3.5" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-blue-700 leading-relaxed">
                    Users will receive an email invitation to set their password. Access is granted immediately upon creation to selected organizations.
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => { setShowInviteModal(false); setShowEditModal(false); resetForm(); }} className="text-slate-500 hover:text-slate-900 font-bold text-xs">Cancel</Button>
                <Button type="submit" disabled={submitLoading} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 h-10 shadow-lg shadow-orange-600/20 text-xs font-bold tracking-wide flex items-center gap-2">
                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{buttonLabel} <ArrowRight className="w-3.5 h-3.5" /></>}
                </Button>
            </div>
        </form>
    );

    return (
        <div className="space-y-8 pb-20 selection:bg-orange-100 text-slate-900 font-sans relative">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Directory</h1>
                    <p className="text-slate-500 font-medium text-sm">Manage system access and <span className="text-slate-900">user identities</span>.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden lg:block group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 w-64 shadow-sm transition-all placeholder-slate-400"
                        />
                    </div>
                    <Button onClick={() => setShowInviteModal(true)} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 h-10 shadow-lg shadow-orange-600/20 border-none transition-all font-bold tracking-tight text-xs flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Invite User
                    </Button>
                </div>
            </div>

            <Card className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-left w-[30%]">User</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-left w-[20%]">Role</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-left w-[25%]">Organizations</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-left w-[15%]">Status</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-xs text-right w-[10%]">Actions</th>
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
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center max-w-xs mx-auto space-y-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <Ghost className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold text-slate-900">No Users Found</h3>
                                                <p className="text-slate-400 font-medium text-xs">Try adjusting your search terms.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-sm border border-orange-100">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm mb-0.5 group-hover:text-orange-600 transition-colors">{u.name}</div>
                                                <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                    {u.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase tracking-wide ${getRoleColor(u.role)}`}>
                                            <Fingerprint className="w-3 h-3 opacity-60" />
                                            {u.role}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {u.organizations?.slice(0, 2).map((org: any) => (
                                                <span key={org.id} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-500 border border-slate-200 uppercase tracking-wide">
                                                    {org.code}
                                                </span>
                                            ))}
                                            {u.organizations?.length > 2 && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200 uppercase tracking-wide">
                                                    +{u.organizations.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.isActive ? (
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
                                        <Button
                                            onClick={() => handleEditClick(u)}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current User: {user?.name}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Globe className="w-3 h-3" /> System Online
                    </div>
                </div>
            </Card>

            {meta && (
                <Pagination
                    meta={meta}
                    onPageChange={setPage}
                    isLoading={loading}
                />
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <Card className="w-full max-w-lg bg-white border-transparent shadow-2xl rounded-2xl overflow-hidden p-0">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Invite User</h3>
                            <p className="text-slate-500 text-sm">Add a new user to the organization.</p>
                        </div>
                        <UserForm onSubmit={handleInvite} buttonLabel="Send Invite" />
                    </Card>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <Card className="w-full max-w-lg bg-white border-transparent shadow-2xl rounded-2xl overflow-hidden p-0">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Edit User</h3>
                            <p className="text-slate-500 text-sm">Update details for {selectedUser?.name}.</p>
                        </div>
                        <UserForm onSubmit={handleUpdate} buttonLabel="Update User" />
                    </Card>
                </div>
            )}
        </div>
    );
}
