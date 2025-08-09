import { type NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendEmail";
import { generateEmailTemplate } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      notificationId,
      type,
      title,
      message,
      userEmail,
      userName,
      workspaceName,
      actionBy,
    } = body;

    if (!userEmail || !type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Generate themed email template
    const emailTemplate = generateEmailTemplate(
      type,
      title,
      message,
      userName || "User",
      workspaceName || "Workspace",
      actionBy,
    );

    // Send email
    const success = await sendEmail(
      userEmail,
      emailTemplate.subject,
      emailTemplate.html,
    );

    if (success) {
      return NextResponse.json(
        {
          message: "Email sent successfully",
          notificationId,
          theme: emailTemplate.theme,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in send-notification-email API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
