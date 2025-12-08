from sentence_transformers import SentenceTransformer, util
import torch

# Predefined specializations and their keywords/descriptions
SPECIALIZATIONS = {
    "Cardiologist": "heart pain, chest pain, palpitations, high blood pressure, shortness of breath",
    "Dermatologist": "skin rash, acne, hair loss, itching, redness, skin lesions",
    "Orthopedist": "joint pain, bone fracture, back pain, knee pain, muscle tear, arthritis",
    "Pediatrician": "child fever, baby growth, vaccination, child illness",
    "Neurologist": "headache, migraine, dizziness, seizure, numbness, memory loss",
    "General Physician": "fever, cold, flu, cough, fatigue, weakness, body ache",
    "Gastroenterologist": "stomach pain, acidity, digestion issues, vomiting, diarrhea"
}

class SymptomMatcher:
    def __init__(self):
        try:
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            self.specialization_embeddings = self._embed_specializations()
            print("Symptom Matcher Model Loaded")
        except Exception as e:
            print(f"Error loading Symptom Model: {e}")
            self.model = None

    def _embed_specializations(self):
        embeddings = {}
        for spec, desc in SPECIALIZATIONS.items():
            embeddings[spec] = self.model.encode(desc, convert_to_tensor=True)
        return embeddings

    def find_specialization(self, user_symptom):
        if not self.model:
            return "General Physician" # Fallback

        user_embedding = self.model.encode(user_symptom, convert_to_tensor=True)
        
        best_score = -1
        best_spec = "General Physician"

        for spec, spec_embedding in self.specialization_embeddings.items():
            score = util.cos_sim(user_embedding, spec_embedding).item()
            if score > best_score:
                best_score = score
                best_spec = spec
        
        return best_spec

symptom_matcher = SymptomMatcher()
