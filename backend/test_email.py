# test_email.py
import resend
import os
from dotenv import load_dotenv
load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

result = resend.Emails.send({
    "from": "DS Technologies AI Agent <onboarding@resend.dev>",
    "to": "banisidhu193@gmail.com",
    "subject": "Test Email",
    "html": "<p>This is a test email from DS Technologies Agent.</p>"
})
print(result)