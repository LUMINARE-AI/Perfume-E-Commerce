import { useEffect, useState } from "react";
import api from "../api/axios";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useToast } from "../contexts/ToastContext";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const { success } = useToast();

  useEffect(() => {
    api.get("/users/me").then((res) => {
      setUser(res.data.data);
      setForm({
        name: res.data.data.name,
        email: res.data.data.email,
      });
    });
  }, []);

  const updateProfile = async () => {
    await api.put("/users/me", form);
    success("Profile updated");
  };

  if (!user) return <p className="text-white">Loading...</p>;

  return (
    <div className="border border-white/10 p-6">
      <h2 className="font-serif text-xl mb-4">Profile</h2>

      <div className="space-y-4">
        <Input
          label="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <Button onClick={updateProfile}>Save Changes</Button>
      </div>
    </div>
  );
}
