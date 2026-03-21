import { AlertTriangleIcon, CheckCircle, InfoIcon, OctagonXIcon, X } from "lucide-react";
import { ReactNode } from "react";

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
}

export default function WindowDialog({
    icon = "info",
    title = "",
    subtitle = "",
    description = "",
    onClose,
    buttons = [
        { label: "Cancel", onClick: () => console.log("close"), variant: "secondary" },
        { label: "Ok", onClick: () => console.log("ok"), variant: "primary" }
    ],
}: WindowDialogProps) {
    
    const iconMap: Record<string, { symbol: ReactNode; color: string; bg: string }> = {
        info: { symbol: <InfoIcon/>, color: "text-blue-600", bg: "bg-blue-100" },
        warning: { symbol: <AlertTriangleIcon/>, color: "text-amber-600", bg: "bg-amber-100" },
        danger: { symbol: <OctagonXIcon/>, color: "text-red-600", bg: "bg-red-100" },
        success: { symbol: <CheckCircle/>, color: "text-emerald-600", bg: "bg-emerald-100" },
    };

    const currentIcon = iconMap[icon] || iconMap.info;

    return (
        // 3. The Backdrop Overlay
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            
            {/* The Modal Card */}
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* HEADER */}
                <header className="p-6 pb-4 flex gap-4 items-start">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${currentIcon.bg} ${currentIcon.color}`}>
                        {currentIcon.symbol}
                    </div>
                    <div className="flex-1 pt-1">
                        {title && <h1 className="text-lg font-bold text-gray-900">{title}</h1>}
                        {subtitle && <h4 className="text-sm font-medium text-gray-500 mt-1">{subtitle}</h4>}
                    </div>
                    {/* Optional Close Button */}
                    {onClose && (
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X/>
                        </button>
                    )}
                </header>
                
                {/* BODY */}
                <main className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">
                    <p>{description}</p>
                </main>
                
                {/* FOOTER */}
                <footer className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    {buttons.map((btn, index) => {
                        const baseStyle = "px-4 py-2 rounded-lg text-sm font-semibold transition-colors";
                        let variantStyle = "";
                        
                        if (btn.variant === "primary") {
                            variantStyle = "bg-teal-600 text-white hover:bg-teal-700 shadow-sm";
                        } else if (btn.variant === "danger") {
                            variantStyle = "bg-red-600 text-white hover:bg-red-700 shadow-sm";
                        } else {
                            variantStyle = "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100";
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
            </div>
        </div>
    );
}