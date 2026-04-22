# services/email_service.py

import os
import resend
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

STATUS_CONFIG = {
    "pending": {
        "emoji":   "📋",
        "title":   "Project Received",
        "color":   "#f59e0b",
        "bg":      "#fffbeb",
        "message": "We have received your project and it is currently in our queue. Our team will begin working on it shortly."
    },
    "in_progress": {
        "emoji":   "⚙️",
        "title":   "Project In Progress",
        "color":   "#3b5bdb",
        "bg":      "#eff6ff",
        "message": "Great news! Our team has started working on your project. We will keep you updated on the progress."
    },
    "done": {
        "emoji":   "✅",
        "title":   "Project Completed",
        "color":   "#15803d",
        "bg":      "#f0fdf4",
        "message": "We are pleased to inform you that your project has been completed. Thank you for choosing DS Technologies!"
    },
}

def send_status_update_email(
    client_name: str,
    client_email: str,
    task_description: str,
    new_status: str,
    trello_url: str = ""
):
    if not client_email:
        print(f"⚠️ No email for client — skipping status email")
        return

    resend.api_key = os.getenv("RESEND_API_KEY")
    cfg  = STATUS_CONFIG.get(new_status, STATUS_CONFIG["pending"])
    now  = datetime.now().strftime("%B %d, %Y at %I:%M %p")
    label = new_status.replace("_", " ").title()

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f4f4f0;font-family:'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e8e6;">

            <!-- Header -->
            <tr>
              <td style="background:#1a1a1a;padding:28px 36px;">
                <p style="margin:0;font-size:11px;color:#888;letter-spacing:2px;text-transform:uppercase">DS Technologies</p>
                <h1 style="margin:8px 0 0;font-size:20px;font-weight:500;color:#fff;">Project Status Update</h1>
                <p style="margin:4px 0 0;font-size:13px;color:#888;">{now}</p>
              </td>
            </tr>

            <!-- Status Banner -->
            <tr>
              <td style="background:{cfg['bg']};padding:16px 36px;border-bottom:1px solid #e8e8e6;">
                <p style="margin:0;font-size:15px;font-weight:500;color:{cfg['color']};">
                  {cfg['emoji']} {cfg['title']}
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:28px 36px;">
                <p style="font-size:15px;color:#1a1a1a;margin:0 0 16px;">Dear <strong>{client_name}</strong>,</p>
                <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 24px;">{cfg['message']}</p>

                <!-- Project Details -->
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e6;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                  <tr style="background:#f9f9f8;">
                    <td style="padding:10px 16px;font-size:12px;color:#999;width:120px;border-bottom:1px solid #f0f0f0;">Project</td>
                    <td style="padding:10px 16px;font-size:14px;color:#1a1a1a;font-weight:500;border-bottom:1px solid #f0f0f0;">{task_description[:80]}...</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 16px;font-size:12px;color:#999;">Status</td>
                    <td style="padding:10px 16px;">
                      <span style="font-size:12px;padding:4px 10px;border-radius:6px;background:{cfg['bg']};color:{cfg['color']};font-weight:500;">{label}</span>
                    </td>
                  </tr>
                </table>

                # ✅ Replace with this in the html body section:
              <p style="font-size:14px;color:#666;margin:16px 0 0;line-height:1.7;">
  Our team is actively working on your project. We will reach out to you directly 
  if we need any additional information. Thank you for your patience!
                                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 36px;border-top:1px solid #f0f0f0;background:#f9f9f8;">
                <p style="margin:0;font-size:12px;color:#bbb;line-height:1.6;">
                  DS Technologies · Automated Project Update<br/>
                  For queries, reply to this email or contact us directly.
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    subject_map = {
        "pending":     f"📋 Project Received — {task_description[:40]}",
        "in_progress": f"⚙️ Your Project Is In Progress — {task_description[:40]}",
        "done":        f"✅ Project Completed — {task_description[:40]}",
    }

    try:
        resend.Emails.send({
            "from":    "DS Technologies <onboarding@resend.dev>",
            "to":      client_email,
            "subject": subject_map.get(new_status, f"Project Update — {label}"),
            "html":    html
        })
        print(f"✅ Status email sent to {client_email} — {label}")
    except Exception as e:
        print(f"❌ Status email error: {e}")