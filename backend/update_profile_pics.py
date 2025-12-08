import asyncio
from db import prisma

async def main():
    await prisma.connect()
    
    users = await prisma.user.find_many()
    
    print(f"Found {len(users)} users. Updating profile pictures...")
    
    for user in users:
        pic = None
        if user.role == 'doctor':
            # Default to male doctor if sex not specified, or based on sex
            if user.sex and user.sex.lower() == 'female':
                pic = '/fdoctor.png'
            else:
                pic = '/mdoctor.png'
        elif user.role == 'patient':
            if user.sex and user.sex.lower() == 'female':
                pic = '/female.png'
            else:
                pic = '/male.png'
        
        if pic:
            await prisma.user.update(
                where={'id': user.id},
                data={'profilePicture': pic}
            )
            print(f"Updated user {user.name} ({user.role}) with {pic}")
            
    await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
