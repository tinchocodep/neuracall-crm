import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FloatingCalendarButton() {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/calendar')}
            className="fixed bottom-24 md:bottom-8 right-8 z-40 p-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-full shadow-2xl shadow-purple-500/50 transition-all duration-300 hover:scale-110 active:scale-95 group"
            title="Abrir Calendario"
        >
            <Calendar size={24} className="group-hover:rotate-12 transition-transform" />

            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20" />
        </button>
    );
}
