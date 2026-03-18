import argparse

from database.database import Base, SessionLocal, engine
from database.schema import Scan
from services.demo_seed import seed_demo_data_if_empty


def main(reset: bool = False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if reset:
            db.query(Scan).delete()
            db.commit()
        count = seed_demo_data_if_empty(db)
        print(f"Seeded {count} demo records.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear existing records before seeding demo data.",
    )
    args = parser.parse_args()
    main(reset=args.reset)
