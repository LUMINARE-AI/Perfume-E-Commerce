import express from "express";
import cors from "cors";

import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import userRoutes from "./routes/user.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import delhiveryRoutes from "./routes/delhivery.routes.js";
import razorpayRoutes from "./routes/razorpay.routes.js";
import contactRoutes from "./routes/contact.routes.js";


const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://binkhalid.in",
  "https://www.binkhalid.in",
  "https://perfume-e-commerce.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // ✅ Debug: kaunsa origin aa raha hai
      if (origin) console.log("🌐 Request from origin:", origin);

      // No origin — server-to-server ya Postman
      if (!origin) return callback(null, true);

      // Exact match
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // ✅ Vercel preview deployments allow karo
      if (origin.endsWith(".vercel.app")) return callback(null, true);

      // ✅ Render preview deployments
      if (origin.endsWith(".onrender.com")) return callback(null, true);

      console.error("❌ CORS blocked:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/delhivery", delhiveryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/contact", contactRoutes);

export default app;