import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { FiCheck, FiX } from "react-icons/fi";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast("Please enter your email address.", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/users/forgot-password", { email });
      setSubmitted(true);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 404) {
        showToast("No account found with this email address.", "error");
      } else if (status === 429) {
        showToast("Too many requests. Please try again later.", "error");
      } else {
        showToast(message || "Something went wrong. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-black min-h-screen flex items-center justify-center px-4">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-2 right-2 md:left-auto md:right-4 md:max-w-sm z-50">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg ${
              toast.type === "success"
                ? "bg-green-500/20 border-green-400 text-green-400"
                : "bg-red-500/20 border-red-400 text-red-400"
            }`}
          >
            {toast.type === "success" ? (
              <FiCheck className="shrink-0" size={16} />
            ) : (
              <FiX className="shrink-0" size={16} />
            )}
            <p className="text-sm">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md border border-white/10 p-8 text-white">

        {submitted ? (
          /* ── Success State ── */
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center mx-auto mb-5">
              <FiCheck className="text-green-400" size={22} />
            </div>
            <h1 className="text-2xl font-serif mb-3">Check Your Email</h1>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              We've sent a password reset link to{" "}
              <span className="text-white">{email}</span>. Please check your
              inbox and follow the instructions.
            </p>
            <p className="text-xs text-gray-600 mb-6">
              Didn't receive it? Check your spam folder or{" "}
              <button
                onClick={() => setSubmitted(false)}
                className="text-yellow-400 hover:underline underline-offset-4 transition"
              >
                try again
              </button>
              .
            </p>
            <Link to="/login">
              <Button className="w-full">Back to Login</Button>
            </Link>
          </div>
        ) : (
          /* ── Form State ── */
          <>
            <h1 className="text-2xl font-serif mb-3 text-center">
              Forgot Password
            </h1>
            <p className="text-sm text-gray-400 mb-7 text-center">
              Enter your email and we'll send you a password reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
              />

              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    <span>Sending...</span>
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <p className="mt-5 text-sm text-center text-gray-400">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-yellow-400 hover:underline underline-offset-4 transition"
              >
                Login
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}