"""SMS delivery.

Mock today: logs the code to the console. The interface mirrors what a real
provider (Twilio) will need, so swapping later only touches this module.
"""

import os


def send_sms(phone: str, code: str) -> bool:
    """Send a verification code to `phone`. Returns True on success."""
    debug = os.environ.get("DEBUG", "").lower() == "true"
    if debug or os.environ.get("ENVIRONMENT", "") in ("dev", "local"):
        print(f"[SMS MOCK] To {phone}: your RedThread code is {code}")
        return True

    # Real provider (Twilio) goes here once credentials are configured.
    print(f"[SMS MOCK] To {phone}: your RedThread code is {code} (provider not configured)")
    return True
