"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck } from "lucide-react";

export default function Logout() {
    const router = useRouter();

    useEffect(() => {
        localStorage.removeItem("pawsport_token");
        sessionStorage.clear();
        localStorage.removeItem("user_role"); 

        // Redirect as soon as cleanup is complete; avoid fixed waiting time.
        router.replace('/signin');
    }, [router]);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
            {/* SPINNER */}
            <div className="relative mb-8">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-teal-600/20">
                    <ShieldCheck size={24} />
                </div>
            </div>

            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Logging you out...</h1>
            <p className="text-slate-500 mt-2 font-medium">Securing your account and evidence logs.</p>
            
            {/* DATA PRIVACY VISUAL CONFIRMATION */}
            <div className="mt-10 px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5 shadow-sm">
                <div className="flex items-center justify-center text-teal-600">
                    <Lock size={14} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none pt-px">
                    Session Data Encrypted & Cleared
                </span>
            </div>
        </div>
    );
}