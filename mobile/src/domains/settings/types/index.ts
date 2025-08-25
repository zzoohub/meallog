// Settings and user preferences types
export interface UserPreferences {
  language: "en" | "ko";
  theme: "light" | "dark" | "system";
  notifications: {
    posts: boolean;
    likes: boolean;
    follows: boolean;
  };
  privacy: {
    showLocation: boolean;
    allowAnalytics: boolean;
  };
}