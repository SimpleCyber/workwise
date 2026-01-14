export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<boolean> {
  try {
    const res = await fetch("https://python-mailsend.onrender.com/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, body }),
    });

    // not working
    if (!res.ok) {
      console.error("Email send failed:", await res.json());
      return false;
    }

    console.log("Email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
