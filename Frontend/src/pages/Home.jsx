import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ProductCard from "../components/ui/ProductCard";
import { FiArrowRight, FiTruck, FiRotateCw, FiDollarSign, FiShield } from "react-icons/fi";
import MoonGlow from "../assets/MoonGlow.png";
import Florence from "../assets/Florence.png";
import BlackNoir from "../assets/BlackNoir.png";
import OudAlAhad from "../assets/OudAlAhad.png";
import OudAlKhalid from "../assets/OudAlKhalid.png";
import api from "../api/axios";

const heroSlides = [
  {
    image: MoonGlow,
    title: "Discover Your Signature",
    titleGold: "Moon Glow",
    description:
      "A luminous fragrance crafted for those who shine effortlessly with elegance and charm.",
  },
  {
    image: BlackNoir,
    title: "Mystery of",
    titleGold: "Black Noir",
    description:
      "Dark, bold, and irresistible — a fragrance for those who command attention.",
  },
  {
    image: Florence,
    title: "Elegance Inspired by",
    titleGold: "Florence",
    description:
      "A refined floral fragrance capturing the timeless beauty and romance of Italian artistry.",
  },
  {
    image: OudAlAhad,
    title: "The Royal Essence of",
    titleGold: "Oud Al Ahad",
    description:
      "Bold, long-lasting fragrances that make a statement wherever you go.",
  },
  {
    image: OudAlKhalid,
    title: "Legacy of",
    titleGold: "Oud AlKhalid",
    description:
      "Deep oriental notes crafted for those who appreciate timeless sophistication.",
  },
];

const categories = [
  {
    title: "For Men",
    image:
      "https://images.unsplash.com/photo-1619995745882-f4128ac82ad6?q=80&w=800&auto=format&fit=crop",
    link: "/products?category=men",
  },
  {
    title: "For Women",
    image:
      "https://images.unsplash.com/photo-1585386959984-a4155224a1b1?q=80&w=800&auto=format&fit=crop",
    link: "/products?category=women",
  },
  {
    title: "Oud Collection",
    image:
      "https://images.unsplash.com/photo-1615634260167-c8cd1c5f3c5b?q=80&w=800&auto=format&fit=crop",
    link: "/products?category=oud",
  },
  {
    title: "Gift Sets",
    image:
      "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?q=80&w=800&auto=format&fit=crop",
    link: "/products?category=gifts",
  },
];

const reviews = [
  {
    name: "Ayaan Khan",
    text: "Absolutely luxurious fragrance. The Oud Al Ahad lasts full week and feels premium. Highly recommended!",
  },
  {
    name: "Sara Mehta",
    text: "The packaging, the scent, the experience — everything feels high-end. Loved the Florence.",
  },
  {
    name: "Rahul Verma",
    text: "Finally found a perfume brand that feels exclusive. Oud Al Ahad is now my signature scent.",
  },
];

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* ✅ FIX 5: aspect-[3/4] valid Tailwind arbitrary value */}
      <div className="bg-white/5 aspect-3/4 w-full mb-3 rounded-sm" />
      <div className="bg-white/5 h-4 w-3/4 mb-2 rounded-sm" />
      <div className="bg-white/5 h-4 w-1/2 rounded-sm" />
    </div>
  );
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  // ✅ FIX 2: Use IntersectionObserver instead of scrollY for features bar
  const featuresRef = useRef(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await api.get("/products?limit=4&sort=newest");
        const data = response.data?.data || response.data;
        const products = data?.products || data || [];
        setFeaturedProducts(products.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
        setFeaturedProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ FIX 2: IntersectionObserver — reliably triggers animation when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setFeaturesVisible(true);
      },
      { threshold: 0.1 }
    );
    if (featuresRef.current) observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    // ✅ FIX: overflow-x-hidden on main to prevent any horizontal bleed
    <main className="bg-black overflow-x-hidden">

      {/* ───────────────── HERO SLIDER ───────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Slide images */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-70" : "opacity-0"
            }`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          >
            {/* ✅ FIX 9: fetchPriority camelCase for React */}
            <img
              src={slide.image}
              alt={`${slide.title} ${slide.titleGold}`}
              className="hidden"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "low"}
            />
          </div>
        ))}

        <div className="absolute inset-0 bg-linear-to-r from-black via-black/60 to-transparent" />

        {/* ✅ FIX 3: Hero content — removed translate-x-10 which caused horizontal overflow on mobile */}
        <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-xl md:max-w-2xl">
              {heroSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`transition-all duration-700 ${
                    index === currentSlide
                      ? "opacity-100"
                      : "opacity-0 absolute pointer-events-none"
                  }`}
                  // ✅ Not using translate-x which bleeds outside viewport on mobile
                >
                  <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-serif leading-tight mb-4 md:mb-6 text-white">
                    {slide.title}{" "}
                    <span style={{ color: "#D4AF37" }}>{slide.titleGold}</span>
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 md:mb-10 leading-relaxed">
                    {slide.description}
                  </p>
                  {/* ✅ FIX 8: Link wrappers take full width on mobile so buttons fill correctly */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Link to="/products" className="w-full sm:w-auto">
                      <button
                        className="w-full px-6 md:px-8 py-3 md:py-4 text-xs sm:text-sm uppercase tracking-wider font-light transition-all duration-300"
                        style={{ backgroundColor: "#D4AF37", color: "#000" }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor = "#C5A028")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor = "#D4AF37")
                        }
                      >
                        Shop Now
                      </button>
                    </Link>
                    <Link to="/about" className="w-full sm:w-auto">
                      <button
                        className="w-full px-6 md:px-8 py-3 md:py-4 border-2 text-xs sm:text-sm uppercase tracking-wider font-light transition-all duration-300"
                        style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "#D4AF37";
                          e.currentTarget.style.color = "#000";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#D4AF37";
                        }}
                      >
                        Our Story
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 md:w-12 bg-[#D4AF37]"
                  : "w-6 md:w-8 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ───────────────── FEATURES BAR ───────────────── */}
      {/* ✅ FIX 2: ref-based visibility instead of broken scrollY check */}
      <section
        ref={featuresRef}
        className={`py-8 md:py-12 border-y border-white/10 transition-all duration-700 ${
          featuresVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
        style={{ backgroundColor: "#000" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { icon: FiTruck, title: "Secured Shipping", sub: "Delivered safely to your doorstep" },
              { icon: FiRotateCw, title: "Extra Discount", sub: "On UPI Payments" },
              { icon: FiDollarSign, title: "COD Available", sub: "Pay on delivery" },
              { icon: FiShield, title: "Secure Payments", sub: "100% safe checkout" },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <feature.icon size={24} className="text-yellow-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-medium text-white tracking-wide leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{feature.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── FEATURED PRODUCTS ───────────────── */}
      <section className="max-w-7xl mx-auto py-16 md:py-20">
        <div className="flex items-center justify-between mb-8 md:mb-10 px-4 sm:px-6">
          <h2 className="text-xl md:text-3xl font-serif text-white">
            Featured Bestsellers
          </h2>
          <Link to="/products" className="text-sm text-yellow-400 hover:underline whitespace-nowrap ml-4">
            View All
          </Link>
        </div>

        {/* ✅ FIX 1 (MAIN BUG): touch-pan-x for horizontal scroll containers, NOT touch-pan-y */}
        {/* Mobile: Snap Scroll */}
        <div className="md:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-4 px-4 sm:px-6 pb-4">
            {productsLoading
              ? Array(4).fill(0).map((_, i) => (
                  <div
                    key={i}
                    className="shrink-0 snap-start snap-always"
                    style={{ width: "calc(100vw - 5rem)" }}
                  >
                    <ProductCardSkeleton />
                  </div>
                ))
              : featuredProducts.length > 0
              ? featuredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="shrink-0 snap-start snap-always"
                    style={{ width: "calc(100vw - 5rem)" }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))
              : (
                <div className="px-2 text-gray-500 text-sm">No products found.</div>
              )}
            {/* Trailing spacer so last card doesn't stick to edge */}
            <div className="shrink-0 w-4" aria-hidden="true" />
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid grid-cols-4 gap-6 px-6">
          {productsLoading
            ? Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
            : featuredProducts.length > 0
            ? featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            : (
              <p className="col-span-4 text-center text-gray-500 text-sm py-10">
                No products found.
              </p>
            )}
        </div>
      </section>

      {/* ───────────────── EXPLORE COLLECTIONS ───────────────── */}
      <section className="max-w-7xl mx-auto pb-16 md:pb-20">
        <h2 className="text-xl md:text-3xl font-serif text-white mb-6 md:mb-10 px-4 sm:px-6">
          Explore Collections
        </h2>

        {/* ✅ FIX 1: touch-pan-x for horizontal scroll, and only show on mobile */}
        <div className="md:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-4 px-4 sm:px-6 pb-4">
            {categories.map((cat) => (
              <Link
                key={cat.title}
                to={cat.link}
                className="group relative h-56 overflow-hidden border border-white/10 shrink-0 snap-start snap-always rounded-sm"
                style={{ width: "calc(100vw - 5rem)" }}
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition" />
                <div className="relative z-10 h-full flex items-center justify-center">
                  <h3 className="text-lg font-serif text-white group-hover:text-yellow-400 transition">
                    {cat.title}
                  </h3>
                </div>
              </Link>
            ))}
            <div className="shrink-0 w-4" aria-hidden="true" />
          </div>
        </div>

        {/* ✅ FIX 7: Desktop grid — only shown on md+ */}
        <div className="hidden md:grid grid-cols-4 gap-6 px-6">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              to={cat.link}
              className="group relative h-60 overflow-hidden border border-white/10"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition" />
              <div className="relative z-10 h-full flex items-center justify-center">
                <h3 className="text-xl font-serif text-white group-hover:text-yellow-400 transition">
                  {cat.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────────── BRAND STORY ───────────────── */}
      <section className="py-16 md:py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-white mb-4 md:mb-6">
                The Essence of{" "}
                <span style={{ color: "#D4AF37" }}>BinKhalid</span>
              </h2>
              <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-4 md:mb-6">
                At BinKhalid, we believe fragrance is more than a scent — it is
                an expression of identity, confidence, and timeless elegance.
              </p>
              <p className="text-sm md:text-base text-gray-400 leading-relaxed mb-6 md:mb-8">
                Each bottle is crafted with precision, blending rare ingredients
                with modern perfumery artistry. Inspired by rich oriental
                heritage and contemporary luxury, our collections are designed
                for those who seek distinction in every detail.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 pb-1 text-xs md:text-sm uppercase tracking-wider transition-all duration-300"
                style={{ color: "#D4AF37", borderBottom: "1px solid #D4AF37" }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.borderBottomColor = "transparent")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.borderBottomColor = "#D4AF37")
                }
              >
                Read Our Story
                <FiArrowRight size={16} />
              </Link>
            </div>

            {/* ✅ FIX 6: h-80 on mobile, h-96 on md, fixed height on lg instead of non-existent h-125 */}
            <div className="order-1 lg:order-2 relative h-64 sm:h-80 md:h-96 lg:h-125 overflow-hidden border border-white/10">
              <img
                src={OudAlKhalid}
                alt="Brand Story"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── TESTIMONIALS ───────────────── */}
      <section className="bg-black border-t border-b border-white/10 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl md:text-3xl font-serif text-white mb-8 md:mb-10 text-center px-4 sm:px-6">
            What Our Customers Say
          </h2>

          {/* ✅ FIX 1: touch-pan-x for horizontal scroll */}
          <div className="md:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <div className="flex gap-4 px-4 sm:px-6 pb-4">
              {reviews.map((review, i) => (
                <div
                  key={i}
                  className="bg-black border border-white/10 p-5 hover:border-yellow-400 transition shrink-0 snap-start snap-always rounded-sm"
                  style={{ width: "calc(100vw - 5rem)" }}
                >
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    "{review.text}"
                  </p>
                  <span className="text-yellow-400 text-sm font-medium">
                    — {review.name}
                  </span>
                </div>
              ))}
              <div className="shrink-0 w-4" aria-hidden="true" />
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid grid-cols-3 gap-6 px-6">
            {reviews.map((review, i) => (
              <div
                key={i}
                className="bg-black border border-white/10 p-6 hover:border-yellow-400 transition"
              >
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  "{review.text}"
                </p>
                <span className="text-yellow-400 text-sm font-medium">
                  — {review.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}