import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export default function TermsAndConditions() {
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
          Terms & Conditions
        </h1>
        <div className="h-px w-12 bg-yellow-400 mb-8" />

        <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-12">
          By using our website and placing an order with BinKhalid, you agree
          to the following terms. Please read them carefully.
        </p>

        {/* Section 1 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            General Use
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            This website is intended for personal, non-commercial use only. You
            agree not to misuse the platform, attempt to gain unauthorized
            access, or engage in any activity that disrupts the normal
            functioning of the site. We reserve the right to suspend or
            terminate access to any user who violates these terms.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 2 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Orders & Pricing
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            All prices listed on our website are in Indian Rupees (₹) and are
            inclusive of applicable taxes unless stated otherwise. We reserve
            the right to update prices at any time without prior notice.
            Placing an order constitutes an agreement to purchase at the listed
            price at the time of checkout. In the rare event of a pricing
            error, we will notify you and offer the option to confirm or cancel
            your order.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 3 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Payments
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We accept multiple payment methods including UPI, cards, net
            banking, and cash on delivery. All online transactions are
            processed securely. BinKhalid does not store your payment details.
            In case of a payment failure, please do not attempt the transaction
            multiple times before confirming with your bank.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 4 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Shipping & Delivery
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We ship across India. Delivery timelines are estimates and may vary
            depending on your location, courier availability, and other
            external factors. BinKhalid is not responsible for delays caused by
            the courier partner or circumstances beyond our control. Once an
            order is shipped, a tracking link will be shared with you.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 5 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Returns & Refunds
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Please refer to our{" "}
            <Link
              to="/refund-policy"
              className="text-yellow-400 hover:underline underline-offset-4 transition"
            >
              Returns & Refund Policy
            </Link>{" "}
            for complete details. In summary — orders can be cancelled before
            shipment, and returns are not accepted once the product has been
            dispatched due to the personal hygiene nature of fragrance products.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 6 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Intellectual Property
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            All content on this website — including product images, brand name,
            logo, and descriptions — is the property of BinKhalid and may not
            be copied, reproduced, or used without written permission. Any
            unauthorized use of our content may result in legal action.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 7 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Limitation of Liability
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            BinKhalid shall not be held liable for any indirect, incidental, or
            consequential damages arising from the use of our products or
            website. Our liability is limited to the value of the order placed.
            We strongly recommend checking ingredient details if you have known
            skin or fragrance sensitivities before purchasing.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 8 */}
        <div className="mb-12">
          <h2 className="text-white text-base font-medium mb-3">
            Changes to These Terms
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We may update these terms from time to time. Any changes will be
            reflected on this page with immediate effect. Continued use of our
            website after changes are made constitutes your acceptance of the
            revised terms. We recommend reviewing this page periodically.
          </p>
        </div>

        {/* Contact */}
        <div className="border-t border-white/10 pt-8">
          <p className="text-gray-500 text-sm mb-1">Have a question about our terms?</p>
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