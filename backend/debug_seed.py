import sys
import traceback

try:
    from src.db.seed import comprehensive_seed
    import asyncio
    asyncio.run(comprehensive_seed.main())
except Exception as e:
    print("=" * 80)
    print("ERROR COMPLETO:")
    print("=" * 80)
    traceback.print_exc()
    print("=" * 80)
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    sys.exit(1)
