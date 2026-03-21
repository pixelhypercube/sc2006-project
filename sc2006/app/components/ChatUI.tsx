"use client"
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MessageCircle, ChevronLeft, Send } from "lucide-react";

type Message = {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    sender: { id: string; name: string; avatar: string | null };
};

type Conversation = {
    id: string;
    name: string;
    initial: string;
    avatar: string | null;
    otherId: string;
    lastMessage: string;
    date: string;
    status: string;
};

export default function ChatUI() {
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Get current user
    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (data.user?.id) setCurrentUserId(data.user.id);
            })
            .catch(() => {});
    }, []);

    // Fetch all conversations
    useEffect(() => {
        setLoadingConvos(true);
        fetch("/api/chats")
            .then((r) => r.json())
            .then((data) => {
                if (data.conversations) {
                    setConversations(data.conversations);
                    // Auto-select from URL param or first conversation
                    const paramId = searchParams.get("bookingId");
                    if (paramId) {
                        setActiveChat(paramId);
                    } else if (data.conversations.length > 0) {
                        setActiveChat(data.conversations[0].id);
                    }
                }
            })
            .catch(() => {})
            .finally(() => setLoadingConvos(false));
    }, []);

    // Update activeConvo when activeChat or conversations change
    useEffect(() => {
        setActiveConvo(conversations.find((c) => c.id === activeChat) ?? null);
    }, [activeChat, conversations]);

    // Fetch messages when activeChat changes
    useEffect(() => {
        if (!activeChat) {
            setMessages([]);
            return;
        }
        setLoadingMessages(true);
        fetch(`/api/messages?bookingId=${activeChat}`)
            .then((r) => r.json())
            .then((data) => setMessages(data.messages ?? []))
            .catch(() => setMessages([]))
            .finally(() => setLoadingMessages(false));
    }, [activeChat]);

    // Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage() {
        if (!newMessage.trim() || !activeChat || !activeConvo) return;

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId: activeChat,
                    receiverId: activeConvo.otherId,
                    content: newMessage.trim(),
                }),
            });
            const data = await res.json();
            if (data.message) {
                setMessages((prev) => [...prev, data.message]);
                setNewMessage("");
                // Update last message in conversation list
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === activeChat
                            ? { ...c, lastMessage: newMessage.trim(), date: "Now" }
                            : c
                    )
                );
            }
        } catch {
            alert("Failed to send message");
        }
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    const filtered = conversations.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex bg-slate-50 border-t border-gray-100" style={{ height: "calc(100vh - 64px)" }}>

            {/* LEFT SIDEBAR */}
            <div className={`${activeChat ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 bg-white border-r border-gray-100 flex-col shrink-0`}>
                <div className="p-6 pb-4">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">Messages</h2>
                    <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-500">
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingConvos ? (
                        <p className="text-slate-400 text-center text-sm font-medium p-6">Loading...</p>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-3">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                <MessageCircle size={24} />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest">No conversations</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {filtered.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => setActiveChat(chat.id)}
                                    className={`flex items-center gap-3 p-4 border-l-4 text-left transition-all ${
                                        activeChat === chat.id
                                            ? "bg-teal-50/50 border-teal-500"
                                            : "border-transparent hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="w-11 h-11 rounded-2xl bg-teal-500 flex items-center justify-center text-white font-black shrink-0 shadow-sm">
                                        {chat.initial}
                                    </div>
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <p className="text-md font-bold text-slate-900 truncate pr-2 leading-none">{chat.name}</p>
                                            <span className="text-xs font-bold text-slate-400 shrink-0 uppercase tracking-tighter">{chat.date}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 truncate font-medium">{chat.lastMessage || "No messages yet"}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: CHAT AREA */}
            <div className={`${!activeChat ? "hidden md:flex" : "flex"} flex-1 flex-col bg-[#F8FAFC]`}>
                {activeChat && activeConvo ? (
                    <>
                        {/* HEADER */}
                        <div className="bg-white px-4 md:px-6 py-4 border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
                            <button
                                onClick={() => setActiveChat(null)}
                                className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-white font-black text-xs shadow-sm shadow-teal-500/20">
                                {activeConvo.initial}
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm truncate pr-4 leading-none pt-px">
                                {activeConvo.name}
                            </h3>
                        </div>

                        {/* MESSAGES */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
                            {loadingMessages ? (
                                <p className="text-slate-400 text-center text-sm">Loading messages...</p>
                            ) : messages.length === 0 ? (
                                <p className="text-slate-400 text-center text-sm">No messages yet. Say hello!</p>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId === currentUserId;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[85%] md:max-w-[70%] px-5 py-3 rounded-2xl shadow-sm ${
                                                isMe
                                                    ? "bg-teal-600 text-white rounded-tr-sm"
                                                    : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
                                            }`}>
                                                <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                                                <p className={`text-xs mt-2 font-bold uppercase tracking-tighter opacity-70 ${isMe ? "text-right" : "text-slate-400"}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* INPUT */}
                        <div className="p-4 bg-white border-t border-slate-100 pb-8 md:pb-6">
                            <div className="flex items-center gap-3 max-w-4xl mx-auto w-full">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={onKeyDown}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-medium"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="w-12 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-teal-600/20 shrink-0 active:scale-95"
                                >
                                    <Send size={18} className="ml-0.5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-4">
                        <div className="w-20 h-20 bg-white border border-slate-100 rounded-4xl flex items-center justify-center shadow-sm">
                            <MessageCircle size={32} strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select a conversation</p>
                    </div>
                )}
            </div>
        </div>
    );
}
