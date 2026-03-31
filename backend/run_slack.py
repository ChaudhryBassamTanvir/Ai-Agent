from slack_bolt.adapter.socket_mode import SocketModeHandler
from services.slack_bot import app

handler = SocketModeHandler(app, "YOUR_APP_LEVEL_TOKEN")

if __name__ == "__main__":
    handler.start()