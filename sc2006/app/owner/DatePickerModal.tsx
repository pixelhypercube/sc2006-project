"use client"
import { Calendar, X } from "lucide-react";
import { useRef, useState } from "react";

interface DatePickerModalProps {
    onClose: () => void;
    onConfirm: (startDate: Date, endDate: Date | null) => void;
    initialStartDate: Date | null;
    initialEndDate: Date | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type SelectedDateObj = { day: number, month: string, year: number } | null;

const toDateObj = (date: Date | null): SelectedDateObj => {
    if (!date) return null;
    return {
        day: date.getDate(),
        month: MONTHS[date.getMonth()],
        year: date.getFullYear()
    };
};

const DatePickerModal = ({ onClose, onConfirm, initialStartDate, initialEndDate }: DatePickerModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const initialViewDate = initialStartDate || new Date();
    const [viewMonth, setViewMonth] = useState<string>(MONTHS[initialViewDate.getMonth()]);
    const [viewYear, setViewYear] = useState<number>(initialViewDate.getFullYear());

    const [startDate, setStartDate] = useState<SelectedDateObj>(toDateObj(initialStartDate));
    const [endDate, setEndDate] = useState<SelectedDateObj>(toDateObj(initialEndDate));

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const handleDateDelta = (delta: number) => {
        let newMonthIndex = MONTHS.indexOf(viewMonth) + delta;
        let newYear = viewYear;
        
        if (newMonthIndex < 0) {
            newMonthIndex = 11;
            newYear -= 1;
        } else if (newMonthIndex > 11) {
            newMonthIndex = 0;
            newYear += 1;
        }

        setViewMonth(MONTHS[newMonthIndex]);
        setViewYear(newYear);
    }
    
    const getDaysInMonth = (monthStr: string, yearNum: number) => {
        const monthIndex = MONTHS.indexOf(monthStr);
        return new Date(yearNum, monthIndex + 1, 0).getDate();
    }

    const numDays = getDaysInMonth(viewMonth, viewYear);
    const dates = Array.from({length: numDays}, (_, i) => i + 1);

    const firstDayOfMonth = new Date(viewYear, MONTHS.indexOf(viewMonth), 1).getDay();
    const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const handleDateClick = (day: number) => {
        const clickedDateObj = { day, month: viewMonth, year: viewYear };
        const clickedDate = new Date(viewYear, MONTHS.indexOf(viewMonth), day);

        if (!startDate || (startDate && endDate)) {
            setStartDate(clickedDateObj);
            setEndDate(null);
            return;
        }

        const start = new Date(startDate.year, MONTHS.indexOf(startDate.month), startDate.day);
        
        if (clickedDate > start) {
            setEndDate(clickedDateObj);
        } else {
            setStartDate(clickedDateObj);
        }
    };

    const isDateInRange = (day: number) => {
        if (!startDate || !endDate) return false;
        
        const current = new Date(viewYear, MONTHS.indexOf(viewMonth), day);
        const start = new Date(startDate.year, MONTHS.indexOf(startDate.month), startDate.day);
        const end = new Date(endDate.year, MONTHS.indexOf(endDate.month), endDate.day);
        
        return current > start && current < end;
    };

    return (
        <div 
            onClick={handleOverlayClick}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 font-sans"
        >
            <div 
                ref={modalRef}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden"
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                <X/>
                </button>

                <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-gray-900"/>
                    <h2 className="text-xl font-bold text-gray-900">When will you be away?</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                    Select your travel dates so we can show you available caretakers.
                </p>

                <div className="border border-gray-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <button onClick={()=>handleDateDelta(-1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-600">
                            &lt;
                        </button>
                        <span className="font-semibold text-gray-800 text-sm">{viewMonth} {viewYear}</span>
                        <button onClick={()=>handleDateDelta(1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-600">
                            &gt;
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {daysOfWeek.map(day => (
                        <div key={day} className="text-xs font-medium text-gray-400 py-1">
                            {day}
                        </div>
                    ))}
                    </div>

                    <div className="grid grid-cols-7 gap-y-2 text-center">
                    
                    {emptyCells.map(cell => (
                        <div key={`empty-${cell}`} className="w-8 h-8 mx-auto" />
                    ))}

                    {dates.map(date => {
                        const cellDate = new Date(viewYear, MONTHS.indexOf(viewMonth), date);
                        const todayAtMidnight = new Date();
                        todayAtMidnight.setHours(0,0,0,0);
                        const isPast = cellDate < todayAtMidnight;

                        const isStart = startDate?.day === date && startDate?.month === viewMonth && startDate?.year === viewYear;
                        const isEnd = endDate?.day === date && endDate?.month === viewMonth && endDate?.year === viewYear;
                        const inRange = isDateInRange(date);

                        let baseStyle = "w-8 h-8 mx-auto flex items-center justify-center text-sm rounded-full transition-colors relative z-10 ";
                        let wrapperStyle = "relative";

                        if (isPast) {
                            baseStyle += "text-gray-300 cursor-not-allowed";
                        } else if (isStart || isEnd) {
                            baseStyle += "bg-[#87c5b8] text-white font-bold shadow-sm";
                        } else if (inRange) {
                            baseStyle += "text-teal-800 font-medium";
                            wrapperStyle += " bg-teal-50";
                        } else {
                            baseStyle += "text-gray-800 hover:bg-teal-50 hover:text-teal-600 font-medium";
                        }

                        if (isStart && endDate) wrapperStyle += " bg-gradient-to-r from-transparent via-teal-50 to-teal-50";
                        if (isEnd && startDate) wrapperStyle += " bg-gradient-to-l from-transparent via-teal-50 to-teal-50";

                        return (
                            <div key={date} className={wrapperStyle}>
                                <button
                                    disabled={isPast}
                                    onClick={() => handleDateClick(date)}
                                    className={baseStyle}
                                >
                                    {date}
                                </button>
                            </div>
                        );
                    })}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={!startDate}
                        onClick={() => {
                            if (startDate) {
                                const startObj = new Date(startDate.year, MONTHS.indexOf(startDate.month), startDate.day);
                                const endObj = endDate ? new Date(endDate.year, MONTHS.indexOf(endDate.month), endDate.day) : null;
                                
                                onConfirm(startObj, endObj);
                            }
                        }}
                        className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
                            startDate 
                            ? 'bg-[#87c5b8] hover:bg-[#76b1a5] cursor-pointer' 
                            : 'bg-[#87c5b8] opacity-50 cursor-not-allowed'
                        }`}
                    >
                        Confirm Dates
                    </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatePickerModal;