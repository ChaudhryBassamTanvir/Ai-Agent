from transformers import pipeline

# Load free model (runs on CPU)
chatbot = pipeline("text-generation", model="distilgpt2")

def generate_reply(message: str):
    prompt = f"Client: {message}\nAI:"
    
    result = chatbot(prompt, max_length=100, num_return_sequences=1)
    
    text = result[0]["generated_text"]
    
    # Clean output
    return text.replace(prompt, "").strip()