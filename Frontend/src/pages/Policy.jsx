import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>
        <div className="h-px w-12 bg-yellow-400 mb-8" />

        <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-12">
          Your privacy matters to us. This policy explains what information we
          collect, how we use it, and how we keep it safe when you shop with
          BinKhalid.
        </p>

        {/* Section 1 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Information We Collect
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            When you create an account or place an order, we collect basic
            information such as your name, email address, phone number, and
            delivery address. We also collect information about your orders and
            browsing activity on our website to improve your shopping
            experience.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 2 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            How We Use Your Information
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            The information we collect is used solely to process your orders,
            deliver your products, and communicate with you about your
            purchases. We may also use your email to send order updates or
            occasional offers. We do not use your data for any purpose beyond
            what is necessary to serve you.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 3 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Sharing of Information
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We do not sell, trade, or rent your personal information to anyone.
            Your details are only shared with trusted third-party services that
            help us operate — such as our delivery partner for shipping your
            order. These parties are bound to keep your information confidential
            and may only use it for the specific purpose of fulfilling your
            order.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 4 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Payment Information
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            BinKhalid does not store any payment details such as card numbers or
            UPI IDs. All payments are processed through secure, encrypted
            payment gateways. We never have access to your financial
            credentials.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 5 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Cookies
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Our website uses cookies to remember your preferences and improve
            your browsing experience. Cookies help us understand how visitors
            use our site so we can make it better. You can choose to disable
            cookies through your browser settings, though this may affect some
            features of the website.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 6 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Data Security
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We take reasonable measures to protect your personal information
            from unauthorized access, misuse, or disclosure. However, no method
            of transmission over the internet is completely secure, and we
            cannot guarantee absolute security. We encourage you to keep your
            account credentials private and not share them with anyone.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 7 */}
        <div className="mb-10">
          <h2 className="text-white text-base font-medium mb-3">
            Your Rights
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            You have the right to access, update, or request deletion of your
            personal information at any time. If you wish to do so, simply
            reach out to our support team and we will assist you promptly. You
            may also unsubscribe from our emails at any time using the
            unsubscribe link at the bottom of any email we send.
          </p>
        </div>

        <div className="h-px bg-white/5 mb-10" />

        {/* Section 8 */}
        <div className="mb-12">
          <h2 className="text-white text-base font-medium mb-3">
            Changes to This Policy
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We may update this privacy policy from time to time to reflect
            changes in how we operate. Any updates will be posted on this page
            and take effect immediately. We recommend revisiting this page
            occasionally to stay informed.
          </p>
        </div>

        {/* Contact */}
        <div className="border-t border-white/10 pt-8">
          <p className="text-gray-500 text-sm mb-1">
            Questions about your privacy?
          </p>
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