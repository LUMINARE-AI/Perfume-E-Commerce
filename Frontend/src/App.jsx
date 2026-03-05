import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import SmoothScroll from "./components/layout/SmoothScroll";
import CursorFollower from "./components/ui/CursorFollower";
import OrderSuccess from "./pages/OrderSuccess";
import MyOrders from "./pages/MyOrders";
import OrderDetails from "./pages/OrderDetails";
import DashboardLayout from "./pages/DashboardLayout";
import Profile from "./pages/Profile";
import MyAddresses from "./pages/MyAddresses";
import Security from "./pages/Security";
import RefundPolicy from "./pages/RefundPolicy";
import TermsAndConditions from "./pages/Terms";
import ResetPassword from "./pages/Resetpassword";

// Admin
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminOrders from "./pages/AdminOrders";
import AdminRoute from "./pages/admin/AdminRoute";
import AdminLayout from "./components/layout/AdminLayout";
import AdminReviews from "./pages/AdminReviews";
import PrivacyPolicy from "./pages/Policy";

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {/* Navbar & Footer sirf non-admin routes pe */}
      <Navbar />
      <CursorFollower />
      <SmoothScroll>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/order-success/:id" element={<OrderSuccess />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-orders/:id" element={<OrderDetails />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/policy" element={<PrivacyPolicy />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* User Dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="address" element={<MyAddresses />} />
            <Route path="security" element={<Security />} />
          </Route>

          {/* Admin — apna khud ka layout hai, Navbar/Footer nahi */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reviews" element={<AdminReviews />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </SmoothScroll>
      {!isAdminRoute && <Footer />}
    </>
  );
}