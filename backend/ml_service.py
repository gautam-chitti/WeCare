import pickle
import cv2
import numpy as np
import os
import base64

class ModelManager:
    def __init__(self):
        self.fracture_model = None
        self.tb_model = None
        self.load_models()

    def load_models(self):
        try:
            # Paths relative to where uvicorn is run (backend root)
            fracture_path = os.path.join("models", "Fracture_XGBoost")
            tb_path = os.path.join("models", "TB_XGBoost")
            
            if os.path.exists(fracture_path):
                self.fracture_model = pickle.load(open(fracture_path, 'rb'))
                print("Fracture model loaded successfully")
            else:
                print(f"Fracture model not found at {fracture_path}")

            if os.path.exists(tb_path):
                self.tb_model = pickle.load(open(tb_path, 'rb'))
                print("TB model loaded successfully")
            else:
                print(f"TB model not found at {tb_path}")
                
        except Exception as e:
            print(f"Error loading models: {str(e)}")

    def predict(self, features, disease_type):
        if disease_type == 'fracture' and self.fracture_model:
            return self.fracture_model.predict(features)[0]
        elif disease_type == 'tb' and self.tb_model:
            return self.tb_model.predict(features)[0]
        return None

def extract_features(image_bytes, disease_type):
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        if img is None:
            return None, None, None

        mean_intensity = np.mean(img)
        variance = np.var(img)
        
        explanations = {
            'mean_intensity': float(mean_intensity),
            'variance': float(variance)
        }

        processed_image_b64 = None

        if disease_type == 'fracture':
            # Canny Edge Detection
            edges = cv2.Canny(img, 100, 200)
            edge_density = np.sum(edges > 0) / (img.shape[0] * img.shape[1])
            explanations['edge_density'] = float(edge_density)
            
            features = np.array([[mean_intensity, variance, edge_density]])
            
            # Create visualization (Edges on top of original)
            # Convert grayscale to BGR
            img_bgr = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
            # Make edges red
            img_bgr[edges > 0] = [0, 0, 255]
            
            _, buffer = cv2.imencode('.png', img_bgr)
            processed_image_b64 = base64.b64encode(buffer).decode('utf-8')
            
            return features, explanations, processed_image_b64
            
        elif disease_type == 'tb':
            features = np.array([[mean_intensity, variance]])
            
            # Create visualization (Heatmap based on intensity)
            # Apply CLAHE for better contrast
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            cl1 = clahe.apply(img)
            
            # Apply heatmap
            heatmap = cv2.applyColorMap(cl1, cv2.COLORMAP_JET)
            
            _, buffer = cv2.imencode('.png', heatmap)
            processed_image_b64 = base64.b64encode(buffer).decode('utf-8')

            return features, explanations, processed_image_b64
            
        return None, None, None
    except Exception as e:
        print(f"Feature extraction error: {e}")
        return None, None, None

model_manager = ModelManager()
