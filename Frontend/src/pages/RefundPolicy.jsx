import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export default function RefundPolicy() {
  return (
    <main className="bg-black min-h-screen">
      <div className="max-w-2xl mx-auto px-5 pt-28 pb-20">

        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest hover:text-yellow-400 transition mb-12"
        >
          <FiArrowLeft size={13} />
          Back
        </Link>

        {/* Heading */}
        <h1 className="font-serif text-3xl md:text-4xl text-white mb-2">
          Returns & Refund Policy
        </h1>
        <div className="h-px w-12 bg-yellow-400 mb-8" />

        <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-12">
          We want every BinKhalid order to reach you perfectly. Please take a
          moment to read our policy before placing your order.
        </p>

        {/* Section 1 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            No Returns or Refunds After Shipment
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Once your order has been shipped, we are unable to accept returns or
            process refunds. Fragrances and perfumes are personal hygiene
            products — once they leave our facility, they cannot be restocked or
            resold for the safety and wellbeing of all our customers. We
            appreciate your understanding on this.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 2 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Order Cancellation
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            You can cancel your order at any time before it has been shipped.
            Just get in touch with our support team as soon as possible and
            we'll cancel it without any hassle. Once an order is dispatched,
            cancellation is no longer possible.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 3 */}
        <div className="mb-12">
          <h2 className="text-white text-base font-medium mb-3">
            Damaged or Wrong Product?
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            If you've received a damaged bottle, a wrong item, or something
            doesn't seem right — please reach out to us immediately. We'll look
            into it and make it right. Every concern is taken seriously and we
            aim to resolve issues as quickly as possible.
          </p>
        </div>

        {/* Contact */}
        <div className="border-t border-white/10 pt-8">
          <p className="text-gray-500 text-sm mb-1">Still have a question?</p>
          <Link
            to="/contact"
            className="text-yellow-400 text-sm hover:underline underline-offset-4 transition"
          >
            Contact our support team →
          </Link>
        </div>

      </div>
    </main>
  );
}