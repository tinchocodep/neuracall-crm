import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function Layout() {
    const location = useLocation();
    const isDashboard = location.pathname === '/';

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 h-screen overflow-hidden">
                {!isDashboard && <TopBar />}
                <main className={`flex-1 overflow-auto ${isDashboard ? 'p-0' : 'p-6 md:p-8'} bg-muted/5 transition-all duration-300`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
