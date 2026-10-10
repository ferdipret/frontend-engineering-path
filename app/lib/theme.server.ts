import { createCookie } from "react-router";

export const THEMES = {
  "": "Default (follows system)",
  paper: "Paper",
  terminal: "Terminal",
  studio: "Studio",
  blueprint: "Blueprint",
} as const;

export type Theme = keyof typeof THEMES;

export const isTheme = (value: unknown): value is Theme => typeof value === "string" && value in THEMES;

// Stored in a cookie so the server renders the right theme and there is no flash.
const cookie = createCookie("fe-path-theme", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });

export async function getTheme(request: Request): Promise<Theme> {
  const value: unknown = await cookie.parse(request.headers.get("Cookie"));
  return isTheme(value) ? value : "";
}

export const serializeTheme = (theme: Theme) => cookie.serialize(theme);
