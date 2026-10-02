import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL").replace("postgresql+asyncpg", "postgresql")

async def main():
    conn = await asyncpg.connect(DB_URL)
    try:
        val = await conn.fetchval("SELECT enum_range(NULL::ticket_status);")
        print("Current ticket_status enum values:", val)

        try:
            await conn.execute("ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'closed';")
            print("Added lowercase closed")
        except Exception as e:
            print("Failed lowercase:", e)

        try:
            await conn.execute("ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'CLOSED';")
            print("Added uppercase CLOSED")
        except Exception as e:
            print("Failed uppercase:", e)

        val = await conn.fetchval("SELECT enum_range(NULL::ticket_status);")
        print("Updated ticket_status enum values:", val)
    except Exception as e:
        print("Error:", e)
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
