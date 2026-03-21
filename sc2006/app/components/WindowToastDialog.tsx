import { AlertTriangleIcon, CheckCircle, InfoIcon, OctagonXIcon, X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

interface DialogButton {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
}

interface WindowDialogProps {
    icon?: "info" | "warning" | "danger" | "success";
    title?: string;
    subtitle?: string;
    description?: string;
    buttons?: DialogButton[];
    onClose?: () => void;
    position?: "bottom-right" | "top-right" | "bottom-left" | "top-left";
    autoClose?: number; // Added autoClose prop (in milliseconds)
}

export default function WindowDialog({
    icon = "info",
    title = "",
    subtitle = "",
    description = "",
    onClose,
    position = "bottom-right",
    autoClose, // Extract the new prop
    buttons = [
        { label: "Cancel", onClick: () => console.log("close"), variant: "secondary" },
        { label: "Ok", onClick: () => console.log("ok"), variant: "primary" }
    ],
}: WindowDialogProps) {
    
    // State to handle the visual shrinking of the bar
    const [progressWidth, setProgressWidth] = useState(100);

    // Added a 'progress' color to match the theme
    const iconMap: Record<string, { symbol: ReactNode; color: string; bg: string; progress: string }> = {
        info: { symbol: <InfoIcon size={20} />, color: "text-blue-600", bg: "bg-blue-100", progress: "bg-blue-500" },
        warning: { symbol: <AlertTriangleIcon size={20} />, color: "text-amber-600", bg: "bg-amber-100", progress: "bg-amber-500" },
        danger: { symbol: <OctagonXIcon size={20} />, color: "text-red-600", bg: "bg-red-100", progress: "bg-red-500" },
        success: { symbol: <CheckCircle size={20} />, color: "text-emerald-600", bg: "bg-emerald-100", progress: "bg-emerald-500" },
    };

    const currentIcon = iconMap[icon] || iconMap.info;

    const positionClasses = {
        "bottom-right": "bottom-6 right-6 animate-slide-in-right",
        "top-right": "top-20 right-6 animate-slide-in-right",
        "bottom-left": "bottom-6 left-6 animate-slide-in-left",
        "top-left": "top-20 left-6 animate-slide-in-left",
    };

    useEffect(() => {
        if (autoClose && autoClose > 0) {
            const animationTimer = setTimeout(() => {
                setProgressWidth(0);
            }, 10);

            const closeTimer = setTimeout(() => {
                if (onClose) onClose();
            }, autoClose);

            return () => {
                clearTimeout(animationTimer);
                clearTimeout(closeTimer);
            };
        }
    }, [autoClose, onClose]);

    return (
        <div className={`fixed z-50 bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100 overflow-hidden ${positionClasses[position]}`}>
            
            {/* HEADER */}
            <header className="p-5 pb-0 flex gap-4 items-start">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${currentIcon.bg} ${currentIcon.color}`}>
                    {currentIcon.symbol}
                </div>
                <div className="flex-1 pt-0.5">
                    {title && <h1 className="text-lg font-bold text-gray-900">{title}</h1>}
                    {subtitle && <h4 className="text-xs font-medium text-gray-500 mt-1">{subtitle}</h4>}
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-50">
                        <X/>
                    </button>
                )}
            </header>
            
            {/* BODY */}
            {description && (
                <main className="px-5 pb-5 pt-1 text-gray-600 text-sm leading-relaxed ml-12">
                    <p>{description}</p>
                </main>
            )}
            
            {/* FOOTER */}
            {buttons && buttons.length > 0 && (
                <footer className="px-5 py-3 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
                    {buttons.map((btn, index) => {
                        const baseStyle = "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors";
                        let variantStyle = "";
                        
                        if (btn.variant === "primary") {
                            variantStyle = "bg-teal-600 text-white hover:bg-teal-700 shadow-sm";
                        } else if (btn.variant === "danger") {
                            variantStyle = "bg-red-600 text-white hover:bg-red-700 shadow-sm";
                        } else {
                            variantStyle = "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 shadow-sm";
                        }

                        return (
                            <button 
                                key={index} 
                                onClick={btn.onClick}
                                className={`${baseStyle} ${variantStyle}`}
                            >
                                {btn.label}
                            </button>
                        );
                    })}
                </footer>
            )}

            {/* TIMER PROGRESS BAR */}
            {autoClose && autoClose > 0 && (
                <div className="w-full h-1 bg-gray-100">
                    <div 
                        className={`h-full ${currentIcon.progress}`}
                        style={{ 
                            width: `${progressWidth}%`, 
                            transition: `width ${autoClose}ms linear` 
                        }}
                    />
                </div>
            )}
        </div>
    );
}