export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  GROUPS: "/groups",
  GROUP_DETAIL: (id: string) => `/groups/${id}`,
  REMINDERS: "/reminders",
  NOTIFICATIONS: "/notifications",
  ACTIVITY: "/activity",
  PROFILE: "/profile",
} as const;
