# migrate_passwords.py — run once, then delete
import asyncio
from main import AsyncSessionLocal, UserDB, hash_password
from sqlalchemy import select

async def migrate():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(UserDB))
        users = result.scalars().all()
        for u in users:
            if not u.password.startswith("$2b$"):
                u.password = hash_password(u.password)
        await db.commit()
    print("Done — all plaintext passwords replaced with bcrypt hashes.")

asyncio.run(migrate())