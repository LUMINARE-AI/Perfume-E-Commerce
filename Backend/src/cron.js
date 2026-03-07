import cron from "node-cron";
import { retryPendingShipments } from "./jobs/retryShipment.js";
import { updateTrackingStatus } from "./jobs/updateTracking.js";

export const startCronJobs = () => {

  // Shipment retry every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("Running shipment retry job...");
    await retryPendingShipments();
  });

  // Tracking update every 20 minutes
  cron.schedule("*/20 * * * *", async () => {
    console.log("Updating shipment tracking...");
    await updateTrackingStatus();
  });

};