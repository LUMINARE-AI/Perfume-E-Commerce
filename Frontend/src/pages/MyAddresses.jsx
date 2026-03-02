import { useEffect, useState } from "react";
import api from "../api/axios";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function MyAddresses() {
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    api.get("/users/address").then((res) => {
      if (res.data.data) setAddress(res.data.data);
    });
  }, []);

  const saveAddress = async () => {
    await api.put("/users/address", address);
    alert("Address saved");
  };

  return (
    <div className="border border-white/10 p-6">
      <h2 className="font-serif text-xl mb-4">Shipping Address</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(address).map((key) => (
          <Input
            key={key}
            label={key.toUpperCase()}
            value={address[key]}
            onChange={(e) =>
              setAddress({ ...address, [key]: e.target.value })
            }
          />
        ))}
      </div>

      <Button className="mt-6" onClick={saveAddress}>
        Save Address
      </Button>
    </div>
  );
}
