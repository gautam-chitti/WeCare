import asyncio
from prisma import Prisma
from auth import get_password_hash

async def seed_admin():
    prisma = Prisma()
    await prisma.connect()
    
    admin_email = "admin@auracare.com"
    
    # Check if admin exists
    existing_admin = await prisma.user.find_unique(where={"email": admin_email})
    
    if existing_admin:
        print(f"Admin user already exists: {admin_email}")
    else:
        print("Creating admin user...")
        await prisma.user.create(
            data={
                "email": admin_email,
                "password": get_password_hash("admin123"),
                "name": "Super Admin",
                "role": "admin"
            }
        )
        print(f"Admin created successfully! Email: {admin_email}, Password: admin123")
        
    await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(seed_admin())
