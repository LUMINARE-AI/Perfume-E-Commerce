import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiEye, FiEyeOff, FiCheck, FiX } from "react-icons/fi";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import api from "../api/axios";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [success, setSuccess] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      showToast("Please enter a new password.", "error");
      return;
    }

    if (password.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/users/reset-password/${token}`, { newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 400) {
        showToast("This reset link is invalid or has expired.", "error");
      } else if (status === 404) {
        showToast("Reset link not found. Please request a new one.", "error");
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
        <div className="fixed top-6 left-2 right-2 md:left-auto md:right-4 md:max-w-sm" style={{ zIndex: 50 }}>
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

        {success ? (
          /* ── Success State ── */
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center mx-auto mb-5">
              <FiCheck className="text-green-400" size={22} />
            </div>
            <h1 className="text-2xl font-serif mb-3">Password Updated</h1>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Your password has been reset successfully. Redirecting you to
              login...
            </p>
            <Link to="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </div>

        ) : (
          /* ── Form State ── */
          <>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest hover:text-yellow-400 transition mb-8"
            >
              <FiArrowLeft size={13} />
              Back to Login
            </Link>

            <h1 className="text-2xl font-serif mb-2">Reset Password</h1>
            <div className="h-px w-10 bg-yellow-400 mb-6" />
            <p className="text-sm text-gray-400 mb-7 leading-relaxed">
              Enter a new password for your account. Make sure it's at least 8
              characters long.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-yellow-400 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-yellow-400 transition"
                  tabIndex={-1}
                >
                  {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>

                {/* Match indicator */}
                {confirmPassword && (
                  <p
                    className={`text-xs mt-1.5 ${
                      password === confirmPassword
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {password === confirmPassword
                      ? "✓ Passwords match"
                      : "✗ Passwords do not match"}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    <span>Updating...</span>
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>

            <p className="mt-5 text-xs text-center text-gray-600 leading-relaxed">
              Link expired?{" "}
              <Link
                to="/forgot-password"
                className="text-yellow-400 hover:underline underline-offset-4 transition"
              >
                Request a new one
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}