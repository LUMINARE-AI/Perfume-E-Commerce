import { Link, Outlet, useLocation } from "react-router-dom";

export default function DashboardLayout() {
  const { pathname } = useLocation();

  const links = [
    { to: "/dashboard/profile", label: "Profile" },
    { to: "/dashboard/orders", label: "My Orders" },
    { to: "/dashboard/address", label: "Addresses" },
    { to: "/dashboard/security", label: "Security" },
  ];

  return (
    <main className="bg-black min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-6 text-white grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <aside className="border border-white/10 p-4 h-fit">
          <h2 className="font-serif text-xl mb-4">My Account</h2>
          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-3 py-2 border ${
                  pathname === link.to
                    ? "border-yellow-400 text-yellow-400"
                    : "border-white/10 text-gray-300 hover:border-yellow-400 hover:text-yellow-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <section className="md:col-span-3">
          <Outlet />
        </section>
      </div>
    </main>
  );
}
