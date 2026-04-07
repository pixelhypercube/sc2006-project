/**
 * ChatUI Component with Payment Integration
 * 
 * Message Types:
 * - "text": Regular chat messages
 * - "payment_request": Payment request messages (owner sees Pay button, caregiver sees Awaiting status)
 * 
 * LOCAL DEBUG MODE:
 * Set USE_LOCAL_DEBUG = true to use mock data for testing
 * Set USE_LOCAL_DEBUG = false to use real backend API
 */

"use client"
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MessageCircle, ChevronLeft, Send, Paperclip, FileIcon, Download, CreditCard, CheckCircle, Clock, Dog, X, Wallet, QrCode, Smartphone, Star } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { decodePaymentRequestContent, summarizePaymentRequest, PaymentRequestPayload } from "../lib/paymentRequestMessage";

// Local debug mode for this component only
const USE_LOCAL_DEBUG = false;

type Message = {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    sender: { id: string; name: string; avatar: string | null };
    attachmentUrl: string | null;
    attachmentName: string | null;
    attachmentType: string | null;
    type?: "text" | "payment_request";
    // For payment_request type messages
    paymentData?: PaymentRequestPayload;
};

function hydrateMessage(rawMessage: Message): Message {
    const paymentData = decodePaymentRequestContent(rawMessage.content);

    if (!paymentData) {
        return { ...rawMessage, type: rawMessage.type ?? "text" };
    }

    return {
        ...rawMessage,
        type: "payment_request",
        content: summarizePaymentRequest(paymentData),
        paymentData,
    };
}

type Conversation = {
    id: string;
    name: string;
    initial: string;
    avatar: string | null;
    otherId: string;
    lastMessage: string;
    date: string;
    role: "OWNER" | "CAREGIVER";
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUserRole, setCurrentUserRole] = useState<"OWNER" | "CAREGIVER" | null>(null);
    const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"paynow" | "card">("paynow");
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentStep, setPaymentStep] = useState<"select" | "pay" | "processing" | "complete">("select");
    const [pendingPaymentMsg, setPendingPaymentMsg] = useState<{id: string; data: NonNullable<Message['paymentData']> } | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const { fireToast } = useToast();

    // Get current user
    useEffect(() => {
        if (USE_LOCAL_DEBUG) {
            // Use mock user for testing (default to OWNER role)
            setCurrentUserId("user-owner-001");
            setCurrentUserRole("OWNER");
            return;
        }
        
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (data.user?.id) {
                    setCurrentUserId(data.user.id);
                    setCurrentUserRole(data.user.role);
                }
            })
            .catch(() => {});
    }, []);

    // SSE for real-time message updates
    useEffect(() => {
        if (!activeChat || !currentUserId) return;

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const sseUrl = `/api/messages/stream?userId=${currentUserId}&chatId=${activeChat}`;
        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'message' && data.data) {
                    const newMsg = hydrateMessage(data.data as Message);
                    setMessages((prev) => {
                        if (prev.find((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    setConversations((prev) =>
                        prev.map((c) =>
                            c.id === activeChat
                                ? { ...c, lastMessage: newMsg.content, date: "Now" }
                                : c
                        )
                    );
                }
            } catch (err) {
                console.error('Error parsing SSE message:', err);
            }
        };

        eventSource.onerror = () => {
            console.log('SSE connection error, reconnecting...');
        };

        return () => {
            eventSource.close();
            eventSourceRef.current = null;
        };
    }, [activeChat, currentUserId]);

    // Fetch all conversations
    useEffect(() => {
        setLoadingConvos(true);
        
        if (USE_LOCAL_DEBUG) {
            // Use mock conversations - show conversations where the other party has the opposite role
            const mockConversations: Conversation[] = [
                { id: "booking-001", name: "Sarah Johnson", initial: "SJ", avatar: null, otherId: "user-caregiver-001", lastMessage: "Payment request sent", date: "2 hours ago", role: "CAREGIVER" },
                { id: "booking-002", name: "Emily Davis", initial: "ED", avatar: null, otherId: "user-owner-002", lastMessage: "The booking details look great!", date: "Yesterday", role: "OWNER" },
                { id: "booking-003", name: "James Wilson", initial: "JW", avatar: null, otherId: "user-owner-003", lastMessage: "Payment completed!", date: "3 days ago", role: "OWNER" },
                { id: "booking-004", name: "Lisa Anderson", initial: "LA", avatar: null, otherId: "user-caregiver-002", lastMessage: "Looking forward to next week!", date: "1 week ago", role: "CAREGIVER" },
            ];
            
            // Filter based on current user role (show conversations with opposite role)
            const filtered = mockConversations.filter(c => c.role !== "OWNER");
            setConversations(filtered);
            
            // Auto-select from URL param or first conversation
            const paramId = searchParams.get("chatId") || searchParams.get("bookingId");
            if (paramId) {
                setActiveChat(paramId);
            } else if (filtered.length > 0) {
                setActiveChat(filtered[0].id);
            }
            
            setLoadingConvos(false);
            return;
        }
        
        fetch("/api/chats")
            .then((r) => r.json())
            .then((data) => {
                if (data.conversations) {
                    setConversations(data.conversations);
                    const paramId = searchParams.get("chatId");
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
        
        if (USE_LOCAL_DEBUG) {
            // Mock messages for each booking - including payment request as a message type
            const mockMessagesByBooking: Record<string, Message[]> = {
                "booking-001": [
                    // Regular messages
                    { id: "msg-001", senderId: "user-owner-001", content: "Hi Sarah! Just wanted to check in on Buddy.", createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), sender: { id: "user-owner-001", name: "Michael Chen", avatar: null }, type: "text", attachmentUrl: null, attachmentName: null, attachmentType: null },
                    { id: "msg-002", senderId: "user-caregiver-001", content: "Hi Michael! Buddy is doing great! He had a fun walk in the park this morning.", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), sender: { id: "user-caregiver-001", name: "Sarah Johnson", avatar: null }, type: "text", attachmentUrl: null, attachmentName: null, attachmentType: null },
                    // Payment request message (sent by caregiver)
                    { 
                        id: "payment-msg-001", 
                        senderId: "user-caregiver-001", 
                        content: "Payment request for Buddy's care", 
                        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), 
                        sender: { id: "user-caregiver-001", name: "Sarah Johnson", avatar: null },
                        type: "payment_request",
                        attachmentUrl: null,
                        attachmentName: null,
                        attachmentType: null,
                        paymentData: {
                            amount: 250.00,
                            status: "PENDING",
                            bookingId: "booking-001",
                            petName: "Buddy"
                        }
                    },
                ],
                "booking-003": [
                    // Regular messages
                    { id: "msg-010", senderId: "user-owner-003", content: "Max had such a wonderful time with you!", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), sender: { id: "user-owner-003", name: "James Wilson", avatar: null }, type: "text", attachmentUrl: null, attachmentName: null, attachmentType: null },
                    { id: "msg-011", senderId: "user-caregiver-001", content: "He was such a good boy! We had so much fun at the dog park.", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), sender: { id: "user-caregiver-001", name: "Sarah Johnson", avatar: null }, type: "text", attachmentUrl: null, attachmentName: null, attachmentType: null },
                    // Paid payment request message
                    { 
                        id: "payment-msg-003", 
                        senderId: "user-caregiver-001", 
                        content: "Payment request for Max's care", 
                        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
                        sender: { id: "user-caregiver-001", name: "Sarah Johnson", avatar: null },
                        type: "payment_request",
                        attachmentUrl: null,
                        attachmentName: null,
                        attachmentType: null,
                        paymentData: {
                            amount: 350.00,
                            status: "PAID",
                            bookingId: "booking-003",
                            petName: "Max"
                        }
                    },
                ],
            };
            
            setMessages(mockMessagesByBooking[activeChat] || []);
            setLoadingMessages(false);
            return;
        }
        
        setLoadingMessages(true);
        fetch(`/api/messages?chatId=${activeChat}`)
            .then((r) => r.json())
            .then((data) => setMessages((data.messages ?? []).map(hydrateMessage)))
            .catch(() => setMessages([]))
            .finally(() => setLoadingMessages(false));
    }, [activeChat]);

    // Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Open payment dialog
    function openPaymentDialog(messageId: string, paymentData: NonNullable<Message['paymentData']>) {
        setPendingPaymentMsg({ id: messageId, data: paymentData });
        setShowPaymentDialog(true);
        setSelectedPaymentMethod("paynow");
        setPaymentStep("select");
    }

    // Close payment dialog
    function closePaymentDialog() {
        setShowPaymentDialog(false);
        setPendingPaymentMsg(null);
        setProcessingPayment(false);
        setPaymentStep("select");
    }

    // Handle payment processing (for owners) - with mock support
    async function handlePayment(messageId: string, paymentData: NonNullable<Message['paymentData']>) {
        if (USE_LOCAL_DEBUG) {
            setProcessingPayment(true);
            setPaymentStep("processing");
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update the message to show paid status
            setMessages(prev => prev.map(msg => 
                msg.id === messageId 
                    ? { ...msg, paymentData: { ...msg.paymentData!, status: "PAID" as const } }
                    : msg
            ));
            closePaymentDialog();
            return;
        }
        
        // Real API call
        setProcessingPaymentId(messageId);
        try {
            const res = await fetch("/api/payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId: paymentData.bookingId,
                    messageId: messageId,
                }),
            });
            
            const data = await res.json();
            if (data.success) {
                // Update the message to show paid status
                setMessages(prev => prev.map(msg => 
                    msg.id === messageId 
                        ? { ...msg, paymentData: { ...msg.paymentData!, status: "PAID" as const } }
                        : msg
                ));
                fireToast("success", "Payment Successful", `Your payment of $${paymentData.amount.toFixed(2)} has been processed.`);
                closePaymentDialog();
            } else {
                fireToast("danger", "Payment Failed", data.error ?? "An unknown error occurred.");
            }
        } catch (error) {
            fireToast("danger", "Payment Failed", "A network error occurred. Please try again.");
        } finally {
            setProcessingPaymentId(null);
        }
    }

    async function sendMessage() {
        if ((!newMessage.trim() && !selectedFile) || !activeChat) return;

        if (selectedFile) {
            await sendFileMessage();
            return;
        }

        if (USE_LOCAL_DEBUG) {
            const newMsg: Message = {
                id: `msg-${Date.now()}`,
                senderId: currentUserId || "user-owner-001",
                content: newMessage.trim(),
                createdAt: new Date().toISOString(),
                sender: { id: currentUserId || "user-owner-001", name: "Michael Chen", avatar: null },
                type: "text",
                attachmentUrl: null,
                attachmentName: null,
                attachmentType: null,
            };
            setMessages(prev => [...prev, newMsg]);
            setNewMessage("");
            return;
        }

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chatId: activeChat,
                    content: newMessage.trim(),
                }),
            });
            const data = await res.json();
            if (data.message) {
                setMessages((prev) => [...prev, hydrateMessage(data.message)]);
                setNewMessage("");
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === activeChat
                            ? { ...c, lastMessage: newMessage.trim(), date: "Now" }
                            : c
                    )
                );
            }
        } catch {
            fireToast("danger", "Failed to Send", "Could not send your message. Please try again.");
        }
    }

    async function sendFileMessage() {
        if (!selectedFile || !activeChat) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('chatId', activeChat);
            formData.append('content', newMessage.trim());

            const res = await fetch("/api/messages/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data.message) {
                setMessages((prev) => [...prev, hydrateMessage(data.message)]);
                setNewMessage("");
                setSelectedFile(null);
                setFilePreview(null);
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === activeChat
                            ? { ...c, lastMessage: data.message.attachmentName ? `📎 ${data.message.attachmentName}` : newMessage.trim(), date: "Now" }
                            : c
                    )
                );
            }
        } catch {
            alert("Failed to send file");
        } finally {
            setIsUploading(false);
        }
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert("File size must be less than 10MB");
            return;
        }

        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv',
            'application/zip', 'application/x-zip-compressed',
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("File type not supported");
            return;
        }

        setSelectedFile(file);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function removeSelectedFile() {
        setSelectedFile(null);
        setFilePreview(null);
    }

    function isImage(type: string | null): boolean {
        return type ? type.startsWith('image/') : false;
    }

    function getFileSize(type: string | null): React.ReactNode {
        if (type?.includes('pdf')) return <FileIcon size={20} className="text-red-500" />;
        if (type?.includes('word') || type?.includes('document')) return <FileIcon size={20} className="text-blue-500" />;
        if (type?.includes('excel') || type?.includes('sheet')) return <FileIcon size={20} className="text-green-500" />;
        if (type?.includes('zip')) return <FileIcon size={20} className="text-yellow-500" />;
        return <FileIcon size={20} className="text-slate-400" />;
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
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
                                    
                                    // Render payment request message
                                    if (msg.type === "payment_request" && msg.paymentData) {
                                        const isPending = msg.paymentData.status === "PENDING";
                                        const isOwner = currentUserRole === "OWNER";
                                        const isProcessing = processingPaymentId === msg.id;
                                        
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                                <div className={`max-w-sm w-full rounded-2xl shadow-sm overflow-hidden ${
                                                    isPending 
                                                        ? "bg-amber-50 border-2 border-amber-200" 
                                                        : "bg-emerald-50 border-2 border-emerald-200"
                                                }`}>
                                                    {/* Payment Card Header */}
                                                    <div className="px-4 py-3 flex items-center gap-2 border-b border-amber-100/50">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                            isPending ? "bg-amber-100" : "bg-emerald-100"
                                                        }`}>
                                                            <CreditCard size={16} className={isPending ? "text-amber-600" : "text-emerald-600"} />
                                                        </div>
                                                        <span className={`text-xs font-bold uppercase tracking-wider ${
                                                            isPending ? "text-amber-700" : "text-emerald-700"
                                                        }`}>
                                                            {isPending ? "Payment Request" : "Payment Completed"}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Payment Card Body */}
                                                    <div className="px-4 py-3">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Dog size={14} className="text-slate-500" />
                                                            <span className="text-sm font-bold text-slate-900">{msg.paymentData.petName}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-slate-500">Amount</span>
                                                            <span className="text-lg font-black text-slate-900">${msg.paymentData.amount.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                     {/* Payment Card Footer - Role-based actions */}
                                                     {isPending && isOwner && !isMe && (
                                                         <div className="px-4 py-3 bg-amber-100/50 border-t border-amber-200">
                                                             <button
                                                                 onClick={() => openPaymentDialog(msg.id, msg.paymentData!)}
                                                                 disabled={isProcessing}
                                                                 className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                             >
                                                                 {isProcessing ? (
                                                                     <>
                                                                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                         <span>Processing...</span>
                                                                     </>
                                                                 ) : (
                                                                     <>
                                                                         <Wallet size={14} />
                                                                         <span>Pay Now</span>
                                                                     </>
                                                                 )}
                                                             </button>
                                                         </div>
                                                     )}
                                                    
                                                    {isPending && !isOwner && (
                                                        <div className="px-4 py-3 bg-amber-100/50 border-t border-amber-200">
                                                            <div className="flex items-center justify-center gap-2 text-amber-700">
                                                                <Clock size={14} />
                                                                <span className="text-xs font-bold">Awaiting payment</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {!isPending && (
                                                        <div className="px-4 py-3 bg-emerald-100/50 border-t border-emerald-200">
                                                            <div className="flex items-center justify-center gap-2 text-emerald-700">
                                                                <CheckCircle size={14} />
                                                                <span className="text-xs font-bold">Paid</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // Regular text message
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[85%] md:max-w-[70%] px-5 py-3 rounded-2xl shadow-sm ${
                                                isMe
                                                    ? "bg-teal-600 text-white rounded-tr-sm"
                                                    : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
                                            }`}>
                                                <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                                                {/* Attachment display */}
                                                {msg.attachmentUrl && (
                                                    <div className="mt-2">
                                                        {isImage(msg.attachmentType) ? (
                                                            <button
                                                                onClick={() => setPreviewImage(msg.attachmentUrl!)}
                                                                className="block rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                                                            >
                                                                <img
                                                                    src={msg.attachmentUrl}
                                                                    alt={msg.attachmentName || "Attachment"}
                                                                    className="max-w-full max-h-64 object-cover rounded-lg"
                                                                />
                                                            </button>
                                                        ) : (
                                                            <a
                                                                href={msg.attachmentUrl}
                                                                download={msg.attachmentName || undefined}
                                                                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                                                                    isMe
                                                                        ? "bg-teal-700/50 border-teal-500 hover:bg-teal-700"
                                                                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                                                                }`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {getFileSize(msg.attachmentType)}
                                                                <span className="text-sm font-medium truncate flex-1">{msg.attachmentName}</span>
                                                                <Download size={16} className={isMe ? "opacity-70" : "text-slate-400"} />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
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
                            {/* File preview area */}
                            {selectedFile && (
                                <div className="mb-3 max-w-4xl mx-auto">
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                                        {filePreview ? (
                                            <div className="relative">
                                                <img src={filePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                                                <button
                                                    onClick={removeSelectedFile}
                                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {getFileSize(selectedFile.type)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 truncate">{selectedFile.name}</p>
                                                    <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                                <button
                                                    onClick={removeSelectedFile}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 max-w-4xl mx-auto w-full">
                                {/* File input (hidden) */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                                />
                                
                                {/* Attachment button */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-12 h-12 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl flex items-center justify-center transition-all shrink-0 text-slate-400 hover:text-slate-600"
                                    title="Attach file"
                                >
                                    <Paperclip size={18} />
                                </button>
                                
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={onKeyDown}
                                    disabled={isUploading}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-medium disabled:opacity-50"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={isUploading || (!newMessage.trim() && !selectedFile)}
                                    className="w-12 h-12 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-teal-600/20 shrink-0 active:scale-95 disabled:active:scale-100"
                                >
                                    {isUploading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send size={18} className="ml-0.5" />
                                    )}
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

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Mock Payment Dialog */}
            {showPaymentDialog && pendingPaymentMsg && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Dialog Header */}
                        <div className="bg-amber-500 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Wallet className="text-white" size={20} />
                                </div>
                                <h3 className="text-white font-bold text-lg">Payment</h3>
                            </div>
                            <button
                                onClick={closePaymentDialog}
                                disabled={processingPayment}
                                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                            >
                                <X size={16} className="text-white" />
                            </button>
                        </div>

                        {/* Dialog Body */}
                        <div className="p-6 space-y-6">
                            {/* Payment Amount - Always shown */}
                            <div className="text-center">
                                <p className="text-sm text-slate-500 font-medium mb-1">Payment Amount</p>
                                <p className="text-4xl font-black text-slate-900">${pendingPaymentMsg.data.amount.toFixed(2)}</p>
                                <p className="text-xs text-slate-400 mt-2">For {pendingPaymentMsg.data.petName}'s care</p>
                            </div>

                            {/* Step 1: Payment Method Selection */}
                            {paymentStep === "select" && (
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Select Payment Method</p>
                                        <div className="space-y-3">
                                            {/* PayNow Option */}
                                            <button
                                                onClick={() => setSelectedPaymentMethod("paynow")}
                                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                                    selectedPaymentMethod === "paynow"
                                                        ? "border-amber-500 bg-amber-50"
                                                        : "border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    selectedPaymentMethod === "paynow" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
                                                }`}>
                                                    <QrCode size={24} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="font-bold text-slate-900">PayNow</p>
                                                    <p className="text-xs text-slate-500">Scan QR code with your banking app</p>
                                                </div>
                                                {selectedPaymentMethod === "paynow" && (
                                                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                                        <CheckCircle size={14} className="text-white" />
                                                    </div>
                                                )}
                                            </button>

                                            {/* Card Option */}
                                            <button
                                                onClick={() => setSelectedPaymentMethod("card")}
                                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                                    selectedPaymentMethod === "card"
                                                        ? "border-amber-500 bg-amber-50"
                                                        : "border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    selectedPaymentMethod === "card" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
                                                }`}>
                                                    <CreditCard size={24} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="font-bold text-slate-900">Credit/Debit Card</p>
                                                    <p className="text-xs text-slate-500">Visa, Mastercard, or other cards</p>
                                                </div>
                                                {selectedPaymentMethod === "card" && (
                                                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                                                        <CheckCircle size={14} className="text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Next Button */}
                                    <button
                                        onClick={() => setPaymentStep("pay")}
                                        disabled={processingPayment}
                                        className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white rounded-xl font-bold text-base uppercase tracking-wider transition-all shadow-lg shadow-amber-500/30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <span>Next</span>
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Payment Details */}
                            {paymentStep === "pay" && (
                                <div className="space-y-6">
                                    {/* PayNow QR Code */}
                                    {selectedPaymentMethod === "paynow" && (
                                        <div className="space-y-6">
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Scan to Pay</p>
                                                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 inline-block shadow-sm">
                                                    {/* Generated QR Code Pattern */}
                                                    <div className="w-48 h-48 overflow-hidden flex items-center justify-center">
                                                        <img 
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=paynow-booking-${pendingPaymentMsg.data.bookingId}-${pendingPaymentMsg.data.amount}&margin=0`} 
                                                            alt="Payment QR Code" 
                                                            className="w-full h-full object-contain"
                                                            crossOrigin="anonymous"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-4">
                                                    Open your banking app and scan this QR code
                                                </p>
                                            </div>

                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                                <div className="flex items-start gap-3">
                                                    <Smartphone className="text-amber-600 mt-0.5" size={18} />
                                                    <div className="text-sm">
                                                        <p className="font-bold text-amber-800">PayNow Instructions</p>
                                                        <p className="text-amber-700 mt-1">
                                                            1. Open your bank's mobile app<br/>
                                                            2. Select "Scan & Pay" or "PayNow"<br/>
                                                            3. Scan the QR code above<br/>
                                                            4. Confirm the payment of <strong>${pendingPaymentMsg.data.amount.toFixed(2)}</strong>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Confirm Payment Completion Button */}
                                            <button
                                                onClick={() => handlePayment(pendingPaymentMsg.id, pendingPaymentMsg.data)}
                                                disabled={processingPayment}
                                                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white rounded-xl font-bold text-base uppercase tracking-wider transition-all shadow-lg shadow-amber-500/30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {processingPayment ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        <span>Processing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle size={18} />
                                                        <span>I've Completed the Payment</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Card Payment */}
                                    {selectedPaymentMethod === "card" && (
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">Card Number</label>
                                                    <input
                                                        type="text"
                                                        placeholder="1234 5678 9012 3456"
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                                        defaultValue="4242 4242 4242 4242"
                                                        readOnly
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">Expiry</label>
                                                        <input
                                                            type="text"
                                                            placeholder="MM/YY"
                                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                                            defaultValue="12/28"
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">CVV</label>
                                                        <input
                                                            type="text"
                                                            placeholder="123"
                                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                                            defaultValue="123"
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pay Button */}
                                            <button
                                                onClick={() => handlePayment(pendingPaymentMsg.id, pendingPaymentMsg.data)}
                                                disabled={processingPayment}
                                                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white rounded-xl font-bold text-base uppercase tracking-wider transition-all shadow-lg shadow-amber-500/30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {processingPayment ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        <span>Processing Payment...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wallet size={18} />
                                                        <span>Pay Now</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Back Button */}
                                    <button
                                        onClick={() => setPaymentStep("select")}
                                        className="w-full py-3 text-slate-600 hover:text-slate-800 font-bold text-sm uppercase tracking-wider transition-colors"
                                    >
                                        ← Back to Payment Methods
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Processing View */}
                            {paymentStep === "processing" && (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">Processing Payment</h3>
                                    <p className="text-slate-500">Please wait while we verify your payment...</p>
                                </div>
                            )}

                            {/* Step 3: Complete View */}
                            {paymentStep === "complete" && (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="text-emerald-500" size={40} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">Payment Successful!</h3>
                                    <p className="text-slate-500 mb-4">Thank you for your payment.</p>
                                    <a 
                                        href="/owner/rating" 
                                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-base uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                                    >
                                        <Star size={18} className="fill-white text-white" />
                                        <span>Rate your experience</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}