import asyncio
from app.db.session import async_session_factory
from sqlalchemy import select, text
from app.models.user import User
from app.routers.portal_dashboard import get_portal_dashboard
from app.models.enums import UserRole

async def test_dashboard_for_user(email):
    async with async_session_factory() as db:
        res = await db.execute(select(User).where(User.email == email))
        user = res.scalar_one_or_none()
        if not user:
            print(f"User {email} not found")
            return
        
        from app.core.rbac import Actor
        actor = Actor(user_id=user.id, role=UserRole.CLIENT, email=user.email, client_id=user.id)
        
        dash = await get_portal_dashboard(actor=actor, db=db)
        print(f"\n--- Result for {email} ---")
        print(f"onboarding_stage: {dash.get('onboarding_stage')}")
        print(f"has_active_subscription: {dash.get('has_active_subscription')}")
        print(f"account_status: {dash.get('account_status')}")
        print(f"active_plan: {dash.get('active_plan')}")
        print(f"terms_accepted: {dash.get('terms_accepted')}")

async def main():
    for email in ["client1@stage1.com", "mukeshkumar06lav@gmail.com", "andropedia.rmp@gmail.com"]:
        await test_dashboard_for_user(email)

if __name__ == "__main__":
    asyncio.run(main())
