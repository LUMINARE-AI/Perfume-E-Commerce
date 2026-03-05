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
import invoiceRoutes from "./routes/invoice.routes.js";

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "https://binkhalid.in",
  "https://www.binkhalid.in"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
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
app.use("/api/invoices", invoiceRoutes);

export default app;
