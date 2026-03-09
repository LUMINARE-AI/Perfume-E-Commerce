import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "BinKhalid Perfumes <contact@binkhalid.in>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("❌ Email sending failed:", error);
      throw new Error("Failed to send email");
    }

    console.log("✅ Email sent:", data.id);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error("Failed to send email");
  }
};

export default sendEmail;

