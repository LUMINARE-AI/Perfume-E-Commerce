import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.post(
        "http://localhost:8000/api/users/login",
        form
      );

      // adjust according to your backend response structure
      const token = data?.data?.accessToken;
      const user = data?.data?.user;

      if (!token) {
        throw new Error("Token not received");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect after login
      navigate("/products");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-black min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-white/10 p-8 text-white">
        <h1 className="text-2xl font-serif mb-6 text-center">
          Login to Your Account
        </h1>

        {error && (
          <p className="mb-4 text-sm text-red-400 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-center text-gray-400">
          <Link to="/forgot-password" className="hover:text-yellow-400">
            Forgot password?
          </Link>
        </div>

        <p className="mt-4 text-sm text-center text-gray-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-yellow-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
