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
const MARGIN = 14;

const ink = rgb(0.08, 0.08, 0.08);
const muted = rgb(0.42, 0.42, 0.42);
const soft = rgb(0.94, 0.94, 0.94);
const softLine = rgb(0.82, 0.82, 0.82);
const brandRed = rgb(0.77, 0.07, 0.19);
const white = rgb(1, 1, 1);

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
    height: 12,
    includetext: false,
    backgroundcolor: "FFFFFF",
  });

const drawHRule = (page, y, thickness = 0.8, color = ink) => {
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness,
    color,
  });
};

const drawBadge = (page, text, fontBold, xRight, y) => {
  const padX = 6;
  const padY = 3;
  const size = 8;
  const textW = fontBold.widthOfTextAtSize(text, size);
  const boxW = textW + padX * 2;
  const boxH = size + padY * 2;
  const x = xRight - boxW;

  page.drawRectangle({
    x,
    y: y - padY,
    width: boxW,
    height: boxH,
    borderColor: ink,
    borderWidth: 1,
    color: white,
  });

  page.drawText(text, {
    x: x + padX,
    y: y,
    size,
    font: fontBold,
    color: ink,
  });

  return boxH;
};

/**
 * Generate a polished custom shipping label PDF (no Chrome, no seller/return address).
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

    // Outer frame
    page.drawRectangle({
      x: 6,
      y: 6,
      width: PAGE_WIDTH - 12,
      height: PAGE_HEIGHT - 12,
      borderColor: softLine,
      borderWidth: 1,
    });

    let y = PAGE_HEIGHT - 24;

    // ── Header ──────────────────────────────────────────────
    page.drawText(brand, {
      x: MARGIN,
      y,
      size: 13,
      font: fontBold,
      color: ink,
    });
    page.drawText("DELHIVERY", {
      x: PAGE_WIDTH - MARGIN - fontBold.widthOfTextAtSize("DELHIVERY", 9),
      y: y + 1,
      size: 9,
      font: fontBold,
      color: brandRed,
    });

    y -= 12;
    drawHRule(page, y, 1.2);
    y -= 14;

    // ── Barcode block ───────────────────────────────────────
    const barcodeWidth = 230;
    const barcodeHeight = 46;
    page.drawImage(barcodeImage, {
      x: (PAGE_WIDTH - barcodeWidth) / 2,
      y: y - barcodeHeight,
      width: barcodeWidth,
      height: barcodeHeight,
    });
    y -= barcodeHeight + 10;

    const awb = String(waybill);
    const awbWidth = fontBold.widthOfTextAtSize(awb, 12);
    page.drawText(awb, {
      x: (PAGE_WIDTH - awbWidth) / 2,
      y,
      size: 12,
      font: fontBold,
      color: ink,
    });

    y -= 12;
    drawHRule(page, y, 0.7, softLine);
    y -= 8;

    // ── Route strip (PIN + sort) ─────────────────────────────
    const routeH = 34;
    page.drawRectangle({
      x: MARGIN,
      y: y - routeH + 8,
      width: PAGE_WIDTH - MARGIN * 2,
      height: routeH,
      color: soft,
    });

    const pin = String(address.pincode || "");
    page.drawText(pin, {
      x: MARGIN + 8,
      y: y - 12,
      size: 18,
      font: fontBold,
      color: ink,
    });

    if (sortCode) {
      const sc = String(sortCode);
      page.drawText(sc, {
        x: PAGE_WIDTH - MARGIN - 8 - fontBold.widthOfTextAtSize(sc, 16),
        y: y - 11,
        size: 16,
        font: fontBold,
        color: ink,
      });
    }

    y -= routeH + 4;
    drawHRule(page, y, 0.7, softLine);
    y -= 14;

    // ── Ship-to + payment badge ─────────────────────────────
    page.drawText("SHIP TO", {
      x: MARGIN,
      y,
      size: 7.5,
      font: fontBold,
      color: muted,
    });
    drawBadge(page, paymentMode, fontBold, PAGE_WIDTH - MARGIN, y - 1);

    y -= 15;
    page.drawText(String(address.name || "").toUpperCase(), {
      x: MARGIN,
      y,
      size: 11,
      font: fontBold,
      color: ink,
    });

    y -= 13;
    const addressLines = wrapText(
      [address.address, address.city, address.state, address.country || "India"]
        .filter(Boolean)
        .join(", "),
      font,
      9,
      PAGE_WIDTH - MARGIN * 2
    );

    for (const line of addressLines.slice(0, 4)) {
      page.drawText(line, { x: MARGIN, y, size: 9, font, color: ink });
      y -= 11;
    }

    y -= 2;
    const meta = [
      address.pincode ? `PIN ${address.pincode}` : null,
      address.phone ? `Ph ${address.phone}` : null,
    ]
      .filter(Boolean)
      .join("   ·   ");

    if (meta) {
      page.drawText(meta, {
        x: MARGIN,
        y,
        size: 8.5,
        font: fontBold,
        color: muted,
      });
      y -= 12;
    }

    y -= 2;
    drawHRule(page, y, 0.7, softLine);
    y -= 14;

    // ── Products ────────────────────────────────────────────
    page.drawText("PRODUCT", {
      x: MARGIN,
      y,
      size: 7.5,
      font: fontBold,
      color: muted,
    });
    page.drawText("AMOUNT", {
      x: PAGE_WIDTH - MARGIN - fontBold.widthOfTextAtSize("AMOUNT", 7.5),
      y,
      size: 7.5,
      font: fontBold,
      color: muted,
    });

    y -= 7;
    drawHRule(page, y, 0.6, softLine);
    y -= 12;

    const maxItemRows = 4;
    for (const item of items.slice(0, maxItemRows)) {
      const name = `${item.name}${item.qty > 1 ? `  x${item.qty}` : ""}`;
      const amount = formatINR(item.price * item.qty);
      const nameLines = wrapText(name, font, 9, 168);

      page.drawText(nameLines[0] || "", {
        x: MARGIN,
        y,
        size: 9,
        font,
        color: ink,
      });
      page.drawText(amount, {
        x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(amount, 9),
        y,
        size: 9,
        font,
        color: ink,
      });
      y -= 11;

      for (const extra of nameLines.slice(1, 2)) {
        page.drawText(extra, {
          x: MARGIN,
          y,
          size: 9,
          font,
          color: muted,
        });
        y -= 11;
      }
    }

    if (items.length > maxItemRows) {
      page.drawText(`+${items.length - maxItemRows} more item(s)`, {
        x: MARGIN,
        y,
        size: 8,
        font,
        color: muted,
      });
      y -= 12;
    }

    y -= 4;

    // Total bar
    const totalH = 24;
    const totalValue = formatINR(order.totalPrice);
    page.drawRectangle({
      x: MARGIN,
      y: y - 8,
      width: PAGE_WIDTH - MARGIN * 2,
      height: totalH,
      color: soft,
    });
    page.drawText("TOTAL", {
      x: MARGIN + 8,
      y: y - 1,
      size: 9,
      font: fontBold,
      color: ink,
    });
    page.drawText(totalValue, {
      x:
        PAGE_WIDTH -
        MARGIN -
        8 -
        fontBold.widthOfTextAtSize(totalValue, 10),
      y: y - 1,
      size: 10,
      font: fontBold,
      color: ink,
    });

    // ── Footer ──────────────────────────────────────────────
    const footerY = 18;
    drawHRule(page, footerY + 10, 0.6, softLine);

    const orderRef = `Order ${String(order._id).slice(-8).toUpperCase()}`;
    page.drawText(orderRef, {
      x: MARGIN,
      y: footerY,
      size: 7,
      font,
      color: muted,
    });
    page.drawText("No returns accepted", {
      x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize("No returns accepted", 7),
      y: footerY,
      size: 7,
      font,
      color: muted,
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
