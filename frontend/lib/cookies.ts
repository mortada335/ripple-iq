/**
 * Standard browser cookie helpers for session persistence, theme, and localization.
 * Enables zero-layout-shift SSR by allowing the Next.js server to read preferences before hydration.
 */

export interface CookieOptions {
  days?: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === "undefined") return;
  const { days = 30, path = "/", sameSite = "Lax", secure = false } = options;

  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }

  const secureFlag = secure || (typeof window !== "undefined" && window.location.protocol === "https:") ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=${path}; SameSite=${sameSite}${secureFlag}`;
}

export function deleteCookie(name: string, path: string = "/"): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Lax`;
}
