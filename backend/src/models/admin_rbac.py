from beanie import Document
from pydantic import Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class AdminRole(str, Enum):
    """Admin roles with different permission levels"""
    SUPER_ADMIN = "super_admin"  # Full access to everything
    MODERATOR = "moderator"  # Content moderation and user management
    SUPPORT = "support"  # Support tickets and user assistance
    ANALYST = "analyst"  # Read-only access to metrics and reports
    MARKETING = "marketing"  # Campaign and marketing management
    FINANCE = "finance"  # Financial data and subscriptions


class Permission(str, Enum):
    """Granular permissions for admin actions"""
    # User Management
    VIEW_USERS = "view_users"
    EDIT_USERS = "edit_users"
    SUSPEND_USERS = "suspend_users"
    BAN_USERS = "ban_users"
    DELETE_USERS = "delete_users"
    
    # Reports & Moderation
    VIEW_REPORTS = "view_reports"
    EDIT_REPORTS = "edit_reports" # New
    HANDLE_REPORTS = "handle_reports"
    ASSIGN_REPORTS = "assign_reports"
    MODERATE_CONTENT = "moderate_content"
    
    # Metrics & Analytics
    VIEW_METRICS = "view_metrics"
    EXPORT_METRICS = "export_metrics"
    
    # Events
    VIEW_EVENTS = "view_events"
    CREATE_EVENTS = "create_events"
    EDIT_EVENTS = "edit_events"
    DELETE_EVENTS = "delete_events"
    
    # Employees
    VIEW_EMPLOYEES = "view_employees"
    MANAGE_EMPLOYEES = "manage_employees"
    ASSIGN_ROLES = "assign_roles"
    MANAGE_LEAVE_REQUESTS = "manage_leave_requests" # New
    HANDLE_CONTRACTS = "handle_contracts" # New
    
    # Finance
    VIEW_FINANCES = "view_finances"
    EDIT_FINANCES = "edit_finances" # New
    MANAGE_SUBSCRIPTIONS = "manage_subscriptions"
    PROCESS_REFUNDS = "process_refunds"
    HANDLE_INVOICES = "handle_invoices" # New
    APPROVE_BUDGETS = "approve_budgets" # New
    
    # Campaigns & Marketing
    VIEW_CAMPAIGNS = "view_campaigns"
    CREATE_CAMPAIGNS = "create_campaigns"
    MANAGE_CAMPAIGNS = "manage_campaigns"
    MANAGE_SOCIAL_ACCOUNTS = "manage_social_accounts" # New
    SCHEDULE_POSTS = "schedule_posts" # New
    
    # Support
    VIEW_TICKETS = "view_tickets"
    HANDLE_TICKETS = "handle_tickets"
    CLOSE_TICKETS = "close_tickets"
    SEND_NOTIFICATIONS = "send_notifications" # New
    FLAG_CONTENT = "flag_content" # New
    
    # Configuration & IT
    VIEW_CONFIG = "view_config"
    EDIT_CONFIG = "edit_config"
    MANAGE_INTEGRATIONS = "manage_integrations"
    ACCESS_LOGS = "access_logs" # New
    RESET_PASSWORDS = "reset_passwords" # New
    DEPLOY_UPDATES = "deploy_updates" # New
    MANAGE_BACKUPS = "manage_backups" # New

    # Sales & CRM
    ASSIGN_CLIENTS = "assign_clients" # New
    MANAGE_LEADS = "manage_leads" # New
    TRACK_SALES = "track_sales" # New

    # Operations & Logistics
    MANAGE_INVENTORY = "manage_inventory" # New
    TRACK_SHIPMENTS = "track_shipments" # New
    ASSIGN_TASKS = "assign_tasks" # New

    # Legal & Compliance
    APPROVE_POLICIES = "approve_policies" # New
    AUDIT_ROLES = "audit_roles" # New


# Role-Permission Matrix
ROLE_PERMISSIONS = {
    AdminRole.SUPER_ADMIN: [p for p in Permission],  # All permissions
    
    AdminRole.MODERATOR: [
        Permission.VIEW_USERS,
        Permission.EDIT_USERS,
        Permission.SUSPEND_USERS,
        Permission.VIEW_REPORTS,
        Permission.HANDLE_REPORTS,
        Permission.ASSIGN_REPORTS,
        Permission.MODERATE_CONTENT,
        Permission.VIEW_METRICS,
    ],
    
    AdminRole.SUPPORT: [
        Permission.VIEW_USERS,
        Permission.VIEW_TICKETS,
        Permission.HANDLE_TICKETS,
        Permission.CLOSE_TICKETS,
        Permission.VIEW_REPORTS,
    ],
    
    AdminRole.ANALYST: [
        Permission.VIEW_METRICS,
        Permission.EXPORT_METRICS,
        Permission.VIEW_USERS,
        Permission.VIEW_REPORTS,
        Permission.VIEW_EVENTS,
        Permission.VIEW_FINANCES,
        Permission.VIEW_CAMPAIGNS,
    ],
    
    AdminRole.MARKETING: [
        Permission.VIEW_CAMPAIGNS,
        Permission.CREATE_CAMPAIGNS,
        Permission.MANAGE_CAMPAIGNS,
        Permission.VIEW_METRICS,
        Permission.VIEW_USERS,
    ],
    
    AdminRole.FINANCE: [
        Permission.VIEW_FINANCES,
        Permission.MANAGE_SUBSCRIPTIONS,
        Permission.PROCESS_REFUNDS,
        Permission.VIEW_METRICS,
        Permission.VIEW_USERS,
    ],
}


class AdminUser(Document):
    """
    Admin user with role-based permissions.
    Links to regular User document.
    """
    
    user_id: str  # Reference to User._id
    
    # Old field for compatibility (optional)
    role: Optional[AdminRole] = None 
    
    # New dynamic system
    roles: List[str] = Field(default_factory=list) # List of Role.slug
    custom_permissions: List[Permission] = Field(default_factory=list)  # Additional permissions
    
    # Metadata
    assigned_by: Optional[str] = None  # User ID of who assigned this role
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    # Audit
    last_login: Optional[datetime] = None
    login_count: int = 0
    
    # Theme Preference (independent from user portal)
    admin_theme_mode: str = "light"  # light, dark
    
    class Settings:
        name = "admin_users"
        indexes = [
            "user_id",
            "roles",
            "is_active",
        ]
    
    async def has_permission(self, permission: Permission) -> bool:
        """Check if admin user has a specific permission (Async)"""
        if not self.is_active:
            return False
        
        from .role import Role
        
        # 1. Check dynamic roles from DB
        if self.roles:
            roles_data = await Role.find({"slug": {"$in": self.roles}, "is_active": True}).to_list()
            for r in roles_data:
                if permission in r.permissions:
                    return True
            
            # Shortcut for superadmin
            if "superadmin" in self.roles:
                return True
        
        # 2. Check old-style Enum role (fallback/migration)
        if self.role:
            role_perms = ROLE_PERMISSIONS.get(self.role, [])
            if permission in role_perms:
                return True
        
        # 3. Check custom permissions
        if permission in self.custom_permissions:
            return True
        
        return False

    async def has_all_permissions(self, permissions: List[Permission]) -> bool:
        """Check if admin user has all of the specified permissions"""
        for p in permissions:
            if not await self.has_permission(p):
                return False
        return True

    async def has_any_permission(self, permissions: List[Permission]) -> bool:
        """Check if admin user has any of the specified permissions"""
        for p in permissions:
            if await self.has_permission(p):
                return True
        return False
    
    async def get_all_permissions(self) -> List[Permission]:
        """Get all permissions for this admin user (Async)"""
        all_perms = set(self.custom_permissions)
        
        from .role import Role
        
        # 1. Add permissions from dynamic roles
        if self.roles:
            roles_data = await Role.find({"slug": {"$in": self.roles}, "is_active": True}).to_list()
            for r in roles_data:
                all_perms.update(r.permissions)
        
        # 2. Add permissions from old-style role
        if self.role:
            all_perms.update(ROLE_PERMISSIONS.get(self.role, []))
            
        return list(all_perms)


class AdminAction(Document):
    """
    Audit log for admin actions.
    Tracks all administrative actions for compliance and security.
    """
    
    admin_user_id: str  # User ID of admin who performed action
    action_type: str  # e.g., "suspend_user", "delete_report", "update_config"
    target_type: str  # e.g., "user", "report", "event"
    target_id: Optional[str] = None  # ID of affected resource
    
    # Details
    description: str
    metadata: dict = Field(default_factory=dict)  # Additional context
    
    # Result
    success: bool = True
    error_message: Optional[str] = None
    
    # Timestamp
    performed_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "admin_actions"
        indexes = [
            "admin_user_id",
            "action_type",
            "target_type",
            "performed_at",
            [("admin_user_id", 1), ("performed_at", -1)],
        ]

