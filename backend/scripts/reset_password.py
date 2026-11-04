#!/usr/bin/env python3
"""
Utility script to view users or reset a user's password in MongoDB.

Usage:
    # 1. List all users and emails:
    python3 scripts/reset_password.py --list

    # 2. Reset a user's password:
    python3 scripts/reset_password.py test2@gmail.com NewPassword123!
"""

import sys
import asyncio
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import DatabaseManager
from app.core.security import hash_password


async def list_users():
    await DatabaseManager.connect()
    db = DatabaseManager.get_database()
    users = await db["users"].find({}, {"email": 1, "name": 1, "created_at": 1, "_id": 0}).to_list(100)
    print("\n--- Registered Users in MongoDB (`mentalwell` database) ---")
    if not users:
        print("No users found.")
    for idx, u in enumerate(users, 1):
        print(f"{idx}. Name: {u.get('name', 'N/A')} | Email: {u.get('email')} | Created: {u.get('created_at')}")
    print("-----------------------------------------------------------\n")
    await DatabaseManager.disconnect()


async def reset_password(email: str, new_password: str):
    await DatabaseManager.connect()
    db = DatabaseManager.get_database()
    user = await db["users"].find_one({"email": email.strip().lower()})
    if not user:
        print(f"Error: No user found with email '{email}'.")
        print("Tip: Run `python3 scripts/reset_password.py --list` to see registered emails.")
        await DatabaseManager.disconnect()
        return

    new_hash = hash_password(new_password)
    result = await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": new_hash}}
    )
    if result.modified_count > 0:
        print(f"Success! Password for '{email}' has been reset to: {new_password}")
        print("You can now log in at http://localhost:5173/login")
    else:
        print("Password was not modified.")
    await DatabaseManager.disconnect()


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        return

    if sys.argv[1] in ("--list", "-l"):
        asyncio.run(list_users())
    elif len(sys.argv) == 3:
        email = sys.argv[1]
        new_password = sys.argv[2]
        asyncio.run(reset_password(email, new_password))
    else:
        print("Invalid arguments. Run with --help for instructions.")


if __name__ == "__main__":
    main()
