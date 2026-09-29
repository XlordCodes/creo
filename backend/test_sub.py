import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models.user import User
from app.routers.payments import get_client_subscription

class MockActor:
    def __init__(self, user_id):
        self.user_id = user_id
        self.client_id = user_id
        self.role = "client"

async def main():
    engine = create_async_engine(settings.DIRECT_DATABASE_URL, echo=False, future=True)
    async_session = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        stmt = select(User).where(User.email == "newbusiness@creo.com")
        client = (await db.execute(stmt)).scalars().first()
        if not client:
            print("Client not found")
            return
            
        res = await get_client_subscription(MockActor(client.id), db)
        print("Subscription Details:")
        print(res)

if __name__ == "__main__":
    asyncio.run(main())
