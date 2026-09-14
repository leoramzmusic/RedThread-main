"""Tests for calculate_profile_completion parity with the frontend (utils/profileScoring.ts)."""

from src.api.profiles import calculate_profile_completion


class FakeLocation:
    def __init__(self, city=None):
        self.city = city


class FakeUser:
    def __init__(self, display_name=None):
        self.display_name = display_name


class FakeProfile:
    """Duck-typed Profile with the fields used by calculate_profile_completion."""

    def __init__(self):
        self.nickname = None
        self.age = None
        self.gender = None
        self.city = None
        self.location = None
        self.bio = None
        self.relationship_goals = None
        self.interests = []
        self.lifestyle_interests = []
        self.pronouns = None
        self.height_cm = None
        self.zodiac = None
        self.zodiac_relevant = True
        self.relationship_type = None
        self.education_center = None
        self.education_level = None
        self.occupation = None
        self.work_company = None
        self.mi_himno = None
        self.sexual_orientation = None
        self.relationship_status = None
        self.languages = []
        self.photos = []
        self.social_style = None
        self.processing_style = None
        self.risk_tolerance = None
        self.decision_making = None
        self.neurodiversity = None
        self.learning_preferences = None
        self.energy_level = None
        self.disabilities = None
        self.health_conditions = None
        self.health_status = None


def empty_profile():
    return FakeProfile()


def complete_profile():
    p = empty_profile()
    p.nickname = "luna"
    p.age = 27
    p.gender = "woman"
    p.city = "CDMX"
    p.bio = "Hola desde el vidrio. ✨"
    p.relationship_goals = ["serious_relationship"]
    p.interests = ["música", "arte"]
    p.pronouns = "ella"
    p.height_cm = 170
    p.zodiac = "libra"
    p.relationship_type = "monogamous"
    p.education_center = "UNAM"
    p.education_level = "university"
    p.occupation = "diseñadora"
    p.work_company = "RETH"
    p.mi_himno = {"connected": True, "favorite_artists": ["Soda Stereo"]}
    p.sexual_orientation = "bisexual"
    p.relationship_status = "single"
    p.languages = ["es", "en"]
    p.photos = ["http://localhost:8000/static/uploads/a.jpg"]
    p.social_style = "ambivert"
    p.processing_style = "visual"
    p.risk_tolerance = "medium"
    p.decision_making = "balanced"
    p.neurodiversity = "neurodivergent"
    p.learning_preferences = "practical"
    p.energy_level = "balanced"
    p.disabilities = "none"
    p.health_conditions = "none"
    return p


def test_empty_profile_scores_zero():
    assert calculate_profile_completion(empty_profile()) == 0


def test_complete_profile_reaches_100_percent():
    # A fully completed profile must show 100%, matching the frontend editor.
    assert calculate_profile_completion(complete_profile(), FakeUser("luna")) == 100


def test_zodiac_not_relevant_counts_as_complete():
    # Frontend (profileScoring.ts) credits zodiac when the user marks it as
    # "not relevant" (zodiac_relevant === false). Backend must mirror it.
    p = complete_profile()
    p.zodiac = None
    p.zodiac_relevant = False
    assert calculate_profile_completion(p, FakeUser("luna")) == 100


def test_lifestyle_interests_count_for_interests_slot():
    # lifestyle_interests is an alternative source for the 'interests' slot,
    # mirroring the frontend: hasValue(interests) || hasValue(lifestyle_interests).
    p = complete_profile()
    p.interests = []
    p.lifestyle_interests = ["teatro", "senderismo"]
    assert calculate_profile_completion(p, FakeUser("luna")) == 100