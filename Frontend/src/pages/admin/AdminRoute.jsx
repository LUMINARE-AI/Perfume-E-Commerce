import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading"); // "loading" | "admin" | "denied"

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("denied");
      return;
    }

    api
      .get("/users/me")
      .then((res) => {
        const role = res.data?.data?.role;
        setStatus(role === "admin" ? "admin" : "denied");
      })
      .catch(() => {
        localStorage.removeItem("token");
        setStatus("denied");
      });
  }, []);

  if (status === "loading") {
    // Blank black screen while verifying — no flicker, no wrong redirect
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/login" replace />;
  }

  return children;
}