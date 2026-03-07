import Order from "../models/order.model.js";
import { trackShipment } from "../services/delhivery.service.js";

export const updateTrackingStatus = async () => {
  try {
    const orders = await Order.find({
      "delivery.awb": { $exists: true },
      status: { $nin: ["delivered", "cancelled"] },
    });

    for (const order of orders) {
      try {
        const res = await trackShipment(order.delivery.awb);

        const shipment =
          res?.data?.ShipmentData?.[0]?.Shipment || null;

        if (!shipment) continue;

        const status = shipment.Status?.Status;

        if (status === "Delivered") {
          order.status = "delivered";
          order.delivery.status = "delivered";
          order.deliveredAt = new Date();
        }

        if (status === "In Transit") {
          order.status = "shipped";
          order.delivery.status = "in_transit";
        }

        await order.save();
      } catch (err) {
        console.error("Tracking update error:", err.message);
      }
    }

    console.log("Tracking update job completed");
  } catch (err) {
    console.error("Tracking cron error:", err);
  }
};