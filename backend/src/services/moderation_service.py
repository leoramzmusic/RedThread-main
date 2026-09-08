from datetime import datetime
from typing import List, Optional
from src.models.report import Report, ReportStatus, ReportCategory
from src.models.report_rule import ReportRule, RuleAction, RuleTrigger
from src.models.user import User

async def process_report_through_rules(reported_user_id: str, last_report: Report):
    """
    Check if any automated moderation rules should be triggered 
    after a new report is received for a user.
    """
    # 1. Get all active rules
    rules = await ReportRule.find(ReportRule.is_active == True).to_list()
    if not rules:
        return

    # 2. Get user's report stats
    total_reports = await Report.find(Report.reported_user_id == reported_user_id).count()
    
    # 3. Process rules
    for rule in rules:
        trigger_tripped = False
        
        if rule.trigger_type == RuleTrigger.COUNT_THRESHOLD:
            if total_reports >= rule.threshold:
                trigger_tripped = True
        
        elif rule.trigger_type == RuleTrigger.CATEGORY:
            if last_report.category == rule.category_filter:
                # Count specifically for this category
                cat_count = await Report.find(
                    Report.reported_user_id == reported_user_id,
                    Report.category == rule.category_filter
                ).count()
                if cat_count >= rule.threshold:
                    trigger_tripped = True
                    
        # ... more trigger types if needed

        if trigger_tripped:
            await apply_rule_action(reported_user_id, rule, last_report)

async def apply_rule_action(user_id: str, rule: ReportRule, last_report: Report):
    """Apply the action defined in a moderation rule."""
    user = await User.get(user_id)
    if not user:
        return

    if rule.action == RuleAction.SUSPEND:
        user.account_status = "suspended"
        # TODO: Add suspension log or notification
        await user.save()
        
    elif rule.action == RuleAction.BLOCK:
        # Blocks are usually between users, here maybe it refers to a global block/ban
        user.account_status = "banned"
        await user.save()
        
    elif rule.action == RuleAction.HIDE:
        # Hide user from discovery/search
        # This might need a new field in Profile or User
        pass
        
    elif rule.action == RuleAction.NOTIFY:
        # Send internal notification to admins
        # TODO: Implement admin notification system
        pass

async def apply_resolution_actions(report: Report):
    """Handle side effects when a moderator resolves a report."""
    # This could include notifying the reporter, updating user reputation, etc.
    pass
