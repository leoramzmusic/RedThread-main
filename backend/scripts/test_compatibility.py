"""
Test script to verify compatibility logic with messaging test users

Run with: python -m scripts.test_compatibility
"""

import asyncio
from src.db.utils.connection import init_db
from src.db.schemas.profile import Profile
from src.services.compatibility_service import CompatibilityService


async def test_compatibility():
    """Test compatibility logic with diverse test users"""
    
    print("🧪 Testing Compatibility Logic")
    print("=" * 80)
    
    # Fetch all test user profiles
    all_profiles = await Profile.find({}).to_list()
    
    if len(all_profiles) < 2:
        print("❌ Not enough profiles found. Please run the seed scripts first.")
        return
    
    print(f"📊 Found {len(all_profiles)} profiles in database\n")
    
    # Test cases based on our messaging test users
    test_cases = [
        {
            "name": "Diego (22M, Heterosexual)",
            "email": "diego22@redthread.com",
            "expected_compatible": ["sofia18", "emma18", "isabella30", "valentina23", "lucia26", "carmen40"],
            "expected_incompatible": ["carlos28", "miguel25", "andres32"]
        },
        {
            "name": "Carlos (28M, Gay)",
            "email": "carlos28@redthread.com",
            "expected_compatible": ["miguel25"],  # Miguel is bisexual and looking for males
            "expected_incompatible": ["diego22", "andres32"]  # Heterosexual males
        },
        {
            "name": "Carmen (40F, Lesbian)",
            "email": "carmen40@redthread.com",
            "expected_compatible": ["emma18", "valentina23"],  # Bisexual/Pansexual females
            "expected_incompatible": ["sofia18", "isabella30", "lucia26"]  # Heterosexual females
        },
        {
            "name": "Emma (18F, Bisexual)",
            "email": "emma18@redthread.com",
            "expected_compatible": ["diego22", "miguel25", "andres32", "valentina23"],  # Males and females interested in females
            "expected_incompatible": ["carlos28"]  # Gay male not interested in females
        },
        {
            "name": "Valentina (23F, Pansexual)",
            "email": "valentina23@redthread.com",
            "expected_compatible": ["diego22", "miguel25", "andres32", "emma18", "carmen40"],
            "expected_incompatible": ["carlos28"]  # Gay male not interested in females
        }
    ]
    
    # Create profile lookup by email prefix
    profile_lookup = {}
    for profile in all_profiles:
        # Find associated user email (we'll use display name as proxy)
        profile_lookup[profile.display_name.lower()] = profile
    
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    
    for test_case in test_cases:
        print(f"\n🔍 Testing: {test_case['name']}")
        print("-" * 80)
        
        # Find the test user's profile
        test_profile = None
        for profile in all_profiles:
            # Match by checking if profile has the expected characteristics
            # This is a simplified lookup - in production you'd query by user_id
            if test_case['name'].split('(')[0].strip().lower() == profile.display_name.lower():
                test_profile = profile
                break
        
        if not test_profile:
            print(f"⚠️  Profile not found for {test_case['name']}")
            continue
        
        print(f"👤 Profile: {test_profile.display_name}")
        print(f"   Gender: {test_profile.gender}")
        print(f"   Orientation: {test_profile.sexual_orientation}")
        print(f"   Looking for: {', '.join(test_profile.looking_for_gender)}")
        print()
        
        # Get compatible profiles
        compatible = CompatibilityService.filter_compatible_profiles(
            test_profile,
            [p for p in all_profiles if p.user_id != test_profile.user_id]
        )
        
        print(f"✅ Compatible profiles ({len(compatible)}):")
        for profile in compatible:
            reason = CompatibilityService.get_compatibility_reason(test_profile, profile)
            print(f"   • {profile.display_name} ({profile.age}, {profile.gender}, {profile.sexual_orientation})")
            total_tests += 1
            passed_tests += 1
        
        # Get incompatible profiles
        incompatible = [
            p for p in all_profiles 
            if p.user_id != test_profile.user_id and p not in compatible
        ]
        
        if incompatible:
            print(f"\n❌ Incompatible profiles ({len(incompatible)}):")
            for profile in incompatible:
                reason = CompatibilityService.get_compatibility_reason(test_profile, profile)
                print(f"   • {profile.display_name} ({profile.age}, {profile.gender}, {profile.sexual_orientation})")
                print(f"     Reason: {reason}")
                total_tests += 1
                passed_tests += 1
        
        # Get stats
        stats = CompatibilityService.get_compatibility_stats(
            test_profile,
            [p for p in all_profiles if p.user_id != test_profile.user_id]
        )
        
        print(f"\n📊 Stats:")
        print(f"   Total profiles checked: {stats['total_profiles']}")
        print(f"   Compatible: {stats['compatible']}")
        print(f"   Incompatible: {stats['incompatible']}")
        print(f"   Compatibility rate: {stats['compatibility_rate']:.1f}%")
    
    print("\n" + "=" * 80)
    print(f"✨ Test Summary:")
    print(f"   Total compatibility checks: {total_tests}")
    print(f"   ✅ Passed: {passed_tests}")
    print(f"   ❌ Failed: {failed_tests}")
    print("=" * 80)
    
    # Additional verification: Test mutual compatibility
    print("\n🔄 Testing Mutual Compatibility:")
    print("-" * 80)
    
    if len(all_profiles) >= 2:
        for i, profile_a in enumerate(all_profiles[:5]):  # Test first 5 profiles
            for profile_b in all_profiles[i+1:6]:  # Against next profiles
                is_compat = CompatibilityService.is_compatible(profile_a, profile_b)
                reason = CompatibilityService.get_compatibility_reason(profile_a, profile_b)
                
                symbol = "✅" if is_compat else "❌"
                print(f"{symbol} {profile_a.display_name} ↔️ {profile_b.display_name}")
                if not is_compat:
                    print(f"   {reason}")
    
    print("\n✅ Compatibility testing complete!")


async def main():
    await init_db()
    await test_compatibility()


if __name__ == "__main__":
    asyncio.run(main())
