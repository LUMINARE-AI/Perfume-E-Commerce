import puppeteer from "puppeteer";

/**
 * Generate Invoice HTML
 */
export const generateInvoiceHTML = (order) => {
  const invoiceDate = new Date().toLocaleDateString("en-IN");

  // ✅ Convert ObjectId safely
  const orderId = order?._id?.toString() || "";
  const invoiceNumber = `INV-${orderId.slice(-8).toUpperCase()}`;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body {
    font-family: Arial, sans-serif;
    color: #333;
    padding: 40px;
  }
  .container {
    max-width: 800px;
    margin: auto;
  }
  .header {
    display: flex;
    justify-content: space-between;
    border-bottom: 2px solid #D4AF37;
    padding-bottom: 15px;
    margin-bottom: 30px;
  }
  .company h1 {
    color: #D4AF37;
    margin-bottom: 5px;
  }
  .title {
    text-align: right;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  th {
    background: #D4AF37;
    color: #fff;
    padding: 10px;
    text-align: left;
  }
  td {
    padding: 10px;
    border-bottom: 1px solid #eee;
  }
  .totals {
    width: 300px;
    margin-left: auto;
    margin-top: 20px;
  }
  .totals td {
    border: none;
  }
  .grand {
    font-weight: bold;
    border-top: 2px solid #D4AF37;
  }
</style>
</head>
<body>
<div class="container">

  <div class="header">
    <div class="company">
      <h1>BIN KHALID</h1>
      <p>Luxury Perfumes</p>
      <p>GSTIN: XXXXXXXXXXXX</p>
    </div>
    <div class="title">
      <h2>INVOICE</h2>
      <p><strong>Invoice No:</strong> ${invoiceNumber}</p>
      <p><strong>Date:</strong> ${invoiceDate}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
    </div>
  </div>

  <h4>Bill To:</h4>
  <p><strong>${order?.shippingAddress?.name || "Customer"}</strong></p>
  <p>${order?.shippingAddress?.address || ""}</p>
  <p>
    ${order?.shippingAddress?.city || ""}, 
    ${order?.shippingAddress?.state || ""} - 
    ${order?.shippingAddress?.pincode || ""}
  </p>
  <p>Phone: ${order?.shippingAddress?.phone || ""}</p>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${(order?.items || [])
        .map(
          (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item?.product?.name || item?.name || "Product"}</td>
          <td>${item?.qty || 0}</td>
          <td>₹${(item?.price || 0).toLocaleString("en-IN")}</td>
          <td>₹${((item?.price || 0) * (item?.qty || 0)).toLocaleString("en-IN")}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <table class="totals">
    <tr>
      <td>Subtotal:</td>
      <td>₹${(order?.itemsPrice || 0).toLocaleString("en-IN")}</td>
    </tr>
    <tr>
      <td>Shipping:</td>
      <td>₹${(order?.shippingPrice || 0).toLocaleString("en-IN")}</td>
    </tr>
    <tr>
      <td>GST:</td>
      <td>₹${(order?.taxPrice || 0).toLocaleString("en-IN")}</td>
    </tr>
    <tr class="grand">
      <td>Grand Total:</td>
      <td>₹${(order?.totalPrice || 0).toLocaleString("en-IN")}</td>
    </tr>
  </table>

  <p style="margin-top:40px; font-size:12px; text-align:center;">
    Thank you for your purchase! This is a system-generated invoice.
  </p>

</div>
</body>
</html>
`;
};

/**
 * Generate PDF from Order
 */
export const generateInvoicePDF = async (order) => {
  let browser;

  try {
    const html = generateInvoiceHTML(order);

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    return pdfBuffer;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw new Error("Failed to generate invoice PDF");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export default {
  generateInvoicePDF,
};