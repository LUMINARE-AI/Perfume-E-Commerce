import { useState } from "react";
import api from "../api/axios";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { logout } from "../utils/authUtils"; // ← adjust path if needed

export default function Security() {
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
  });

  const changePassword = async () => {
    await api.put("/users/change-password", passwords);
    alert("Password updated");
  };

  return (
    <div className="border border-white/10 p-6">
      <h2 className="font-serif text-xl mb-4">Security</h2>

      <div className="space-y-4 mb-6">
        <Input
          label="Old Password"
          type="password"
          onChange={(e) =>
            setPasswords({ ...passwords, oldPassword: e.target.value })
          }
        />
        <Input
          label="New Password"
          type="password"
          onChange={(e) =>
            setPasswords({ ...passwords, newPassword: e.target.value })
          }
        />
        <Button onClick={changePassword}>Change Password</Button>
      </div>

      {/* logout() with no navigate → uses window.location.href = "/login" */}
      <Button variant="outline" onClick={() => logout(null, "/login")}>
        Logout
      </Button>
    </div>
  );
}