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
    primaryColor: "#00875a",
    backgroundColor: "#ffffff",
    textColor: "#172b4d",
    buttonColor: "#0052cc",
  },
  warning: {
    primaryColor: "#ff8b00",
    backgroundColor: "#ffffff",
    textColor: "#172b4d",
    buttonColor: "#0052cc",
  },
  danger: {
    primaryColor: "#de350b",
    backgroundColor: "#ffffff",
    textColor: "#172b4d",
    buttonColor: "#0052cc",
  },
  info: {
    primaryColor: "#0052cc",
    backgroundColor: "#ffffff",
    textColor: "#172b4d",
    buttonColor: "#0052cc",
  },
  purple: {
    primaryColor: "#6554c0",
    backgroundColor: "#ffffff",
    textColor: "#172b4d",
    buttonColor: "#0052cc",
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
  const subject = `[${workspaceName}] ${typeLabel.toLowerCase()}, ${actionBy ? "added a new comment" : "made an update"}.`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #172b4d;
          margin: 0;
          padding: 20px;
          background-color: #ffffff;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .header {
          margin-bottom: 30px;
        }
        
        .sender-info {
          color: #5e6c84;
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .main-title {
          font-size: 16px;
          font-weight: 400;
          color: #172b4d;
          margin-bottom: 20px;
        }
        
        .project-info {
          color: #5e6c84;
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .task-title {
          color: #0052cc;
          font-size: 16px;
          text-decoration: none;
          margin-bottom: 30px;
          display: block;
        }
        
        .task-title:hover {
          text-decoration: underline;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #172b4d;
          margin: 30px 0 15px 0;
        }
        
        .update-item {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #dfe1e6;
        }
        
        .update-item:last-child {
          border-bottom: none;
        }
        
        .user-avatar {
          display: inline-block;
          width: 24px;
          height: 24px;
          background: #0052cc;
          color: white;
          border-radius: 50%;
          text-align: center;
          line-height: 24px;
          font-size: 12px;
          font-weight: 600;
          margin-right: 8px;
          vertical-align: middle;
        }
        
        .user-name {
          font-weight: 600;
          color: #172b4d;
        }
        
        .timestamp {
          color: #5e6c84;
          font-size: 12px;
          margin-left: 5px;
        }
        
        .status-change {
          margin: 10px 0;
          font-size: 14px;
        }
        
        .status {
          color: #5e6c84;
        }
        
        .status-value {
          color: #172b4d;
          font-weight: 500;
        }
        
        .comment-section {
          background: #f4f5f7;
          border: 1px solid #dfe1e6;
          border-radius: 3px;
          padding: 15px;
          margin: 15px 0;
        }
        
        .comment-header {
          margin-bottom: 10px;
        }
        
        .comment-label {
          font-weight: 600;
          color: #172b4d;
          font-size: 14px;
        }
        
        .comment-text {
          color: #172b4d;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .view-button {
          display: inline-block;
          background: #0052cc;
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 3px;
          font-size: 14px;
          margin: 20px 0;
        }
        
        .view-button:hover {
          background: #0747a6;
        }

        a{
         text-decoration: none;
         color: #0052cc;
        }
        
        @media (max-width: 600px) {
          body {
            padding: 15px;
          }
          
          .comment-section {
            padding: 12px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="sender-info">Woodls (${actionBy || "System"}) &lt;noreply@woodls.com&gt;</div>
          <div class="main-title">${userName} ${typeLabel.toLowerCase()}${actionBy ? ", added a new comment" : ", made an update"}.</div>
        </div>
        
        <div class="project-info">In ${workspaceName}</div>
        
        <a href="https://workwise-sigma.vercel.app/" class="task-title">${title}</a>
        
        <div class="section-title">Updates</div>
        
        <div class="update-item">
          <div>
            <span class="user-avatar">${userName.charAt(0).toUpperCase()}</span>
            <span class="user-name">${actionBy || userName}</span>
            <span class="timestamp">${new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })} ${Intl.DateTimeFormat().resolvedOptions().timeZone.split("/")[1]} Time</span>
          </div>
          
          ${
            type.includes("status")
              ? `
          <div class="status-change">
            <span class="status">Status:</span> 
            <span class="status-value">Review → In Progress</span>
          </div>
          `
              : ""
          }
        </div>
        
        ${
          message !== title
            ? `
        <div class="section-title">Comments</div>
        
        <div class="comment-section">
          <div class="comment-header">
            <span class="user-avatar">${(actionBy || userName).charAt(0).toUpperCase()}</span>
            <span class="user-name">${actionBy || userName}</span>
            <span class="timestamp">${new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })} ${Intl.DateTimeFormat().resolvedOptions().timeZone.split("/")[1]} Time</span>
          </div>
          
          <div class="comment-label">Comment:</div>
          <div class="comment-text">${message}</div>
        </div>
        `
            : ""
        }
        
        <a href="https://workwise-sigma.vercel.app/" class="view-button">View in Woodls</a>
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
