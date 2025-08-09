export interface EmailTemplate {
  subject: string;
  html: string;
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
  };
}

export const EMAIL_THEMES = {
  success: {
    primaryColor: "#10b981",
    backgroundColor: "#ecfdf5",
    textColor: "#065f46",
    buttonColor: "#059669",
  },
  warning: {
    primaryColor: "#f59e0b",
    backgroundColor: "#fffbeb",
    textColor: "#92400e",
    buttonColor: "#d97706",
  },
  danger: {
    primaryColor: "#ef4444",
    backgroundColor: "#fef2f2",
    textColor: "#991b1b",
    buttonColor: "#dc2626",
  },
  info: {
    primaryColor: "#3b82f6",
    backgroundColor: "#eff6ff",
    textColor: "#1e40af",
    buttonColor: "#2563eb",
  },
  purple: {
    primaryColor: "#8b5cf6",
    backgroundColor: "#f5f3ff",
    textColor: "#5b21b6",
    buttonColor: "#7c3aed",
  },
} as const;

export function getNotificationTheme(type: string) {
  switch (type) {
    case "attendance_approved":
    case "task_completed":
      return EMAIL_THEMES.success;

    case "attendance_rejected":
    case "task_on_hold":
      return EMAIL_THEMES.danger;

    case "task_assigned":
    case "attendance_action_by_admin":
      return EMAIL_THEMES.warning;

    case "document_shared":
    case "document_uploaded":
      return EMAIL_THEMES.purple;

    case "attendance_submitted":
    case "attendance_checkout":
    case "task_status_changed":
    case "task_comment_added":
    default:
      return EMAIL_THEMES.info;
  }
}

export function generateEmailTemplate(
  type: string,
  title: string,
  message: string,
  userName: string,
  workspaceName: string,
  actionBy?: string,
): EmailTemplate {
  const theme = getNotificationTheme(type);

  const typeLabels: Record<string, string> = {
    attendance_submitted: "Attendance Submitted",
    attendance_approved: "Attendance Approved",
    attendance_rejected: "Attendance Rejected",
    attendance_action_by_admin: "Admin Action Required",
    attendance_checkout: "Attendance Checkout",
    document_uploaded: "Document Uploaded",
    document_shared: "Document Shared",
    task_assigned: "New Task Assigned",
    task_status_changed: "Task Status Updated",
    task_completed: "Task Completed",
    task_on_hold: "Task On Hold",
    task_comment_added: "New Comment Added",
  };

  const typeLabel = typeLabels[type] || "Notification";
  const subject = `${typeLabel} - ${workspaceName}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .email-container {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.buttonColor});
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px 20px;
        }
        .notification-badge {
          display: inline-block;
          background-color: ${theme.backgroundColor};
          color: ${theme.textColor};
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 20px;
          border: 1px solid ${theme.primaryColor}20;
        }
        .message-box {
          background-color: ${theme.backgroundColor};
          border-left: 4px solid ${theme.primaryColor};
          padding: 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .message-box h2 {
          color: ${theme.textColor};
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .message-box p {
          color: ${theme.textColor};
          margin: 0;
          font-size: 16px;
        }
        .details {
          background-color: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .details h3 {
          margin: 0 0 15px 0;
          color: #374151;
          font-size: 16px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .detail-label {
          font-weight: 500;
          color: #6b7280;
        }
        .detail-value {
          color: #374151;
          font-weight: 500;
        }
        .footer {
          background-color: #f8fafc;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        .timestamp {
          color: #9ca3af;
          font-size: 14px;
          margin-top: 20px;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .content {
            padding: 20px 15px;
          }
          .header {
            padding: 20px 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>📧 Notification Update</h1>
        </div>
        
        <div class="content">
          <div class="notification-badge">
            ${typeLabel}
          </div>
          
          <p>Hello <strong>${userName}</strong>,</p>
          
          <div class="message-box">
            <h2>${title}</h2>
            <p>${message}</p>
          </div>
          
          <div class="details">
            <h3>📋 Notification Details</h3>
            <div class="detail-row">
              <span class="detail-label">Workspace:</span>
              <span class="detail-value">${workspaceName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="detail-value">${typeLabel}</span>
            </div>
            ${
              actionBy
                ? `
            <div class="detail-row">
              <span class="detail-label">Action by:</span>
              <span class="detail-value">${actionBy}</span>
            </div>
            `
                : ""
            }
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${new Date().toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}</span>
            </div>
          </div>
          
          <p>Please log in to your workspace to view more details and take any necessary actions.</p>
          
          <div class="timestamp">
            This notification was sent automatically from your workspace management system.
          </div>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    subject,
    html,
    theme,
  };
}
