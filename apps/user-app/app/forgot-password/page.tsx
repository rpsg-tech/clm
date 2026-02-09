'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email) return;
        setSubmitted(true);
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
            {/* Left panel (60%) */}
            <div className="relative hidden lg:flex w-[60%] bg-[#3730A3] flex-col justify-between p-16 overflow-hidden">
                <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                            <MaterialIcon name="grid_view" size={24} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-wide text-white leading-none">CLM</span>
                            <span className="text-xs font-medium text-indigo-200 uppercase tracking-widest mt-1">Enterprise Platform</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10 my-12 flex flex-col gap-10 lg:my-0">
                    <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl">
                        Secure Enterprise<br />Access Control
                    </h1>
                    <div className="flex flex-col gap-8">
                        <div className="flex items-start gap-5 group">
                            <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 transition-colors group-hover:bg-white/20">
                                <MaterialIcon name="lock_person" size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Secure Identity</h3>
                                <p className="text-indigo-200 leading-relaxed max-w-sm">Enterprise-grade encryption protecting all your sensitive credentials and user data.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-5 group">
                            <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 transition-colors group-hover:bg-white/20">
                                <MaterialIcon name="verified_user" size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Audit Ready</h3>
                                <p className="text-indigo-200 leading-relaxed max-w-sm">Full audit trails and compliance logging for every action taken within the system.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 flex flex-wrap items-center gap-6 text-indigo-300/80">
                    <span className="text-xs font-medium uppercase tracking-wider">© 2026 CLM Enterprise</span>
                </div>
            </div>

            {/* Right panel (40%) */}
            <div className="flex w-full flex-col bg-white lg:w-[40%] relative">
                <div className="flex h-full flex-col justify-center px-6 py-12 sm:px-12 xl:px-24">
                    <Link
                        href="/login"
                        className="group mb-10 flex w-fit items-center gap-2 text-sm font-semibold text-neutral-500 transition-colors hover:text-indigo-700"
                    >
                        <MaterialIcon name="arrow_back" size={20} className="transition-transform group-hover:-translate-x-1" />
                        Back to Login
                    </Link>

                    <div className="mb-4">
                        <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Reset Your Password</h2>
                        <p className="mt-3 text-base leading-relaxed text-neutral-600">
                            Enter the email address associated with your account and we will send you a link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className="text-sm font-bold text-neutral-900">Email Address</label>
                            <div className="relative group">
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="peer h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 pl-11 text-base text-neutral-900 placeholder-neutral-400 outline-none transition-all focus:border-indigo-700 focus:ring-1 focus:ring-indigo-700"
                                />
                                <MaterialIcon
                                    name="mail"
                                    size={20}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors peer-focus:text-indigo-700"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-indigo-700 px-6 font-bold text-white shadow-lg shadow-indigo-700/25 transition-all hover:bg-indigo-800 hover:shadow-indigo-700/40 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2"
                        >
                            Send Reset Link
                        </button>
                    </form>

                    {/* Success state */}
                    {submitted && (
                        <div className="mt-12 rounded-xl border border-green-200 bg-green-50/50 p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                                    <MaterialIcon name="check_circle" size={24} className="text-green-600" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-green-800">Check your email</h4>
                                    <p className="mt-1 text-sm leading-relaxed text-green-700">
                                        We have sent a password recovery link to <strong className="text-green-900">{email}</strong>. Please check your inbox and spam folder.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
