import express from "express";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    await sendEmail({
      to: "contact@binkhalid.in", 
      subject: `📩 New Contact Message from ${name}`,
      reply_to: email,
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>New Contact Message</h2>

          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>

          <h3>Message:</h3>
          <p>${message}</p>

          <br/>
          <p>Reply directly to this email to respond.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Email sent successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

export default router;