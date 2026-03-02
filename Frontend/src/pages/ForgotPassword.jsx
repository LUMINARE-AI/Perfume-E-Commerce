import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    alert("Password reset link sent (demo)");
  };

  return (
    <main className="bg-black min-h-screen mt-14 flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-white/10 p-8 text-white">
        <h1 className="text-2xl font-serif mb-4 text-center">
          Forgot Password
        </h1>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Enter your email and we’ll send you a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button type="submit" className="w-full">
            Send Reset Link
          </Button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-400">
          Remember your password?{" "}
          <Link to="/login" className="text-yellow-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
