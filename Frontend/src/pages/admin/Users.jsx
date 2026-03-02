import { useEffect, useState } from "react";
import { FiUsers, FiMail, FiShield, FiSearch } from "react-icons/fi";
import api from "../../api/axios";
import { useToast } from "../../contexts/ToastContext";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { error: showError } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/admin/users");
        setUsers(res.data.data || []);
      } catch (err) {
        showError(err.response?.data?.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [showError]);

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
            Users Management
          </h1>
          <p className="text-gray-400 mt-1">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition"
        />
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden md:block overflow-x-auto border border-white/10 bg-white/5 backdrop-blur-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-300">User</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-300">Email</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-300">Role</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-300">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-semibold">
                        {user.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span className="text-white font-medium">{user.name || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <FiMail className="text-gray-500" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`
                        px-3 py-1 text-xs font-medium border
                        ${
                          user.role === "admin"
                            ? "bg-red-500/10 text-red-400 border-red-400/30"
                            : "bg-blue-500/10 text-blue-400 border-blue-400/30"
                        }
                      `}
                    >
                      <FiShield className="inline mr-1" />
                      {user.role || "user"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              className="border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-3 hover:border-yellow-400/50 transition"
            >
              {/* User Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-semibold text-lg shrink-0">
                  {user.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{user.name || "Unknown"}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 truncate">
                    <FiMail size={12} />
                    {user.email}
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Role</p>
                  <span
                    className={`
                      inline-block px-2 py-1 text-xs font-medium border
                      ${
                        user.role === "admin"
                          ? "bg-red-500/10 text-red-400 border-red-400/30"
                          : "bg-blue-500/10 text-blue-400 border-blue-400/30"
                      }
                    `}
                  >
                    {user.role || "user"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Joined</p>
                  <p className="text-white text-sm">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {users.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="border border-white/10 bg-blue-500/10 p-4">
            <p className="text-xs text-gray-400 mb-1">Regular Users</p>
            <p className="text-2xl font-bold text-blue-400">
              {users.filter((u) => u.role !== "admin").length}
            </p>
          </div>
          <div className="border border-white/10 bg-red-500/10 p-4">
            <p className="text-xs text-gray-400 mb-1">Administrators</p>
            <p className="text-2xl font-bold text-red-400">
              {users.filter((u) => u.role === "admin").length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}