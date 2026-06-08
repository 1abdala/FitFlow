import os
import requests
from datetime import datetime

def send_telegram_alert(run_id: str, error_message: str, traceback_str: str) -> bool:
    """
    Sends a failure notification alert to a designated Telegram channel/chat.
    """
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    
    if not token or not chat_id:
        print("[WARNING] Telegram alerting skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured in environment.")
        return False
        
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    environment = os.environ.get("ENVIRONMENT", "Production/Staging")
    
    # Truncate traceback if it exceeds Telegram's 4096 char limit
    max_traceback_len = 2000
    if len(traceback_str) > max_traceback_len:
        traceback_str = traceback_str[:max_traceback_len] + "\n... [TRUNCATED] ..."

    message = (
        f"🚨 *FITFLOW SCRAPER FAILURE*\n\n"
        f"*Run ID:* `{run_id}`\n"
        f"*Time:* `{timestamp}`\n"
        f"*Environment:* `{environment}`\n\n"
        f"*Error:*\n`{error_message}`\n\n"
        f"*Traceback:*\n```python\n{traceback_str}\n```\n\n"
        f"*Repository:* `FitFlow Internship System`\n"
        f"Immediate action recommended."
    )
    
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown"
    }
    
    try:
        resp = requests.post(url, json=payload, timeout=10)
        if resp.status_code == 200:
            print("[ALERT] Telegram notification sent successfully.")
            return True
        else:
            print(f"[ERROR] Failed to send Telegram alert: HTTP {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Connection error while sending Telegram alert: {e}")
        return False
