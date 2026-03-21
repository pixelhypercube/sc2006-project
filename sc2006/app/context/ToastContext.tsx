"use client"
import React, { createContext, useContext, useState, ReactNode } from 'react';
import WindowToastDialog from '../components/WindowToastDialog';

interface Toast {
    id: number;
    type: "success" | "info" | "warning" | "danger";
    title: string;
    description: string;
}

interface ToastContextType {
    fireToast: (type: Toast["type"], title: string, description: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const fireToast = (type: Toast["type"], title: string, description: string) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, type, title, description }]);

        // auto-remove after 5 seconds
        // setTimeout(() => {
        //     setToasts((prev) => prev.filter((t) => t.id !== id));
        // }, 5000);
    };

    return (
        <ToastContext.Provider value={{ fireToast }}>
            {children}
            
            {/* PORTAL: stacking container */}
            <div className="fixed bottom-6 right-6 z-100 flex flex-col-reverse gap-3 pointer-events-none">
                {toasts.map((t) => (
                    <div key={t.id} className="pointer-events-auto">
                        <WindowToastDialog 
                            icon={t.type}
                            title={t.title}
                            description={t.description}
                            onClose={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
                            autoClose={4000}
                            buttons={[
                                { 
                                    label: "Dismiss", 
                                    onClick: () => setToasts((prev) => prev.filter((toast) => toast.id !== t.id)), 
                                    variant: "secondary" 
                                }
                            ]}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};