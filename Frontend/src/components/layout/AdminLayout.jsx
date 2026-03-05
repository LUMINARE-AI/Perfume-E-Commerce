import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiUsers,
  FiStar,
  FiLogOut,
} from "react-icons/fi";

const navItems = [
  { to: "/admin/dashboard", icon: FiHome, label: "Dashboard" },
  { to: "/admin/orders", icon: FiShoppingBag, label: "Orders" },
  { to: "/admin/users", icon: FiUsers, label: "Users" },
  { to: "/admin/reviews", icon: FiStar, label: "Reviews" },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen mt-15 pt-6 bg-black text-white">
      {/* ── Mobile Top Header ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-black border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-14">
          <h2 className="text-lg font-serif text-yellow-400 tracking-tight">
            Admin Panel
          </h2>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition px-3 py-1.5 border border-white/10 hover:border-red-400/40"
          >
            <FiLogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden pt-2 mt-30 md:flex flex-col fixed left-0 top-0 bottom-0 w-64 border-r border-white/10 bg-black/60 backdrop-blur-xl z-30">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-2xl  font-serif text-yellow-400 tracking-tight">
              Admin Panel
            </h2>
          </div>

          <nav className="mt-4 space-y-2 flex-1">
            {navItems.map((item) => (
              <DesktopNavItem key={item.to} to={item.to} icon={<item.icon />}>
                {item.label}
              </DesktopNavItem>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition border border-transparent hover:border-red-400/30"
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 md:ml-64 min-h-screen bg-linear-to-br from-black via-black to-zinc-900">
          {/* Top padding on mobile for header, bottom padding for tab bar */}
          <div className="pt-4 pb-20 md:pt-0 md:pb-0 p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-stretch h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all duration-200 relative
                ${
                  isActive
                    ? "text-yellow-400"
                    : "text-gray-500 hover:text-gray-300"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator line on top */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-yellow-400 rounded-full" />
                  )}
                  {/* Icon with active background */}
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                      isActive ? "bg-yellow-400/10" : ""
                    }`}
                  >
                    <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function DesktopNavItem({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-sm transition-all group ${
          isActive
            ? "border border-yellow-400 text-yellow-400 bg-yellow-400/5 shadow-lg shadow-yellow-400/10"
            : "border border-white/10 text-gray-300 hover:border-yellow-400/50 hover:text-yellow-400 hover:bg-white/5"
        }`
      }
    >
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-medium">{children}</span>
    </NavLink>
  );
}