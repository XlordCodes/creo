import asyncio
from app.db.session import async_session_factory
from sqlalchemy import text

async def main():
    async with async_session_factory() as db:
        view_def = await db.execute(text("SELECT pg_get_viewdef('v_client_onboarding'::regclass, true);"))
        print("VIEW DEF:\n", view_def.scalar())
        print("\nCLIENTS:")
        res = await db.execute(text("""
            SELECT u.id, u.email, v.stage, cp.onboarding_completed_at, cp.terms_accepted_at, s.status, s.current_period_end
            FROM users u
            LEFT JOIN v_client_onboarding v ON v.client_id = u.id
            LEFT JOIN client_profiles cp ON cp.user_id = u.id
            LEFT JOIN subscriptions s ON s.client_id = u.id
            WHERE u.role = 'client'
            ORDER BY u.created_at DESC LIMIT 10;
        """))
        for row in res.all():
            print(row)

if __name__ == "__main__":
    asyncio.run(main())
