'use client';

import { useState, useEffect } from 'react';
import { Button, Spinner } from '@repo/ui';
import { MoreHorizontal, AlertCircle, Loader2, ArrowRight, Check, Key, Eye, EyeOff } from 'lucide-react';

interface UserFormProps {
    initialData?: {
        name: string;
        email: string;
        roleId: string;
        organizationIds: string[];
    } | null;
    roles: any[];
    organizations: any[];
    onSubmit: (data: any) => Promise<void>;
    isLoading: boolean;
    buttonLabel: string;
    onCancel: () => void;
    isInvite?: boolean;
}

export function UserForm({
    initialData,
    roles,
    organizations,
    onSubmit,
    isLoading,
    buttonLabel,
    onCancel,
    isInvite = false
}: UserFormProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [roleId, setRoleId] = useState(initialData?.roleId || (roles.length > 0 ? roles[0].id : ''));
    const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>(initialData?.organizationIds || []);

    // Password state
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordsMatch, setPasswordsMatch] = useState(true);

    // Update roleId if roles load later
    useEffect(() => {
        if (!roleId && roles.length > 0) {
            setRoleId(roles[0].id);
        }
    }, [roles, roleId]);

    const toggleOrg = (id: string) => {
        setSelectedOrgIds(prev =>
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isInvite && password) {
            if (password !== confirmPassword) {
                setPasswordsMatch(false);
                return;
            }
        }

        await onSubmit({
            name,
            email,
            roleId,
            organizationIds: selectedOrgIds,
            password: isInvite && password ? password : undefined
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                        <input
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                        <input
                            required
                            type="email"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            disabled={!!initialData} // Cannot change email on edit usually
                        />
                    </div>
                </div>

                {isInvite && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                <Key className="w-3 h-3" /> Password <span className="text-slate-400 font-normal lowercase">(optional)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`w-full bg-slate-50 border ${!passwordsMatch ? 'border-red-300 ring-2 ring-red-500/20' : 'border-slate-200'} rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-sm`}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (!passwordsMatch) setPasswordsMatch(true);
                                    }}
                                    placeholder="Set initial password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                className={`w-full bg-slate-50 border ${!passwordsMatch ? 'border-red-300 ring-2 ring-red-500/20' : 'border-slate-200'} rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-sm`}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (!passwordsMatch) setPasswordsMatch(true);
                                }}
                                placeholder="Confirm password"
                                disabled={!password}
                            />
                            {!passwordsMatch && (
                                <p className="text-[10px] text-red-500 font-bold">Passwords do not match</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Role</label>
                        <div className="relative">
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all appearance-none font-medium text-sm relative z-10"
                                value={roleId}
                                onChange={(e) => setRoleId(e.target.value)}
                            >
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
                    Users will receive an email invitation{isInvite && password ? ' with the password you set' : ' to set their password'}. Access is granted immediately upon creation to selected organizations.
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel} className="text-slate-500 hover:text-slate-900 font-bold text-xs">Cancel</Button>
                <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 h-10 shadow-lg shadow-orange-600/20 text-xs font-bold tracking-wide flex items-center gap-2">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{buttonLabel} <ArrowRight className="w-3.5 h-3.5" /></>}
                </Button>
            </div>
        </form>
    );
}
