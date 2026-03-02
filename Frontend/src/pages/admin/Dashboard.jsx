import { useEffect, useState } from "react";
import { FiUsers, FiShoppingBag, FiPackage, FiDollarSign, FiTrendingUp, FiStar } from "react-icons/fi";
import api from "../../api/axios";
import { useToast } from "../../contexts/ToastContext";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data.data);
      } catch (err) {
        showError(err.response?.data?.message || "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [showError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statsConfig = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <FiUsers />,
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: <FiShoppingBag />,
      iconColor: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
    },
    {
      title: "Products",
      value: stats.totalProducts,
      icon: <FiPackage />,
      iconColor: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue?.toLocaleString() || 0}`,
      icon: <FiDollarSign />,
      iconColor: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Welcome back, Admin</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <FiTrendingUp className="text-green-400" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsConfig.map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 100} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <QuickActionCard
          title="Recent Activity"
          description="View and manage recent orders and user activities"
          icon={<FiShoppingBag />}
        />
        <QuickActionCard
          title="Product Management"
          description="Add, edit, or remove products from your inventory"
          icon={<FiPackage />}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, iconColor, bgColor, borderColor, delay }) {
  return (
    <div
      className={`
        relative overflow-hidden border ${borderColor} ${bgColor}
        backdrop-blur-sm p-6 transition-all duration-300
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className={`inline-flex p-3 rounded-lg ${bgColor} border ${borderColor} mb-4`}>
        <div className={`text-2xl ${iconColor}`}>
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <p className={`text-3xl font-bold ${iconColor}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon }) {
  return (
    <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:border-yellow-400/50 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-2xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}