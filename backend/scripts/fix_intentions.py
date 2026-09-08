import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings

async def fix_malformed_intentions():
    """
    Finds and fixes profiles where 'intentions' list contains string representations 
    of IntentionType members (e.g., 'IntentionType.FRIENDSHIP') instead of values ('friendship').
    """
    print(f"Connecting to database: {settings.MONGODB_DB_NAME}...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    profiles_collection = db["Profile"]

    # Mapping of member names to values
    # These are the ones seen in the error logs or predicted
    mapping = {
        "IntentionType.SERIOUS_RELATIONSHIP": "serious_relationship",
        "IntentionType.OPEN_RELATIONSHIP": "open_relationship",
        "IntentionType.CASUAL_FUN": "casual_fun",
        "IntentionType.CASUAL": "casual",
        "IntentionType.SHORT_TERM_FUN": "short_term_fun",
        "IntentionType.FRIENDSHIP": "friendship",
        "IntentionType.UNDECIDED": "undecided",
        "IntentionType.HOBBIES": "hobbies",
        "IntentionType.TRAVEL": "travel",
        "IntentionType.TRAVEL_TOGETHER": "travel_together",
        "IntentionType.ROMANCE": "romance",
        "IntentionType.PROJECTS": "projects",
        "IntentionType.GAMING": "gaming",
        "IntentionType.CONVERSATION": "conversations",
        "IntentionType.NETWORKING": "networking",
        "IntentionType.HANG_OUT": "hang_out"
    }

    cursor = profiles_collection.find({"intentions": {"$exists": True, "$type": "array"}})
    
    total_checked = 0
    total_fixed = 0

    async for profile in cursor:
        total_checked += 1
        intentions = profile.get("intentions", [])
        needs_fix = False
        new_intentions = []
        
        for item in intentions:
            if isinstance(item, str) and item in mapping:
                new_intentions.append(mapping[item])
                needs_fix = True
            elif isinstance(item, str) and item.startswith("IntentionType."):
                # Catch-all for any other IntentionType. prefixed strings
                val = item.split(".")[-1].lower()
                # Special cases for plurals or mismatches if any
                if val == "conversation": val = "conversations"
                new_intentions.append(val)
                needs_fix = True
            else:
                new_intentions.append(item)
        
        if needs_fix:
            print(f"Fixing profile for user {profile.get('user_id')}: {intentions} -> {new_intentions}")
            await profiles_collection.update_one(
                {"_id": profile["_id"]},
                {"$set": {"intentions": new_intentions}}
            )
            total_fixed += 1

    print(f"\nFinished! Checked {total_checked} profiles. Fixed {total_fixed} profiles.")

if __name__ == "__main__":
    asyncio.run(fix_malformed_intentions())
