import { Link, NavLink } from "react-router-dom";
import { FiSearch, FiShoppingBag, FiUser, FiMenu, FiX } from "react-icons/fi";
import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useCart } from "../../contexts/CartContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { cartCount, refreshCart } = useCart();

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch user + cart on mount
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data.data);
      } catch {
        setUser(null);
      }
    };

    fetchMe();
    refreshCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10 ${
          scrolled
            ? "bg-black/98 backdrop-blur-2xl shadow-2xl shadow-black/50 border-b border-white/5"
            : "bg-black border-b border-white/10"
        }`}
      >
        {/* Elegant Top Bar */}
        <div className="relative overflow-hidden bg-linear-to-r from-black via-[#1a1a1a] to-black border-b border-[#D4AF37]/20">
          <div className="max-w-7xl mx-auto px-6 py-2.5">
            <p className="text-center text-[10px] lg:text-xs tracking-[0.25em] font-light text-white/80">
              <span className="inline-flex items-center gap-2">
                <span className="text-[#D4AF37]">★</span>
                <span>COMPLIMENTARY SHIPPING ON ORDERS OVER $150</span>
                <span className="hidden md:inline text-[#D4AF37] mx-2">•</span>
                <span className="hidden md:inline">LUXURY GIFT WRAPPING AVAILABLE</span>
                <span className="text-[#D4AF37]">★</span>
              </span>
            </p>
          </div>
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#D4AF37]/5 to-transparent animate-shimmer"></div>
        </div>

        <nav className="max-w-7xl mx-auto px-6 py-4 md:py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="group relative z-10 transition-transform duration-500 hover:scale-105"
            >
              <div className="relative">
                <h1
                  className="text-2xl md:text-3xl font-serif tracking-[0.15em] transition-all duration-500"
                  style={{ color: "#D4AF37" }}
                >
                  BinKhalid
                  <span className="absolute -inset-1 bg-[#D4AF37]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></span>
                </h1>
                <div
                  className="absolute -bottom-1 left-0 h-px w-0 group-hover:w-full transition-all duration-700 ease-out"
                  style={{ backgroundColor: "#D4AF37" }}
                ></div>
              </div>
              <p className="text-[9px] tracking-[0.4em] text-white/40 text-center mt-1 font-light uppercase">
                Parfumerie de Luxe
              </p>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-10 lg:gap-12 absolute left-1/2 -translate-x-1/2">
              {[
                { path: "/", label: "Home" },
                { path: "/products", label: "Shop" },
                { path: "/about", label: "About" },
                { path: "/contact", label: "Contact" },
              ].map(({ path, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `relative text-xs lg:text-sm tracking-[0.2em] font-light uppercase transition-all duration-500 group py-2 ${
                      isActive ? "text-[#D4AF37]" : "text-white hover:text-[#D4AF37]"
                    }`
                  }
                >
                  <span className="relative z-10">{label}</span>
                  <span
                    className="absolute bottom-0 left-0 w-0 h-px group-hover:w-full transition-all duration-700 ease-out"
                    style={{ backgroundColor: "#D4AF37" }}
                  ></span>
                  <span className="absolute inset-0 bg-[#D4AF37]/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></span>
                </NavLink>
              ))}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4 lg:gap-6">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="relative group transition-all duration-500 hover:scale-110"
                aria-label="Search"
              >
                <FiSearch
                  size={20}
                  className="text-white transition-all duration-500 group-hover:text-[#D4AF37]"
                />
                <span className="absolute inset-0 rounded-full bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 blur-lg transition-all duration-500"></span>
              </button>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative group transition-all duration-500 hover:scale-110"
                aria-label="Shopping Bag"
              >
                <FiShoppingBag
                  size={20}
                  className="text-white transition-all duration-500 group-hover:text-[#D4AF37]"
                />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
                <span className="absolute inset-0 rounded-full bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 blur-lg transition-all duration-500"></span>
              </Link>

              {/* User */}
              <Link
                to={
                  !user ? "/login"
                  : user.role === "admin" ? "/admin/dashboard"
                  : "/dashboard/profile"
                }
                className="relative group transition-all duration-500 hover:scale-110"
                aria-label="Account"
              >
                <FiUser
                  size={20}
                  className="text-white transition-all duration-500 group-hover:text-[#D4AF37]"
                />
                <span className="absolute inset-0 rounded-full bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 blur-lg transition-all duration-500"></span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden relative group transition-all duration-500 hover:scale-110"
                onClick={() => setOpen(!open)}
                aria-label="Menu"
              >
                {open ? (
                  <FiX size={22} className="text-white transition-all duration-500 group-hover:text-[#D4AF37]" />
                ) : (
                  <FiMenu size={22} className="text-white transition-all duration-500 group-hover:text-[#D4AF37]" />
                )}
                <span className="absolute inset-0 rounded-full bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 blur-lg transition-all duration-500"></span>
              </button>
            </div>
          </div>
        </nav>

        <div className="h-px bg-linear-to-r from-transparent via-[#D4AF37]/30 to-transparent"></div>
      </header>

      {/* Search Overlay */}
      <div
        className={`fixed inset-0 z-60 bg-black/98 backdrop-blur-3xl transition-all duration-700 ${
          searchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-4xl mx-auto px-6 pt-32 md:pt-40">
          <button
            onClick={() => setSearchOpen(false)}
            className="absolute top-8 right-8 text-white/60 hover:text-[#D4AF37] transition-all duration-500 hover:rotate-90 hover:scale-110"
            aria-label="Close Search"
          >
            <FiX size={32} />
          </button>

          <div className="relative group">
            <input
              type="text"
              placeholder="Search our collection..."
              className="w-full bg-transparent border-b-2 border-white/20 focus:border-[#D4AF37] text-3xl md:text-5xl text-white placeholder-white/30 py-6 outline-none font-light tracking-wide transition-all duration-500"
              autoFocus
              style={{ fontFamily: "serif" }}
            />
            <FiSearch
              className="absolute right-0 top-1/2 -translate-y-1/2 opacity-30 transition-all duration-500 group-focus-within:opacity-60"
              style={{ color: "#D4AF37" }}
              size={32}
            />
          </div>

          <div className="mt-12">
            <p className="text-white/40 text-xs tracking-[0.2em] uppercase font-light mb-4">
              Popular Searches
            </p>
            <div className="flex flex-wrap gap-3">
              {["Oud", "Rose", "Amber", "Musk", "Sandalwood"].map((term) => (
                <button
                  key={term}
                  className="px-5 py-2.5 border border-[#D4AF37]/30 text-white/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-all duration-500 text-sm tracking-wider uppercase"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-y-0 right-0 z-55 w-full max-w-sm bg-black/99 backdrop-blur-2xl border-l border-[#D4AF37]/20 transform transition-all duration-700 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="border-b border-[#D4AF37]/20 px-6 py-8">
            <h3 className="text-2xl font-serif tracking-[0.15em]" style={{ color: "#D4AF37" }}>
              Menu
            </h3>
            <p className="text-white/30 text-xs tracking-widest mt-1 uppercase">Navigation</p>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 py-8 space-y-1">
            {[
              { path: "/", label: "Home" },
              { path: "/products", label: "Shop" },
              { path: "/about", label: "About" },
              { path: "/contact", label: "Contact" },
            ].map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-6 py-4 text-base tracking-[0.15em] uppercase transition-all duration-500 rounded-sm relative overflow-hidden group ${
                    isActive ? "text-[#D4AF37]" : "text-white/70 hover:text-[#D4AF37]"
                  }`
                }
              >
                <span className="relative z-10">{label}</span>
                <span className="absolute inset-0 bg-linear-to-r from-[#D4AF37]/0 via-[#D4AF37]/10 to-[#D4AF37]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-[#D4AF37]/20 px-6 py-6 space-y-6 bg-linear-to-b from-transparent to-black/40">
            <div className="space-y-3">
              <p className="text-white/40 text-xs tracking-[0.2em] uppercase">Contact</p>
              <p className="text-white/60 text-sm">contact@binkhalid.com</p>
              <p className="text-white/60 text-sm">+1 (555) 123-4567</p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-white/30 text-[10px] tracking-widest uppercase">
                © 2024 BinKhalid Parfumerie
              </p>
            </div>
          </div>
        </div>

        <div
          className="absolute left-0 top-0 bottom-0 w-px"
          style={{ background: `linear-gradient(to bottom, transparent, #D4AF37, transparent)` }}
        ></div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-54 bg-black/80 backdrop-blur-sm md:hidden transition-opacity duration-500"
          onClick={() => setOpen(false)}
        ></div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 8s infinite;
        }
      `}</style>
    </>
  );
}