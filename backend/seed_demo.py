import argparse
import asyncio

from sqlalchemy import delete
from database.database import Base, SessionLocal, engine
from database.schema import Scan
from services.demo_seed import seed_demo_data_if_empty


async def main(reset: bool = False):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with SessionLocal() as db:
        try:
            if reset:
                await db.execute(delete(Scan))
                await db.commit()
            count = await seed_demo_data_if_empty(db)
            print(f"Seeded {count} demo records.")
        finally:
            pass  # SessionLocal as context manager handles closing


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear existing records before seeding demo data.",
    )
    args = parser.parse_args()
    asyncio.run(main(reset=args.reset))
