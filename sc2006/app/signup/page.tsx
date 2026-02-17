"use client"
import { useState, SubmitEvent, useRef, ChangeEvent, KeyboardEvent } from "react";
import Navbar from "../components/Navbar";

export default function Login() {

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // DIALOG
    const [isDialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState("");
    const [isShaking, setShaking] = useState(false);

    const usernameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    //  SPECIFICALLY FOR PASSWORD
    const [isPwdNumbersPresent, setPwdNumbersPresent] = useState(false);
    const [isPwdUppercasePresent, setPwdUppercasePresent] = useState(false);
    const [isPwdLowercasePresent, setPwdLowercasePresent] = useState(false);
    const [isPwdSymbolsPresent, setPwdSymbolsPresent] = useState(false);

    function changePasswordHandler(
        event: ChangeEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>
    ) {
        setPassword(event.currentTarget.value);
        validatePassword(password);
    }

    const dialogVisibilityCooldown = 2000;

    function validatePassword(password: string) {
        const numbersRegex = /\d/g;
        const uppercaseRegex = /[A-Z]/g;
        const lowercaseRegex = /[a-z]/g;
        const symbolsRegex = /[^a-zA-Z0-9]/g;
        
        setPwdNumbersPresent(numbersRegex.test(password));
        setPwdUppercasePresent(uppercaseRegex.test(password));
        setPwdLowercasePresent(lowercaseRegex.test(password));
        setPwdSymbolsPresent(symbolsRegex.test(password));

        return isPwdNumbersPresent && isPwdUppercasePresent && isPwdLowercasePresent && isPwdSymbolsPresent;
    }

    function signup(
        event:SubmitEvent
    ) {
        event.preventDefault();

        // logic to process login
        if (!validatePassword(password)) {
            setDialogVisible(true);
            setDialogMessage("Password doesn't meet the requirements!");
            setShaking(true);
            setTimeout(()=>{
                setShaking(false);
                setDialogVisible(false);
            },dialogVisibilityCooldown);
        }
        if (confirmPassword != password) {
            setDialogVisible(true);
            setDialogMessage("Passwords don't match!");
            setTimeout(()=>{
                setShaking(true);
                setDialogVisible(false);
            },dialogVisibilityCooldown);
        }

        
    }
        
    return (
        <div>
            <Navbar/>
            <main className="text-center flex flex-col lg:flex-row">
                {/* LEFT SIDE */}
                <div className="lg:w-2/5 align-middle flex flex-col justify-center">
                    <h1 className="mt-20 text-6xl font-semibold">Create a new account</h1>
                </div>
                {/* RIGHT SIDE */}
                <div className="lg:w-3/5 flex justify-center">
                    <form onSubmit={signup} className="p-20 mt-10 w-full">
                        <div className="flex flex-col mb-4">
                            <label className="text-xl text-left">Email</label>
                            <input ref={emailRef} className="border-gray-400 rounded-lg p-2 bg-surface shadow-xl focus:outline-none" onChange={e=>setEmail(e.target.value)} type="email"/>
                        </div>
                        <div className="flex flex-col mb-4">
                            <label className="text-xl text-left">Username</label>
                            <input ref={usernameRef} className="border-gray-400 rounded-lg p-2  bg-surface shadow-xl focus:outline-none" onChange={e=>setUsername(e.target.value)} type="text"/>
                        </div>
                        <div className="flex flex-col mb-4">
                            <label className="text-xl text-left">Password</label>
                            <input ref={passwordRef} className="border-gray-400 rounded-lg p-2  bg-surface shadow-xl focus:outline-none" onKeyUp={e=>changePasswordHandler(e)} onChange={e=>changePasswordHandler(e)} type="password"/>
                            <small className="text-left text-amber-700 mt-3 text-md"><strong><u>* Password must meet the following requirements:</u></strong>
                                <ul>
                                    <li className={`${password.length>=8 ? "text-emerald-500" : "text-amber-700"}`}>8 characters minimum {password.length>=8 ? "✓" : ""}</li>
                                    <li className={`${isPwdUppercasePresent ? "text-emerald-500" : "text-amber-700"}`}>Uppercase letters {isPwdUppercasePresent ? "✓" : ""}</li>
                                    <li className={`${isPwdLowercasePresent ? "text-emerald-500" : "text-amber-700"}`}>Lowercase letters {isPwdLowercasePresent ? "✓" : ""}</li>
                                    <li className={`${isPwdNumbersPresent ? "text-emerald-500" : "text-amber-700"}`}>Numbers {isPwdNumbersPresent ? "✓" : ""}</li>
                                    <li className={`${isPwdSymbolsPresent ? "text-emerald-500" : "text-amber-700"}`}>Symbols (e.g. ! @ # $ %) {isPwdSymbolsPresent ? "✓" : ""}</li>
                                </ul>
                            </small>
                        </div>
                        <div className="flex flex-col mb-4">
                            <label className="text-xl text-left">Confirm Password</label>
                            <input ref={confirmPasswordRef} className="border-gray-400 rounded-lg p-2 b bg-surface shadow-xl focus:outline-none" onChange={e=>setConfirmPassword(e.target.value)} type="password"/>
                            <button></button>
                        </div>
                        <hr className="border-gray-400" />
                        <div className="flex flex-col mt-4">
                            <input className="p-2 bg-secondary rounded-lg" type="submit"/>
                            <p className="mt-5">Already on Pawsport & Pair? <a href="/login">Sign in</a></p>
                        </div>
                        <div className="flex flex-col mt-4">
                            <div 
                            className={`${isShaking ? "animate-shake" : ""} bg-red-800 rounded-xl text-center p-4 ${isDialogVisible ? "visible" : "invisible"}`}>
                                <p>{dialogMessage}</p>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}