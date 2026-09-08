import pytest
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
from src.care.scoring.compatibility import calculate_intent_compatibility

def test_exact_intent_match():
    user_goals = ["serious_relationship"]
    candidate_goals = ["serious_relationship"]
    score = calculate_intent_compatibility(user_goals, candidate_goals)
    assert score == 1.0

def test_flexible_serious_match():
    # serious vs open_to_serious (💕)
    user_goals = ["serious_relationship"]
    candidate_goals = ["open_relationship"] 
    score = calculate_intent_compatibility(user_goals, candidate_goals)
    assert score == 0.75

def test_flexible_fun_match():
    # casual vs short_term_fun (😎 vs 🧑‍🤝‍🧑)
    user_goals = ["casual_fun"]
    candidate_goals = ["short_term_fun"]
    score = calculate_intent_compatibility(user_goals, candidate_goals)
    assert score == 0.75

def test_undecided_neutral():
    user_goals = ["undecided"]
    candidate_goals = ["serious_relationship"]
    score = calculate_intent_compatibility(user_goals, candidate_goals)
    assert score == 0.5

def test_mismatch():
    # friendship vs serious
    user_goals = ["friendship"]
    candidate_goals = ["serious_relationship"]
    score = calculate_intent_compatibility(user_goals, candidate_goals)
    assert score == 0.2

def test_multi_goal_match():
    user_goals = ["friendship", "hobbies"]
    candidate_goals = ["hobbies", "travel"]
    score = calculate_intent_compatibility(user_goals, candidate_goals)
    assert score == 1.0
