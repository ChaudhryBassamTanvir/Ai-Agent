from transformers import pipeline

# Better controlled generation
chatbot = pipeline(
    "text-generation",
    model="distilgpt2",
)

def generate_reply(message: str):
    prompt = f"""
You are a professional AI assistant for a software company.

Your job:
- Answer client queries clearly
- Be short and professional
- Help with services like web development, mobile apps, AI systems

Client: {message}
AI:"""

    result = chatbot(
        prompt,
        max_length=120,
        num_return_sequences=1,
        do_sample=True,
        temperature=0.7,
        top_k=50,
        top_p=0.9
    )

    text = result[0]["generated_text"]

    # Clean output
    response = text.split("AI:")[-1].strip()

    # Prevent long garbage text
    return response[:200]