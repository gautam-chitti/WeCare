import asyncio
from prisma import Prisma
from utils import get_password_hash
import random

locations = [
    "Lallian Khurd", "Rampur Lallian", "Chak Mochipur", "Gokalpur", "Lambri",
    "Bhagwanpur", "Tajpur", "Hassanpur", "Hussainpur", "Kalianpur",
    "Bashesherpur", "Ladhra", "Lalapur", "Lallian Kalan", "Lidhran",
    "Lohar", "Lohar Sukha Singh", "Mahadipur Arian", "Dhanal Khurd",
    "Lohar Partarpura", "Nangalpurdil", "Kukkar Pind", "Chitti"
]

specializations = [
    "Cardiologist", "Dermatologist", "Neurologist", "Pediatrician", 
    "Orthopedic Surgeon", "Psychiatrist", "General Practitioner", "ENT Specialist"
]

async def seed_doctors():
    prisma = Prisma()
    await prisma.connect()
    
    print("Seeding doctors...")
    
    password_hash = get_password_hash("password123")
    
    for i, location in enumerate(locations):
        # Create 1-2 doctors per location
        num_docs = random.randint(1, 2)
        
        for j in range(num_docs):
            spec = random.choice(specializations)
            is_gp = spec == "General Practitioner"
            name = f"Dr. {random.choice(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'])} {i}-{j}"
            email = f"doctor{i}{j}@auracare.com"
            
            # Check if user exists
            existing = await prisma.user.find_unique(where={"email": email})
            if existing:
                print(f"Skipping {email}, already exists")
                continue
                
            user = await prisma.user.create(
                data={
                    "email": email,
                    "password": password_hash,
                    "role": "doctor",
                    "name": name,
                    "doctorProfile": {
                        "create": {
                            "licenseNumber": f"LIC-{random.randint(10000, 99999)}",
                            "specialization": spec,
                            "location": location,
                            "isGeneralPractitioner": is_gp,
                            "verificationStatus": "verified",
                            "experience": random.randint(5, 25),
                            "rating": round(random.uniform(3.5, 5.0), 1),
                            "reviewCount": random.randint(10, 100),
                            "bio": f"Experienced {spec} serving the {location} community."
                        }
                    }
                }
            )
            print(f"Created {name} ({spec}) in {location}")

    await prisma.disconnect()
    print("Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_doctors())
