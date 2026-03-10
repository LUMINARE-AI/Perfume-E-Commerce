import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiShoppingBag,
  FiUsers,
  FiStar,
  FiLogOut,
} from "react-icons/fi";
import { logout } from "../../utils/authUtils";

const navItems = [
  { to: "/admin/dashboard", icon: FiHome, label: "Dashboard" },
  { to: "/admin/orders", icon: FiShoppingBag, label: "Orders" },
  { to: "/admin/users", icon: FiUsers, label: "Users" },
  { to: "/admin/reviews", icon: FiStar, label: "Reviews" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => setShowConfirm(true);
  const confirmLogout = () => logout(navigate, "/");
  const cancelLogout = () => setShowConfirm(false);

  return (
    <div className="min-h-screen mt-12 pt-6 bg-black text-white">
      {/* ── Mobile Top Header (no logout here — it's in tab bar now) ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-black border-b border-white/10">
        <div className="flex items-center px-4 h-14">
          <h2 className="text-lg font-serif text-yellow-400 tracking-tight">
            Admin Panel
          </h2>
        </div>
      </header>

      <div className="flex">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden pt-2 mt-30 md:flex flex-col fixed left-0 top-0 bottom-0 w-64 border-r border-white/10 bg-black/60 backdrop-blur-xl z-30">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-2xl font-serif text-yellow-400 tracking-tight">
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
          <div className="pt-4 pb-20 md:pt-0 md:pb-0 p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-stretch h-16">
          {/* Nav tabs */}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all duration-200 relative
                ${isActive ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-yellow-400 rounded-full" />
                  )}
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

          {/* Logout tab — red on hover/press */}
          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-gray-500 active:text-red-400 transition-all duration-200 relative border-l border-white/5"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full active:bg-red-400/10 transition-all duration-200">
              <FiLogOut size={18} strokeWidth={1.5} />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
      {/* ── Logout Confirm Toast ── */}
      {showConfirm && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-slideUp">
          <div className="bg-zinc-900 border border-white/10 shadow-2xl shadow-black/60 px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FiLogOut size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-white font-light">
                Are you sure you want to logout?
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={cancelLogout}
                className="px-3 py-1.5 text-xs text-gray-400 border border-white/10 hover:border-white/30 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-3 py-1.5 text-xs text-black bg-red-400 hover:bg-red-500 transition font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.2s ease-out; }
      `}</style>
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