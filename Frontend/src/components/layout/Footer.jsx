import { Link } from "react-router-dom";
import { FiInstagram, FiFacebook, FiTwitter, FiMail, FiMapPin, FiPhone } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="relative bg-black border-t border-[#D4AF37]/20 overflow-hidden">
      {/* Elegant Top Gradient Line */}
      <div className="h-0.5 bg-linear-to-r from-transparent via-[#D4AF37] to-transparent"></div>
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4AF37] rounded-full blur-[120px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 text-white">
          
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h2
                className="text-3xl font-serif mb-2 tracking-[0.15em] transition-all duration-500 hover:drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                style={{ color: "#D4AF37" }}
              >
                BinKhalid
              </h2>
              <p className="text-[10px] tracking-[0.4em] text-white/40 uppercase font-light">
                Epitome Of Perfume
              </p>
              <div 
                className="mt-3 h-px w-20 bg-linear-to-r from-[#D4AF37] to-transparent"
              ></div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 font-light">
              Discover timeless luxury fragrances crafted for elegance, confidence,
              and unforgettable impressions.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-3 group">
                <FiMapPin 
                  className="mt-1 transition-colors duration-300 group-hover:text-[#D4AF37]" 
                  size={16} 
                />
                <span className="font-light leading-relaxed">
                  Raj talkies road, Bda kuaa<br /> Tonk, Rajasthan, India
                </span>
              </div>
              <div className="flex items-center gap-3 group">
                <FiPhone 
                  className="transition-colors duration-300 group-hover:text-[#D4AF37]" 
                  size={16} 
                />
                <span className="font-light">+91 84326 66699</span>
              </div>
              <div className="flex items-center gap-3 group">
                <FiMail 
                  className="transition-colors duration-300 group-hover:text-[#D4AF37]" 
                  size={16} 
                />
                <span className="font-light">contact@binkhalid.in</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm uppercase tracking-[0.2em] mb-6 font-light relative inline-block">
              <span className="relative z-10" style={{ color: "#D4AF37" }}>Quick Links</span>
              <span className="absolute bottom-0 left-0 w-full h-px bg-[#D4AF37]/30"></span>
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { to: "/products", label: "Shop Collection" },
                { to: "/about", label: "About Us" },
                { to: "/contact", label: "Contact" },
                { to: "/faq", label: "FAQ" },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="group flex items-center gap-2 transition-all duration-300 hover:translate-x-2"
                  >
                    <span className="w-0 h-px bg-[#D4AF37] group-hover:w-4 transition-all duration-300"></span>
                    <span className="text-gray-400 group-hover:text-[#D4AF37] transition-colors duration-300 font-light">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-sm uppercase tracking-[0.2em] mb-6 font-light relative inline-block">
              <span className="relative z-10" style={{ color: "#D4AF37" }}>Customer Care</span>
              <span className="absolute bottom-0 left-0 w-full h-px bg-[#D4AF37]/30"></span>
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { to: "/terms", label: "Terms & Conditions" },
                { to: "/policy", label: "Privacy Policy" },
                { to: "/refund-policy", label: "Returns & Refunds" },
                { to: "/https://www.delhivery.com/", label: "Track Order" },
                { to: "/contact", label: "Customer Support" },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="group flex items-center gap-2 transition-all duration-300 hover:translate-x-2"
                  >
                    <span className="w-0 h-px bg-[#D4AF37] group-hover:w-4 transition-all duration-300"></span>
                    <span className="text-gray-400 group-hover:text-[#D4AF37] transition-colors duration-300 font-light">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            {/* Social Media */}
            <div className="mt-8 pt-6 border-t border-white/0">
              <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider font-light">
                Follow Us
              </p>
              <div className="flex gap-4">
                {[
                  { Icon: FiInstagram, href: "https://www.instagram.com/binkhalid_perfumes/", label: "Instagram" },
                  { Icon: FiFacebook, href: "https://www.facebook.com/binkhalidperfumes", label: "Facebook" },
                  { Icon: FiTwitter, href: "https://twitter.com/binkhalid_perf", label: "Twitter" },
                // eslint-disable-next-line no-unused-vars
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 border border-white/20 hover:border-[#D4AF37] flex items-center justify-center transition-all duration-500 group hover:scale-110 relative"
                    aria-label={label}
                  >
                    <Icon 
                      className="text-white group-hover:text-[#D4AF37] transition-colors duration-500 relative z-10" 
                      size={18} 
                    />
                    <span className="absolute inset-0 bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/10 transition-all duration-500"></span>
                    <span className="absolute inset-0 bg-[#D4AF37]/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Divider */}
        <div className="mt-16 mb-8 h-px bg-linear-to-r from-transparent via-[#D4AF37]/30 to-transparent"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-gray-500 text-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <p className="font-light tracking-wide">
              © {new Date().getFullYear()} BinKhalid Perfumes. All rights reserved.
            </p>
          </div>

          {/* Developed By */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 uppercase tracking-wider font-light">Developed By</span>
            <div className="flex items-center gap-2">
              <a href="https://www.linkedin.com/in/aditya-jain-050159327/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-[#D4AF37] transition-colors duration-300">
                Aditya Jain
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Decorative Line */}
      <div className="h-px bg-linear-to-r from-transparent via-[#D4AF37]/20 to-transparent"></div>
    </footer>
  );
}