from telethon.sync import TelegramClient
from telethon.sessions import StringSession

API_ID = "1773512"
API_HASH = "e6ddc0a09548cfe5b9bd7103ad3fbc7b"

with TelegramClient(StringSession(), API_ID, API_HASH) as client:
    print("请登录您的Telegram账号...")
    client.start()
    session_string = client.session.save()
    print(f"您的SESSION_STRING: {session_string}")
