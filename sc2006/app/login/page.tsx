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

        // INVALID INPUT
        if (!username) {
            alert("Username/Email not filled!");
            return;
        }
        if (!password) {
            alert("Password not filed!");
            return;
        }
        // logic to process login
        console.log(username,password);

        // detect whether it's username or email

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        let isEmail = emailRegex.test(username);
        
        // API to process login info
    }
        
    return (
        <div>
            <Navbar/>
            <main className="text-center">
                <h1 className="mt-30 text-6xl font-bold">Sign in to your account</h1>
                <div className="flex justify-center">
                    <form onSubmit={login} className="md:w-2/3 lg:w-1/2 p-4 mt-10">
                        <div className="flex flex-col mb-4">
                            <label htmlFor="username" className="text-xl text-left">Email / Username</label>
                            <input id="username" className="border-gray-400 rounded-lg p-2 bg-surface shadow-xl focus:outline-none" onChange={e=>setUsername(e.target.value)} type="text"/>
                        </div>
                        <div className="flex flex-col mb-4">
                            <label htmlFor="password" className="text-xl text-left">Password</label>
                            <input id="password" className="border-gray-400 rounded-lg p-2 bg-surface shadow-xl focus:outline-none" onChange={e=>setPassword(e.target.value)} type="password"/>
                        </div>
                        <div className="flex mb-4">
                            <input id="remember-me" className="mr-2" type="checkbox" placeholder="Remember Me"/>
                            <label htmlFor="remember-me">Remember Me</label>
                        </div>
                        <hr/>
                        <div className="flex flex-col mt-4">
                            <input className="p-2 bg-secondary rounded-lg" type="submit"/>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}