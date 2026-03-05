import { Link, NavLink } from "react-router-dom";
import { FiSearch, FiShoppingBag, FiUser, FiMenu, FiX } from "react-icons/fi";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api/axios";
import { useCart } from "../../contexts/CartContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { cartCount, refreshCart } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();
  const debounceTimer = useRef(null);
  const searchInputRef = useRef(null);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchTerm("");
      setSearchResults([]);
    }
  }, [searchOpen]);

  // Real-time search with debounce
  const fetchSearchResults = useCallback(async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    try {
      setSearchLoading(true);
      const res = await api.get("/products", {
        params: { search: term, limit: 6, page: 1 },
      });
      const payload = res.data?.data;
      setSearchResults(payload?.products || []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    debounceTimer.current = setTimeout(() => {
      fetchSearchResults(searchTerm);
    }, 350);
    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm, fetchSearchResults]);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchOpen(false);
    }
  };

  const handleResultClick = (productId) => {
    navigate(`/products/${productId}`);
    setSearchOpen(false);
  };

  const handleViewAll = () => {
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchOpen(false);
    }
  };

  // ── fetchMe: reusable, checks token first ──
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await api.get("/users/me");
      setUser(res.data.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
      }
      setUser(null);
    }
  }, []);

  // ── On mount ──
  useEffect(() => {
    fetchMe();
    if (localStorage.getItem("token")) refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Listen for login/logout — fired from Login page after token is saved ──
  useEffect(() => {
    const handleAuthChange = () => {
      fetchMe();
      refreshCart();
      
    };

    window.addEventListener("auth:changed", handleAuthChange);

    // Catch token changes from other browser tabs
    const handleStorage = (e) => {
      if (e.key === "token") handleAuthChange();
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("auth:changed", handleAuthChange);
      window.removeEventListener("storage", handleStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMe]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 bg-black border-b border-white/10 transition-all duration-300 ${
          scrolled
            ? "bg-black/98 backdrop-blur-2xl shadow-2xl shadow-black/50 border-b border-white/5"
            : "bg-black border-b border-white/10"
        }`}
        style={{ zIndex: 50 }}
      >
        {/* Top Bar */}
        <div className="relative overflow-hidden bg-linear-to-r from-black via-[#1a1a1a] to-black border-b border-[#D4AF37]/20">
          <div className="max-w-7xl mx-auto px-6 py-2.5">
            <p className="text-center text-[10px] lg:text-xs tracking-[0.25em] font-light text-white/80">
              <span className="inline-flex items-center gap-2">
                <span className="text-[#D4AF37]">★</span>
                <span>COMPLIMENTARY SHIPPING ON ORDERS OVER ₹999</span>
                <span className="hidden md:inline text-[#D4AF37] mx-2">•</span>
                <span className="hidden md:inline">LUXURY GIFT WRAPPING AVAILABLE</span>
                <span className="text-[#D4AF37]">★</span>
              </span>
            </p>
          </div>
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#D4AF37]/5 to-transparent animate-shimmer pointer-events-none" />
        </div>

        <nav className="max-w-7xl mx-auto px-6 py-4 md:py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="group relative transition-transform duration-500 hover:scale-105">
              <div className="relative">
                <h1
                  className="text-2xl md:text-3xl font-serif tracking-[0.15em] transition-all duration-500"
                  style={{ color: "#D4AF37" }}
                >
                  BinKhalid
                </h1>
                <div
                  className="absolute -bottom-1 left-0 h-px w-0 group-hover:w-full transition-all duration-700 ease-out"
                  style={{ backgroundColor: "#D4AF37" }}
                />
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
                  />
                </NavLink>
              ))}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4 lg:gap-6">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="relative group transition-all duration-300 hover:scale-110"
                aria-label="Search"
              >
                <FiSearch size={20} className="text-white transition-colors duration-300 group-hover:text-[#D4AF37]" />
              </button>

              <Link to="/cart" className="relative group transition-all duration-300 hover:scale-110" aria-label="Shopping Bag">
                <FiShoppingBag size={20} className="text-white transition-colors duration-300 group-hover:text-[#D4AF37]" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              <Link
                to={!user ? "/login" : user.role === "admin" ? "/admin/dashboard" : "/dashboard/profile"}
                className="relative group transition-all duration-300 hover:scale-110"
                aria-label="Account"
              >
                <FiUser size={20} className="text-white transition-colors duration-300 group-hover:text-[#D4AF37]" />
              </Link>

              <button
                className="md:hidden relative group transition-all duration-300 hover:scale-110"
                onClick={() => setOpen(!open)}
                aria-label="Menu"
              >
                {open ? (
                  <FiX size={22} className="text-white group-hover:text-[#D4AF37] transition-colors duration-300" />
                ) : (
                  <FiMenu size={22} className="text-white group-hover:text-[#D4AF37] transition-colors duration-300" />
                )}
              </button>
            </div>
          </div>
        </nav>

        <div className="h-px bg-linear-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
      </header>

      {/* ── Search Overlay ── */}
      <div
        className={`fixed inset-0 bg-black/98 backdrop-blur-3xl transition-all duration-700 ${
          searchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex: 60 }}
      >
        <div className="max-w-4xl mx-auto px-6 pt-28 md:pt-36">
          <button
            onClick={() => setSearchOpen(false)}
            className="absolute top-8 right-8 text-white/60 hover:text-[#D4AF37] transition-all duration-300 hover:rotate-90 hover:scale-110"
            aria-label="Close Search"
          >
            <FiX size={32} />
          </button>

          <div className="relative group">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search our collection..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full bg-transparent border-b-2 border-white/20 focus:border-[#D4AF37] text-2xl md:text-4xl text-white placeholder-white/30 py-5 outline-none font-light tracking-wide transition-all duration-500 pr-12"
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              {searchLoading ? (
                <div className="w-6 h-6 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
              ) : (
                <FiSearch className="opacity-30 transition-all duration-500 group-focus-within:opacity-60" style={{ color: "#D4AF37" }} size={28} />
              )}
            </div>
          </div>

          {searchTerm.trim() && (
            <div className="mt-2 border border-white/10 bg-black/90 backdrop-blur-xl overflow-hidden animate-fadeIn">
              {searchLoading && searchResults.length === 0 ? (
                <div className="px-5 py-6 text-center text-white/40 text-sm tracking-widest">Searching...</div>
              ) : searchResults.length === 0 && !searchLoading ? (
                <div className="px-5 py-6 text-center text-white/40 text-sm tracking-widest">
                  No products found for &ldquo;{searchTerm}&rdquo;
                </div>
              ) : (
                <>
                  <ul>
                    {searchResults.map((product, idx) => (
                      <li
                        key={product._id}
                        className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/5 transition-all duration-200 group/item ${
                          idx !== searchResults.length - 1 ? "border-b border-white/5" : ""
                        }`}
                        onClick={() => handleResultClick(product._id)}
                      >
                        <div className="w-12 h-12 shrink-0 bg-gray-900 overflow-hidden">
                          <img
                            src={product.images?.[0]?.url || "/placeholder.jpg"}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                            onError={(e) => { e.target.src = "/placeholder.jpg"; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          {product.brand && (
                            <p className="text-[10px] text-[#D4AF37]/70 uppercase tracking-wider mb-0.5">{product.brand}</p>
                          )}
                          <p className="text-white text-sm font-light truncate group-hover/item:text-[#D4AF37] transition-colors duration-200">
                            {product.name}
                          </p>
                          {product.category && (
                            <p className="text-white/30 text-[10px] uppercase tracking-wider mt-0.5">{product.category}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[#D4AF37] text-sm font-semibold">₹{product.price?.toLocaleString()}</p>
                          {product.stock === 0 && (
                            <p className="text-red-400/70 text-[10px] mt-0.5">Out of stock</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleViewAll}
                    className="w-full px-4 py-3 text-center text-xs tracking-[0.2em] uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-white/5 transition-all duration-200 border-t border-white/5"
                  >
                    View all results for &ldquo;{searchTerm}&rdquo; →
                  </button>
                </>
              )}
            </div>
          )}

          {!searchTerm.trim() && (
            <div className="mt-12">
              <p className="text-white/40 text-xs tracking-[0.2em] uppercase font-light mb-4">Popular Searches</p>
              <div className="flex flex-wrap gap-3">
                {["Oud Al Ahad", "Florence", "Amir", "Moon Glow", "Black Noir"].map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearchTerm(term)}
                    className="px-4 py-2 text-sm text-white/60 border border-white/10 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all duration-300 tracking-wider"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-sm bg-black/99 backdrop-blur-2xl border-l border-[#D4AF37]/20 transform transition-all duration-700 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ zIndex: 55 }}
      >
        <div className="flex flex-col h-full">
          <div className="border-b border-[#D4AF37]/20 px-6 py-8">
            <h3 className="text-2xl font-serif tracking-[0.15em]" style={{ color: "#D4AF37" }}>Menu</h3>
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
                  `block px-6 py-4 text-base tracking-[0.15em] uppercase transition-all duration-300 rounded-sm ${
                    isActive ? "text-[#D4AF37]" : "text-white/70 hover:text-[#D4AF37]"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-[#D4AF37]/20 px-6 py-6 space-y-6">
            <div className="space-y-3">
              <p className="text-white/40 text-xs tracking-[0.2em] uppercase">Contact</p>
              <p className="text-white/60 text-sm">contact@binkhalid.com</p>
              <p className="text-white/60 text-sm">+91 XXXXX XXXXX</p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-white/30 text-[10px] tracking-widest uppercase">
                © {new Date().getFullYear()} BinKhalid Parfumerie
              </p>
            </div>
          </div>
        </div>
        <div
          className="absolute left-0 top-0 bottom-0 w-px pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #D4AF37, transparent)" }}
        />
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm md:hidden"
          style={{ zIndex: 54 }}
          onClick={() => setOpen(false)}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer { animation: shimmer 8s infinite; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </>
  );
}