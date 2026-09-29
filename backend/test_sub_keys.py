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
        res = await get_client_subscription(MockActor(client.id), db)
        
        # print the keys available
        sub = res.get('subscription')
        if sub:
            print("Subscription properties:", vars(sub).keys() if hasattr(sub, '__dict__') else sub.keys())
        
        plan = res.get('plan')
        if plan:
            print("Plan properties:", vars(plan).keys() if hasattr(plan, '__dict__') else plan.keys())

if __name__ == "__main__":
    asyncio.run(main())
