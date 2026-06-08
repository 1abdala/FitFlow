import os
import requests
import html
from datetime import datetime

def send_telegram_notification(run_id: str, status: str, total_found: int = 0, total_processed: int = 0, total_failed: int = 0, error_message: str = None, traceback_str: str = None) -> bool:
    """
    Sends a formatted execution summary notification to Telegram.
    Supports both success reports and failure alerts.
    """
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    
    if not token or not chat_id:
        print("[WARNING] Telegram alerting skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured in environment.")
        return False
        
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    environment = os.environ.get("ENVIRONMENT", "Production/Staging")
    
    if status.lower() == "success":
        message = (
            f"✅ <b>FITFLOW SCRAPER SUCCESS</b>\n\n"
            f"<b>Run ID:</b> <code>{html.escape(str(run_id))}</code>\n"
            f"<b>Time:</b> <code>{html.escape(timestamp)}</code>\n"
            f"<b>Environment:</b> <code>{html.escape(environment)}</code>\n\n"
            f"<b>Ingestion Statistics:</b>\n"
            f"• Discovered: <code>{total_found}</code>\n"
            f"• Validated & Synced: <code>{total_processed}</code>\n"
            f"• Failed Validation: <code>{total_failed}</code>\n\n"
            f"<b>Repository:</b> <code>FitFlow Internship System</code>\n"
            f"Database matches successfully updated."
        )
    else:
        # Truncate traceback if it exceeds Telegram's 4096 char limit
        max_traceback_len = 2000
        if traceback_str and len(traceback_str) > max_traceback_len:
            traceback_str = traceback_str[:max_traceback_len] + "\n... [TRUNCATED] ..."

        escaped_error = html.escape(error_message or 'Unknown Error')
        escaped_tb = html.escape(traceback_str or 'No traceback available.')

        message = (
            f"🚨 <b>FITFLOW SCRAPER FAILURE</b>\n\n"
            f"<b>Run ID:</b> <code>{html.escape(str(run_id))}</code>\n"
            f"<b>Time:</b> <code>{html.escape(timestamp)}</code>\n"
            f"<b>Environment:</b> <code>{html.escape(environment)}</code>\n\n"
            f"<b>Error:</b>\n<code>{escaped_error}</code>\n\n"
            f"<b>Traceback:</b>\n<pre><code class=\"language-python\">{escaped_tb}</code></pre>\n\n"
            f"<b>Repository:</b> <code>FitFlow Internship System</code>\n"
            f"Immediate action recommended."
        )
        
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    
    try:
        resp = requests.post(url, json=payload, timeout=10)
        if resp.status_code == 200:
            print(f"[ALERT] Telegram notification ({status}) sent successfully.")
            return True
        else:
            print(f"[ERROR] Failed to send Telegram alert: HTTP {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Connection error while sending Telegram alert: {e}")
        return False
