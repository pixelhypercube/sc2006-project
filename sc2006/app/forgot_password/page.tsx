"use client"
import { useState } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isSent, setIsSent] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    async function send(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!email) {
            setErrorMsg("Please enter an email address.");
            return;
        }

        try {
            
            const res = await fetch("/api/", { // set API to forgot password
                method:"POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({email})
            }); 

            const data = res.json();
            
            if (res.ok) {
                setIsSent(true);
            } else {

            }
        } catch (err) {
            console.error("Error", err);
            setErrorMsg(`An unexpected error occurred. Please try again later.`);
        }
    }
    

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar/>
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Enter your email and we'll send you a recovery link.
                        </p>
                    </div>
                    {errorMsg && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg animate-pulse">
                            {errorMsg}
                        </div>
                    )}
                    {!isSent ? (
                        <form className="space-y-5" onSubmit={(e) => send(e)}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" 
                                    onChange={e => setEmail(e.target.value)} 
                                    placeholder="name@example.com"
                                />
                            </div>
                            <button className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition-shadow shadow-md">
                                Send Recovery Link
                            </button>
                        </form>
                    ) : (
                        <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl text-center">
                            <p className="text-sm text-teal-800 font-medium">Link sent! Check your inbox for further instructions.</p>
                        </div>
                    )}

                    <p className="text-center text-sm text-gray-600 mt-8">
                        Remembered it? <Link href="/signin" className="font-bold text-teal-600 hover:text-teal-700">Back to Sign In</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}