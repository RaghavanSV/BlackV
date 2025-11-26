import { Link } from "react-router-dom";

export default function SidebarLayout({ children }){
    return(
        <div>
            <aside className="w-64 h-screen bg-gray-900 text-white p-4">
                <ul className="space-y-4">
                    <li><Link to="/dashboard">Dashboard</Link></li>
                    <li><Link to="/agents">Agents</Link></li>
                    <li><Link to="/tasks">Tasks</Link></li>
                    <li><Link to="/profiles">Profiles</Link></li>
                    <li><Link to="/settings">Settings</Link></li>
                </ul>
            </aside>
            <main className="flex-1 p-4">
                {children}
            </main>
        </div>
    );
}