def detect_intent(message: str):
    msg = message.lower()

    if any(word in msg for word in ["price", "cost", "charges"]):
        return "pricing"

    if any(word in msg for word in ["build", "create", "develop"]):
        return "task"

    if any(word in msg for word in ["hello", "hi"]):
        return "greeting"

    return "general"