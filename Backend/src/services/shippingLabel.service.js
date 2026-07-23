import bwipjs from "bwip-js";
import puppeteer from "puppeteer";
import Order from "../models/order.model.js";
import axios from "axios";

const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const BASE_URL = IS_PRODUCTION
  ? "https://track.delhivery.com"
  : "https://staging-express.delhivery.com";

const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Optional routing fields from Delhivery packing-slip JSON (not their PDF).
 */
const fetchRoutingInfo = async (waybill) => {
  if (!DELHIVERY_API_KEY) return {};

  try {
    const response = await axios.get(`${BASE_URL}/api/p/packing_slip`, {
      params: { wbns: waybill },
      headers: {
        Authorization: `Token ${DELHIVERY_API_KEY}`,
        Accept: "application/json",
      },
      timeout: 15000,
    });

    const pkg = response.data?.packages?.[0] || response.data?.package || {};
    return {
      sortCode:
        pkg.sort_code ||
        pkg.destination ||
        pkg.Destination ||
        pkg.center ||
        "",
      productType: pkg.pt || pkg.payment || "",
    };
  } catch {
    return {};
  }
};

const buildBarcodeDataUrl = async (waybill) => {
  const png = await bwipjs.toBuffer({
    bcid: "code128",
    text: String(waybill),
    scale: 3,
    height: 14,
    includetext: false,
    backgroundcolor: "FFFFFF",
  });
  return `data:image/png;base64,${png.toString("base64")}`;
};

const buildLabelHtml = ({
  brand,
  waybill,
  barcodeDataUrl,
  address,
  paymentMode,
  sortCode,
  items,
  totalPrice,
  orderId,
}) => {
  const productRows = items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.name)}${item.qty > 1 ? ` × ${item.qty}` : ""}</td>
        <td class="right">${formatINR(item.price * item.qty)}</td>
      </tr>`
    )
    .join("");

  const fullAddress = [
    address.address,
    address.city,
    address.state,
    address.country || "India",
  ]
    .filter(Boolean)
    .join(", ");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      position: relative;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      width: 4in;
      height: 6in;
      padding: 10px 12px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1.5px solid #111;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .brand { font-size: 13px; font-weight: 700; letter-spacing: 0.2px; }
    .carrier { font-size: 11px; font-weight: 700; color: #c41230; }
    .barcode-wrap {
      text-align: center;
      padding: 6px 0 4px;
      border-bottom: 1px solid #111;
      margin-bottom: 8px;
    }
    .barcode-wrap img {
      max-width: 100%;
      height: 52px;
      object-fit: contain;
    }
    .awb {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .route {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px solid #111;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .pin { font-size: 18px; font-weight: 700; }
    .sort { font-size: 16px; font-weight: 700; }
    .ship-block {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid #111;
      padding-bottom: 8px;
      margin-bottom: 8px;
      min-height: 110px;
    }
    .ship-main { flex: 1; }
    .label-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .name { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
    .addr { font-size: 11px; line-height: 1.35; }
    .phone { font-size: 11px; margin-top: 4px; }
    .pay {
      width: 72px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      border-left: 1px solid #ddd;
      padding-left: 6px;
      align-self: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    th, td {
      border-bottom: 1px solid #ddd;
      padding: 3px 0;
      vertical-align: top;
    }
    th { text-align: left; font-size: 9px; text-transform: uppercase; }
    .right { text-align: right; white-space: nowrap; }
    .total-row td {
      border-bottom: none;
      font-weight: 700;
      padding-top: 5px;
    }
    .footer {
      position: absolute;
      bottom: 10px;
      left: 12px;
      right: 12px;
      font-size: 8px;
      color: #555;
      border-top: 1px solid #ccc;
      padding-top: 4px;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">${escapeHtml(brand)}</div>
    <div class="carrier">DELHIVERY</div>
  </div>

  <div class="barcode-wrap">
    <img src="${barcodeDataUrl}" alt="AWB barcode" />
    <div class="awb">${escapeHtml(waybill)}</div>
  </div>

  <div class="route">
    <div class="pin">${escapeHtml(address.pincode || "")}</div>
    <div class="sort">${escapeHtml(sortCode || "")}</div>
  </div>

  <div class="ship-block">
    <div class="ship-main">
      <div class="label-title">Shipping Address</div>
      <div class="name">${escapeHtml(address.name || "")}</div>
      <div class="addr">${escapeHtml(fullAddress)}</div>
      <div class="addr">PIN: ${escapeHtml(address.pincode || "")}</div>
      ${
        address.phone
          ? `<div class="phone">Ph: ${escapeHtml(address.phone)}</div>`
          : ""
      }
    </div>
    <div class="pay">${escapeHtml(paymentMode)}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${productRows}
      <tr class="total-row">
        <td>Total</td>
        <td class="right">${formatINR(totalPrice)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <span>Order: ${escapeHtml(String(orderId).slice(-8).toUpperCase())}</span>
    <span>No returns accepted</span>
  </div>
</body>
</html>`;
};

/**
 * Generate a custom shipping label PDF (no seller/return address).
 */
export const generateCustomShippingLabel = async (waybill) => {
  try {
    if (!waybill) {
      return {
        success: false,
        error: { message: "Waybill number is required" },
      };
    }

    const order = await Order.findOne({ "delivery.awb": waybill });
    if (!order) {
      return {
        success: false,
        error: { message: "No order found for this AWB" },
      };
    }

    const [barcodeDataUrl, routing] = await Promise.all([
      buildBarcodeDataUrl(waybill),
      fetchRoutingInfo(waybill),
    ]);

    const brand = process.env.DELHIVERY_PICKUP_NAME || "BinKhalid";
    const paymentMode =
      order.paymentMethod === "COD" ? "COD" : "Pre-paid";

    const html = buildLabelHtml({
      brand,
      waybill,
      barcodeDataUrl,
      address: order.shippingAddress || {},
      paymentMode,
      sortCode: routing.sortCode || "",
      items: order.items || [],
      totalPrice: order.totalPrice,
      orderId: order._id,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      const pdf = await page.pdf({
        width: "4in",
        height: "6in",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      return {
        success: true,
        data: Buffer.from(pdf),
        contentType: "application/pdf",
      };
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Custom shipping label error:", error);
    return {
      success: false,
      error: {
        message: error.message || "Failed to generate custom label",
      },
    };
  }
};

export default {
  generateCustomShippingLabel,
};
