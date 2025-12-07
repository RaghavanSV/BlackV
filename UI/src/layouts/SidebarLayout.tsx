import { Link, Outlet, useLocation } from "react-router-dom";

export default function SidebarLayout() {
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Agents", path: "/agents" },
    { label: "Tasks", path: "/tasks" },
    { label: "Profiles", path: "/profiles" },
    { label: "Results", path: "/results" },
    { label: "Activity", path: "/activity" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-black text-gray-200">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col space-y-6">

        <h1 className="text-xl font-bold tracking-wide text-purple-400">
          BlackV C2
        </h1>

        <nav className="flex flex-col space-y-3">

          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={` px-4 py-2 rounded-md transition
                  ${active ? "bg-purple-600 text-white" :
                    "text-gray-300 hover:bg-gray-800 hover:text-white"}
                 `}
              >
                {item.label}
              </Link>
            );
          })}

        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
