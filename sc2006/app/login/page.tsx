"use client"
import { useState, SubmitEvent } from "react";
import Navbar from "../components/Navbar";

export default function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    function login(
        event:SubmitEvent
    ) {
        event.preventDefault();

        // logic to process login
        console.log(username,password);
        
    }
        
    return (
        <div>
            <Navbar/>
            <main className="text-center">
                <h1 className="mt-20">Sign in to your account</h1>
                <div className="flex justify-center">
                    <form onSubmit={login} className="md:w1/2 lg:w-1/3 p-4 mt-10 border-2 border-gray-500 rounded-2xl">
                        <div className="flex flex-col mb-4">
                            <label className="text-xl text-left">Email / Username</label>
                            <input className="border-gray-400 rounded-lg p-2 bg-gray-900 focus:outline-none" onChange={e=>setUsername(e.target.value)} type="text"/>
                        </div>
                        <div className="flex flex-col mb-4">
                            <label className="text-xl text-left">Password</label>
                            <input className="border-gray-400 rounded-lg p-2 bg-gray-900 focus:outline-none" onChange={e=>setPassword(e.target.value)} type="password"/>
                        </div>
                        <hr/>
                        <div className="flex flex-col mt-4">
                            <input className="p-2 bg-emerald-800 rounded-lg" type="submit"/>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}