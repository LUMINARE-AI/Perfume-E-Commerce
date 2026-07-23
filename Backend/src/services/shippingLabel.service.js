import bwipjs from "bwip-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Order from "../models/order.model.js";
import axios from "axios";

const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const BASE_URL = IS_PRODUCTION
  ? "https://track.delhivery.com"
  : "https://staging-express.delhivery.com";

// 4x6 inch label in PDF points (1in = 72pt)
const PAGE_WIDTH = 288;
const PAGE_HEIGHT = 432;

const formatINR = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const wrapText = (text, font, size, maxWidth) => {
  const words = String(text || "")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return [];

  const lines = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const next = `${current} ${words[i]}`;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
};

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
    };
  } catch {
    return {};
  }
};

const buildBarcodePng = async (waybill) =>
  bwipjs.toBuffer({
    bcid: "code128",
    text: String(waybill),
    scale: 3,
    height: 14,
    includetext: false,
    backgroundcolor: "FFFFFF",
  });

const drawLine = (page, y, x1 = 16, x2 = PAGE_WIDTH - 16) => {
  page.drawLine({
    start: { x: x1, y },
    end: { x: x2, y },
    thickness: 1,
    color: rgb(0.1, 0.1, 0.1),
  });
};

/**
 * Generate a custom shipping label PDF with pdf-lib (no Chrome required).
 * No seller/return address on the label.
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

    const [barcodePng, routing] = await Promise.all([
      buildBarcodePng(waybill),
      fetchRoutingInfo(waybill),
    ]);

    const brand = process.env.DELHIVERY_PICKUP_NAME || "BinKhalid";
    const paymentMode = order.paymentMethod === "COD" ? "COD" : "Pre-paid";
    const address = order.shippingAddress || {};
    const items = order.items || [];
    const sortCode = routing.sortCode || "";

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const barcodeImage = await pdfDoc.embedPng(barcodePng);

    let y = PAGE_HEIGHT - 22;

    // Header
    page.drawText(brand, {
      x: 16,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05),
    });
    page.drawText("DELHIVERY", {
      x: PAGE_WIDTH - 16 - fontBold.widthOfTextAtSize("DELHIVERY", 10),
      y,
      size: 10,
      font: fontBold,
      color: rgb(0.77, 0.07, 0.19),
    });

    y -= 10;
    drawLine(page, y);
    y -= 12;

    // Barcode
    const barcodeWidth = 220;
    const barcodeHeight = 48;
    page.drawImage(barcodeImage, {
      x: (PAGE_WIDTH - barcodeWidth) / 2,
      y: y - barcodeHeight,
      width: barcodeWidth,
      height: barcodeHeight,
    });
    y -= barcodeHeight + 6;

    const awbWidth = fontBold.widthOfTextAtSize(String(waybill), 11);
    page.drawText(String(waybill), {
      x: (PAGE_WIDTH - awbWidth) / 2,
      y,
      size: 11,
      font: fontBold,
    });

    y -= 10;
    drawLine(page, y);
    y -= 18;

    // PIN + sort code
    page.drawText(String(address.pincode || ""), {
      x: 16,
      y,
      size: 16,
      font: fontBold,
    });
    if (sortCode) {
      page.drawText(String(sortCode), {
        x: PAGE_WIDTH - 16 - fontBold.widthOfTextAtSize(String(sortCode), 14),
        y,
        size: 14,
        font: fontBold,
      });
    }

    y -= 10;
    drawLine(page, y);
    y -= 16;

    // Shipping address
    page.drawText("SHIPPING ADDRESS", {
      x: 16,
      y,
      size: 8,
      font: fontBold,
      color: rgb(0.25, 0.25, 0.25),
    });
    page.drawText(paymentMode, {
      x: PAGE_WIDTH - 16 - fontBold.widthOfTextAtSize(paymentMode, 10),
      y,
      size: 10,
      font: fontBold,
    });

    y -= 14;
    page.drawText(String(address.name || ""), {
      x: 16,
      y,
      size: 11,
      font: fontBold,
    });

    y -= 13;
    const addressLines = wrapText(
      [
        address.address,
        address.city,
        address.state,
        address.country || "India",
      ]
        .filter(Boolean)
        .join(", "),
      font,
      9,
      PAGE_WIDTH - 32
    );

    for (const line of addressLines.slice(0, 4)) {
      page.drawText(line, { x: 16, y, size: 9, font });
      y -= 11;
    }

    page.drawText(`PIN: ${address.pincode || ""}`, {
      x: 16,
      y,
      size: 9,
      font: fontBold,
    });
    y -= 12;

    if (address.phone) {
      page.drawText(`Ph: ${address.phone}`, {
        x: 16,
        y,
        size: 9,
        font,
      });
      y -= 12;
    }

    y -= 2;
    drawLine(page, y);
    y -= 14;

    // Products
    page.drawText("PRODUCT", {
      x: 16,
      y,
      size: 8,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText("AMOUNT", {
      x: PAGE_WIDTH - 16 - fontBold.widthOfTextAtSize("AMOUNT", 8),
      y,
      size: 8,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 8;
    drawLine(page, y, 16, PAGE_WIDTH - 16);
    y -= 12;

    const maxItemRows = 5;
    for (const item of items.slice(0, maxItemRows)) {
      const name = `${item.name}${item.qty > 1 ? ` x ${item.qty}` : ""}`;
      const amount = formatINR(item.price * item.qty);
      const nameLines = wrapText(name, font, 9, 170);

      page.drawText(nameLines[0] || "", { x: 16, y, size: 9, font });
      page.drawText(amount, {
        x: PAGE_WIDTH - 16 - font.widthOfTextAtSize(amount, 9),
        y,
        size: 9,
        font,
      });
      y -= 11;

      for (const extra of nameLines.slice(1, 2)) {
        page.drawText(extra, { x: 16, y, size: 9, font });
        y -= 11;
      }
    }

    if (items.length > maxItemRows) {
      page.drawText(`+${items.length - maxItemRows} more item(s)`, {
        x: 16,
        y,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 11;
    }

    y -= 2;
    const totalLabel = "Total";
    const totalValue = formatINR(order.totalPrice);
    page.drawText(totalLabel, { x: 16, y, size: 10, font: fontBold });
    page.drawText(totalValue, {
      x: PAGE_WIDTH - 16 - fontBold.widthOfTextAtSize(totalValue, 10),
      y,
      size: 10,
      font: fontBold,
    });

    // Footer
    page.drawText(
      `Order: ${String(order._id).slice(-8).toUpperCase()}`,
      {
        x: 16,
        y: 16,
        size: 7,
        font,
        color: rgb(0.35, 0.35, 0.35),
      }
    );
    page.drawText("No returns accepted", {
      x: PAGE_WIDTH - 16 - font.widthOfTextAtSize("No returns accepted", 7),
      y: 16,
      size: 7,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    const pdfBytes = await pdfDoc.save();

    return {
      success: true,
      data: Buffer.from(pdfBytes),
      contentType: "application/pdf",
    };
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
