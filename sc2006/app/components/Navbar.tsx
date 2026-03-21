"use client"
import { useState, useRef, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; 
import { DEBUG_MODE, MOCK_ROLE } from "../lib/debugConfig";
import { useAuth } from "@/hooks/useAuth";
import { 
    Calendar, 
    House, 
    MessageCircle, 
    PawPrint, 
    Search, 
    LayoutDashboard, 
    Inbox, 
    CircleDollarSign, 
    Settings, 
    LogOut, 
    CreditCard,
    X,
    Menu,
    Bell,
    PlayCircle,
    AlertTriangle,
    Shield,
    UserCheck
} from "lucide-react";

const ownerLinks = [
    { name: "Dashboard", href: "/owner", icon: <House size={18}/> },
    { name: "My Pets", href: "/owner/my_pets", icon: <PawPrint size={18}/> }, 
    { name: "Bookings", href: "/owner/my_bookings", icon: <Calendar size={18}/> },
    { name: "Payments", href: "/owner/transactions", icon: <CreditCard size={18}/> },
    { name: "Search Caregivers", href: "/owner/search_caregivers", icon: <Search size={18}/> },
    { name: "Messages", href: "/owner/messages", icon: <MessageCircle size={18}/> }, 
];

const caregiverLinks = [
    { name: "Console", href: "/caregiver", icon: <LayoutDashboard size={18}/> }, 
    { name: "Requests", href: "/caregiver/requests", icon: <Inbox size={18}/> }, 
    { name: "Earnings", href: "/caregiver/transactions", icon: <CircleDollarSign size={18}/> }, 
    { name: "Messages", href: "/caregiver/messages", icon: <MessageCircle size={18}/> }, 
];

const adminLinks = [
    { name: "Admin Home", href: "/admin", icon: <Shield size={18}/> },
    { name: "Verifications", href: "/admin/verified", icon: <UserCheck size={18}/> },
    { name: "Incidents", href: "/admin/incidents", icon: <AlertTriangle size={18}/> }, 
];

const mockNotifications = [
    {
        id: "notif_001",
        role: "OWNER",
        type: "success",
        title: "Booking Accepted!",
        message: "Sarah Chen has accepted your request to watch Max.",
        timestamp: "2 mins ago",
        isRead: false,
        userImgUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", // meant for CAREGIVER profile pic url
        link: "/owner/my_bookings"
    },
    {
        id: "notif_002",
        role: "OWNER",
        type: "action",
        title: "New Update from Jason",
        message: "Jason uploaded a new check-in video for review.",
        timestamp: "1 hour ago",
        isRead: false,
        hasAction: true,
        actionLabel: "Review Evidence",
        // link: "/owner/my_bookings/jason-123"
        link: "/owner/my_bookings"
    },
    {
        id: "notif_003",
        role: "OWNER",
        type: "critical",
        title: "Incident Logged",
        message: "An issue regarding Max's recent check-in has been successfully flagged.",
        timestamp: "Yesterday",
        isRead: true,
        link: "/owner/active_care"
    },
    {
        id: "notif_004",
        role: "CAREGIVER",
        type: "action",
        title: "New Booking Request",
        message: "David Lim sent a request for dog walking on Oct 12.",
        timestamp: "5 mins ago",
        isRead: false,
        hasAction: true,
        actionLabel: "View Request",
        link: "/caregiver/requests"
    }
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter(); 
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // refs
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const mobileNotificationsRef = useRef<HTMLDivElement>(null);

    const isSignedUp = DEBUG_MODE ? MOCK_ROLE !== "GUEST" : user !== null; 
    const currentRole = DEBUG_MODE ? MOCK_ROLE : user?.role;

    // user notification - filters based on role (using MOCK_ROLE for debug)
    const [userNotifications, setUserNotifications] = useState(mockNotifications.filter(notif => notif.role === (user?.role || MOCK_ROLE)));
    
    interface NavLink {
        name: string;
        href: string;
        icon: ReactNode;
    }

    let activeLinks: NavLink[] = [];
    if (isSignedUp) {
        if (currentRole === "OWNER") activeLinks = ownerLinks;
        else if (currentRole === "CAREGIVER") activeLinks = caregiverLinks;
        else if (currentRole === "ADMIN") activeLinks = adminLinks;
    }

    const handleLogout = () => {
        setIsMobileMenuOpen(false);
        setIsProfileDropdownOpen(false);
        logout();
        setIsNotificationsOpen(false);
        router.push("/logout");
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Element;

            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setIsProfileDropdownOpen(false);
            }

            if (target.closest('.notif-toggle-btn')) {
                return;
            }

            const isOutsideDesktop = notificationsRef.current && !notificationsRef.current.contains(target);
            const isOutsideMobileToggle = mobileNotificationsRef.current && !mobileNotificationsRef.current.contains(target);
            const isOutsideMobilePanel = !target.closest('#mobile-notif-panel');

            if (isOutsideDesktop && isOutsideMobileToggle && isOutsideMobilePanel) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    // NOTIFICATIONS LIST
    const NotificationsList = (
        <>
            {userNotifications.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm font-medium">
                    No new notifications
                </div>
            ) : (
                userNotifications.map((notif) => {
                    let containerStyles = "";
                    let titleStyles = "";
                    let iconOrAvatar = null;

                    // 1. Icon/Avatar Logic (Remains the same)
                    if (notif.type === "success") {
                        iconOrAvatar = (
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                {notif.userImgUrl && <img src={notif.userImgUrl} alt="Avatar" className="w-full h-full object-cover" />}
                            </div>
                        );
                    } else if (notif.type === "action") {
                        // UPDATED: Now matches the clean, circular, flat-color UI of the others
                        iconOrAvatar = (
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                                <PlayCircle size={20} />
                            </div>
                        );
                    } else if (notif.type === "critical") {
                        iconOrAvatar = (
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600">
                                <AlertTriangle size={20} />
                            </div>
                        );
                    }

                    // 2. Read vs Unread Styling Logic
                    if (notif.isRead) {
                        // READ STATE: Transparent left border, faded opacity, non-bold text
                        containerStyles = "border-l-4 border-transparent bg-white hover:bg-slate-50 opacity-75";
                        titleStyles = "text-slate-600 font-medium";
                    } else {
                        // UNREAD STATE: Thick left border, tinted background, bold text
                        if (notif.type === "success") containerStyles = "border-l-4 border-teal-500 bg-teal-50/60 hover:bg-teal-50";
                        else if (notif.type === "action") containerStyles = "border-l-4 border-amber-500 bg-amber-50/60 hover:bg-amber-50";
                        else if (notif.type === "critical") containerStyles = "border-l-4 border-red-500 bg-red-50/60 hover:bg-red-50";
                        
                        titleStyles = notif.type === "critical" ? "text-red-700 font-bold" : "text-slate-900 font-bold";
                    }

                    return (
                        <Link 
                            key={notif.id} 
                            href={notif.link}
                            onClick={() => setIsNotificationsOpen(false)}
                            // Removed the conflicting 'border border-transparent' here
                            className={`relative block p-3 mb-1 last:mb-0 rounded-xl cursor-pointer transition-all shadow-sm ${containerStyles}`}
                        >
                            {/* UNREAD DOT INDICATOR */}
                            {!notif.isRead && (
                                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-teal-500 shadow-sm"></span>
                            )}

                            <div className="flex gap-3 items-start pr-4"> {/* Added pr-4 so text doesn't hit the unread dot */}
                                {iconOrAvatar}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${titleStyles}`}>{notif.title}</p>
                                    <p className={`text-xs mt-0.5 line-clamp-2 leading-relaxed ${notif.isRead ? 'text-slate-400' : 'text-slate-600'}`}>
                                        {notif.message}
                                    </p>
                                    
                                    {notif.hasAction && (
                                        <div className="mt-2">
                                            {/* Dim the action button if the notification is already read */}
                                            <span className={`inline-block px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors shadow-sm ${notif.isRead ? 'bg-slate-200 text-slate-500' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                                                {notif.actionLabel}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <p className={`text-[10px] font-bold mt-2 ${notif.isRead ? 'text-slate-300' : 'text-teal-600'}`}>
                                        {notif.timestamp}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    );
                })
            )}
        </>
    );

    return (
        <nav className="sticky top-0 w-full z-50 bg-white border-b border-gray-100 shadow-sm">
            {DEBUG_MODE && (
                <div className="bg-amber-500 text-[10px] text-white font-black py-1 text-center uppercase tracking-widest">
                    ⚠️ Debug Mode Active: Logged in as {MOCK_ROLE}
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex justify-between items-center h-16">
                
                {/* LOGO */}
                <Link href="/" className="flex items-center gap-4 cursor-pointer group shrink-0">
                    <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center text-white text-lg group-hover:bg-teal-600 transition-colors shadow-sm">
                        <PawPrint size={20} />
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight hidden sm:block">
                        Pawsport & Peer
                    </span>
                </Link>

                {/* DESKTOP NAV */}
                <div className="hidden lg:flex justify-center items-center gap-6">
                    {activeLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link 
                                key={link.name} 
                                href={link.href} 
                                className={`text-[13px] font-bold flex items-center gap-2 px-1 py-5 border-b-2 transition-all ${
                                    isActive ? "border-teal-600 text-teal-600" : "border-transparent text-slate-400 hover:text-teal-600 hover:border-teal-200"
                                }`}
                            >
                                {link.icon} {link.name}
                            </Link>
                        )
                    })}
                </div>

                {/* DESKTOP PROFILE & NOTIFICATIONS */}
                <div className="flex items-center gap-3">
                    {isSignedUp ? (
                        <> 
                            {/* NOTIFICATIONS - VISIBLE TO BOTH ROLES */}
                            <div className="relative hidden lg:block" ref={notificationsRef}>
                                <button 
                                    onClick={() => {
                                        setIsNotificationsOpen(prev => !prev);
                                        setIsProfileDropdownOpen(false);
                                    }}
                                    className="notif-toggle-btn relative p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                                >
                                    <Bell size={20} />
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                </button>

                                {isNotificationsOpen && (
                                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                                        <div className="px-4 py-3 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                                            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</p>
                                            <button onClick={()=>{
                                                const updatedNotifications = userNotifications.map(notif => ({
                                                    ...notif,
                                                    isRead: true
                                                }));
                                                setUserNotifications(updatedNotifications);
                                            }} className="text-[10px] font-bold text-teal-600 hover:underline">Mark all read</button>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto p-2">
                                            {NotificationsList}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* USER ACTIONS PANEL */}
                            <div className="relative hidden lg:block" ref={dropdownRef}>
                                <button 
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white font-black text-sm"
                                >
                                    {DEBUG_MODE ? currentRole?.[0] || '' : user?.name?.[0] || ''}
                                </button>

                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                        <div className="px-4 py-3 bg-slate-50 border-b border-gray-100">
                                            <p className="text-xs font-bold text-slate-900">{currentRole} ACCOUNT</p>
                                        </div>
                                        <div className="p-2">
                                            <Link 
                                                href={`/${currentRole?.toLowerCase()}/profile`} 
                                                onClick={() => setIsProfileDropdownOpen(false)}
                                                className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-teal-600 rounded-xl transition-colors"
                                            >
                                                <Settings size={16} /> View Profile
                                            </Link>
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1"
                                            >
                                                <LogOut size={16} /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="hidden lg:flex gap-2">
                            <Link href="/signin" className="px-5 py-2.5 text-sm font-bold text-teal-600">Sign In</Link>
                            <Link href="/signup" className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold">Sign Up</Link>
                        </div>
                    )}

                    {/* MOBILE TOGGLE & NOTIFICATIONS */}
                    <div className="lg:hidden flex items-center gap-2" ref={mobileNotificationsRef}>
                        {isSignedUp && (
                            <button 
                                onClick={() => {
                                    setIsNotificationsOpen(prev => !prev);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="notif-toggle-btn relative p-2 text-slate-400 hover:text-teal-600"
                            >
                                <Bell size={20} />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>
                        )}
                        <button 
                            className="p-2 text-slate-500"
                            onClick={() => {
                                setIsMobileMenuOpen(!isMobileMenuOpen);
                                setIsNotificationsOpen(false);
                            }}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE NOTIFICTIONS PANEL */}
            {isNotificationsOpen && (
                <div id="mobile-notif-panel" className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl z-50">
                    <div className="px-4 py-3 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</p>
                        <button onClick={()=>{
                            const updatedNotifications = userNotifications.map(notif => ({
                                ...notif,
                                isRead: true
                            }));
                            setUserNotifications(updatedNotifications);
                        }} className="text-[10px] font-bold text-teal-600 hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto p-4">
                        {NotificationsList}
                    </div>
                </div>
            )}

            {/* MOBILE MENU */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white border-b border-gray-100 shadow-xl absolute w-full left-0 z-50 h-[calc(100vh-64px)]">
                    <div className="flex flex-col px-6 pt-2 pb-8 h-full">
                        <div className="space-y-2 grow">
                            {activeLinks.map((link) => (
                                <Link 
                                    key={link.name} 
                                    href={link.href} 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`text-base font-bold flex items-center gap-4 p-4 rounded-2xl ${
                                        pathname === link.href ? "bg-teal-50 text-teal-700" : "text-slate-500"
                                    }`}
                                >
                                    {link.icon} {link.name}
                                </Link>
                            ))}
                        </div>
                        
                        <div className="pt-6 border-t border-slate-100 mt-6 pb-6">
                            {isSignedUp && (
                                <>
                                    {/* USER ACTIONS PANEL */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 px-2 mb-4">
                                            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white font-black">
                                                {DEBUG_MODE ? currentRole?.[0] || '' : user?.name?.[0] || ''}
                                            </div>
                                            <p className="text-sm font-bold text-slate-900">Signed in as {currentRole}</p>
                                        </div>
                                        
                                        <Link 
                                            href={`/${currentRole?.toLowerCase()}/profile`} 
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-50 text-slate-700 rounded-2xl font-bold"
                                        >
                                            <Settings size={18} /> View Profile
                                        </Link>
                                        
                                        <button 
                                            onClick={handleLogout}
                                            className="flex items-center justify-center gap-2 w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold"
                                        >
                                            <LogOut size={18} /> Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}