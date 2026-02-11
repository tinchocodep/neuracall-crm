import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const isMobile = window.innerWidth < 768;

    // Auto-close sidebar on mobile route change
    useEffect(() => {
        if (isMobile) setIsSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
            {/* Desktop Sidebar (Only visible on md+) */}
            <div className="hidden md:block h-full transition-all duration-300 ease-in-out">
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* TopBar (Header) */}
                <TopBar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0 scroll-smooth">
                    <div className="h-full w-full p-4 md:p-6 lg:p-8">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Navigation (Only visible on < md) */}
                <div className="md:hidden fixed bottom-6 left-0 right-0 px-4 z-50">
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-2 flex justify-around items-center">
                        <MobileNav />
                    </div>
                </div>
            </div>
        </div>
    );
}
