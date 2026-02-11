'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { User, Bell, Shield, Mail, Building, Camera, Check, LogOut, Settings, Key } from 'lucide-react';

export default function SettingsPage() {
    const { user, currentOrg, logout, role } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');

    const handleSave = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
    };

    return (
        <div className="pb-12 animate-in fade-in duration-700">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                    <Settings className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
                    <p className="text-sm font-medium text-slate-500">
                        Manage your personal profile, notifications, and security preferences.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Sidebar Navigation */}
                <div className="md:col-span-3 space-y-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wide ${activeTab === 'profile'
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        <User className="w-4 h-4" />
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wide ${activeTab === 'notifications'
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        <Bell className="w-4 h-4" />
                        Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wide ${activeTab === 'security'
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        <Shield className="w-4 h-4" />
                        Security
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-9 space-y-5">
                    {activeTab === 'profile' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Profile Card */}
                            <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden p-5 md:p-6">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-50">
                                    <User className="w-4 h-4 text-orange-600" />
                                    <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-center gap-5">
                                        <div className="relative group cursor-pointer">
                                            <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 text-2xl font-black border-2 border-slate-100 shadow-sm transition-transform group-hover:scale-105">
                                                {user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                <Camera className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">Profile Photo</h3>
                                            <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs">
                                                This image will be displayed on your identification badge.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                                            <Input defaultValue={user?.name || ''} className="h-10 rounded-lg border-slate-200 bg-slate-50 font-medium text-slate-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input defaultValue={user?.email || ''} className="h-10 rounded-lg border-slate-200 bg-slate-50 pl-10 font-medium text-slate-500 cursor-not-allowed text-sm" disabled />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Active Organizations</label>
                                        <div className="space-y-2">
                                            {user?.organizations && user.organizations.length > 0 ? (
                                                user.organizations.map((org) => (
                                                    <div key={org.id} className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${currentOrg?.id === org.id ? 'bg-orange-50/50 border-orange-100' : 'bg-white border-slate-100'}`}>
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border ${currentOrg?.id === org.id ? 'bg-white border-orange-100 text-orange-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                            <Building className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-slate-900 text-sm">{org.name}</p>
                                                                {currentOrg?.id === org.id && (
                                                                    <Badge className="bg-orange-100 text-orange-700 border-none font-bold text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                                        Current
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                                                                {org.role || 'Member'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                                                        <Building className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{currentOrg?.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                                                            {role || 'Member'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" className="h-9 px-4 rounded-lg font-bold uppercase text-[10px] tracking-wide text-slate-500 hover:text-slate-900 hover:bg-slate-100">Cancel</Button>
                                <Button onClick={handleSave} disabled={isLoading} className="h-9 px-6 rounded-lg bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wide shadow-sm hover:bg-orange-600 transition-all">
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden p-5 md:p-6">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-50">
                                    <Bell className="w-4 h-4 text-orange-600" />
                                    <h3 className="text-sm font-bold text-slate-900">Email Notifications</h3>
                                </div>

                                <div className="space-y-3.5">
                                    {[
                                        { title: 'Contract Approvals', desc: 'Get notified when a contract needs your approval' },
                                        { title: 'Status Updates', desc: 'Receive updates when your contracts change status' },
                                        { title: 'Comments & Mentions', desc: 'When someone mentions you in a contract discussion' },
                                        { title: 'Weekly Digest', desc: 'A summary of all activity in your workspace' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-2.5">
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                                                <p className="text-xs font-medium text-slate-500 mt-0.5">{item.desc}</p>
                                            </div>
                                            <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-orange-600 cursor-pointer transition-colors">
                                                <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform translate-x-4 shadow-sm" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden p-5 md:p-6">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-50">
                                    <Key className="w-4 h-4 text-orange-600" />
                                    <h3 className="text-sm font-bold text-slate-900">Access Credentials</h3>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Current Password</label>
                                        <Input type="password" className="h-10 rounded-lg border-slate-200 bg-slate-50 font-bold px-4 text-sm" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                                            <Input type="password" className="h-10 rounded-lg border-slate-200 bg-slate-50 font-bold px-4 text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                                            <Input type="password" className="h-10 rounded-lg border-slate-200 bg-slate-50 font-bold px-4 text-sm" />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button onClick={handleSave} disabled={isLoading} className="h-9 px-6 rounded-lg bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wide shadow-sm hover:bg-orange-600 transition-all">
                                            Change Password
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-white border border-rose-100 shadow-sm rounded-xl overflow-hidden p-5 md:p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Shield className="w-4 h-4 text-rose-600" />
                                    <h3 className="text-sm font-bold text-rose-600">Danger Zone</h3>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-medium text-slate-500">
                                        Sign out of all active sessions across all devices.
                                    </div>
                                    <Button variant="destructive" onClick={logout} className="h-9 px-6 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold uppercase text-[10px] tracking-wide shadow-none border border-rose-100 hover:border-transparent transition-all">
                                        <LogOut className="w-3.5 h-3.5 mr-2" />
                                        Sign Out All Devices
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
