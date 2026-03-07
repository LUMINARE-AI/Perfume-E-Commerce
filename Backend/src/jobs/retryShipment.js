import Order from "../models/order.model.js";
import { createShipment } from "../services/delhivery.service.js";

export const retryPendingShipments = async () => {
  try {
    const orders = await Order.find({
      "delivery.status": "pending",
      "delivery.retryCount": { $lt: 3 },
    });

    for (const order of orders) {
      try {
        const res = await createShipment({
          customerName: order.shippingAddress.name,
          customerAddress: order.shippingAddress.address,
          customerPincode: order.shippingAddress.pincode,
          customerCity: order.shippingAddress.city,
          customerState: order.shippingAddress.state,
          customerCountry: order.shippingAddress.country || "India",
          customerPhone: order.shippingAddress.phone,

          orderNumber: order._id.toString(),
          paymentMode: order.paymentMethod === "COD" ? "COD" : "Pre-paid",

          productDescription: order.items.map((i) => i.name).join(", "),
          codAmount: order.paymentMethod === "COD" ? order.totalPrice : 0,
          totalAmount: order.totalPrice,

          quantity: order.items.reduce((s, i) => s + i.qty, 0),
          weight: 0.5,

          pickupLocationName:
            process.env.DELHIVERY_PICKUP_NAME || "BinKhalid",
        });

        const awb =
          res?.data?.packages?.[0]?.waybill ||
          res?.data?.waybill ||
          null;

        if (awb) {
          order.delivery.awb = awb;
          order.delivery.status = "pending";
          order.delivery.trackingUrl = `https://www.delhivery.com/track-v2/package/${awb}`;
        }

      } catch (err) {
        console.error("Retry shipment failed:", err.message);
        order.delivery.retryCount = (order.delivery.retryCount || 0) + 1;
      }

      await order.save();
    }

    console.log(`Retry shipment job completed`);
  } catch (err) {
    console.error("Retry job error:", err);
  }
};