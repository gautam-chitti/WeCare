import requests
import pypdf
import io
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral:7b-instruct" # User specified this or similar

def extract_text_from_pdf(file_bytes):
    try:
        pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

def analyze_report(text):
    if not text:
        return "Could not read report content."

    prompt = f"""
    You are an expert medical AI assistant. Your goal is to explain medical reports to patients in simple, easy-to-understand language.
    
    Here is the content of a medical report:
    {text}
    
    Please provide a summary that includes:
    1. **Key Findings**: What are the main results? (e.g., High Cholesterol, Normal Blood Count)
    2. **Explanation**: What do these results mean for the patient's health?
    3. **Recommendations**: General advice (e.g., "Consult a cardiologist", "Eat healthy").
    
    Keep it concise and reassuring. Do not give definitive medical diagnoses, but rather "indications".
    """

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        return response.json().get("response", "Error generating summary.")
    except Exception as e:
        print(f"Ollama Error: {e}")
        return "Error connecting to AI service. Please ensure Ollama is running."
