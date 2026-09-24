export enum AppearanceType {
  FAVICON = "favicon",
  LOGO = "logo",
  BANNER = "banner",
  MULTIMEDIA = "multimedia",
  THEME = "theme",
  LANDING_BANNER = "landing_banner",
  LANDING_THEME = "landing_theme",
  LANDING_NAVBAR = "landing_navbar",
  LANDING_NAVBAR_STYLE = "landing_navbar_style",
  LANDING_SECTIONS = "landing_sections",
  LANDING_LANGUAGES = "landing_languages",
  FAVICON_USER = "favicon_user",
}

export enum Platform {
  WEB = "web",
  ANDROID = "android",
  IOS = "ios",
  ALL = "all"
}

export interface AppearanceResource {
  _id?: string;
  type: AppearanceType;
  platform: Platform;
  url: string;
  resolution?: string;
  metadata?: Record<string, any>;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  description?: string;
  created_at?: string;
}

export enum HistoryAction {
    ACTIVATED = "activated",
    DEACTIVATED = "deactivated",
    UPLOADED = "uploaded",
    UPDATED = "updated",
    DELETED = "deleted"
}

export interface AppearanceHistory {
    _id?: string;
    resource_id: string;
    action: HistoryAction;
    user_id: string;
    user_name?: string;
    context?: string;
    timestamp: string;
}
