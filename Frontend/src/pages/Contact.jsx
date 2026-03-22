import { useState } from "react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useToast } from "../contexts/ToastContext";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const { error: showError } = useToast();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = (e) => {
  e.preventDefault();

  if (!form.name || !form.email || !form.message) {
    showError("Please fill all fields.");
    return;
  }

  const phoneNumber = "918432666699";
  const text = `New Contact Message:
Name: ${form.name}
Email: ${form.email}
Message: ${form.message}`;

  const encodedText = encodeURIComponent(text);

  window.open(`https://wa.me/${phoneNumber}?text=${encodedText}`, "_blank");
};

  return (
    <main className="bg-black min-h-screen mt-10 text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-serif mb-8">
          Contact Us
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Your Name"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
            <Input
              label="Your Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Message
              </label>
              <textarea
                name="message"
                rows={5}
                value={form.message}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-transparent border border-white/20 text-white focus:outline-none focus:border-yellow-400"
              />
            </div>

            <Button type="submit">
              Send Message
            </Button>
          </form>

          {/* Info */}
          <div className="space-y-4 text-gray-300">
            <p>
              <span className="text-gray-400">Email:</span>{" "}
              contact@binkhalid.in 
            </p>
            <p>
              <span className="text-gray-400">Phone:</span>{" "}
              +91 84326 66699
            </p>
            <p>
              <span className="text-gray-400">Address:</span>{" "}
              Raj talkies road, Bada Kuan, Tonk, Rajasthan, India
            </p>

            <p className="mt-6 text-gray-400">
              Our team will get back to you within 24–48 hours.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
