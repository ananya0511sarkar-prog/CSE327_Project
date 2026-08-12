// lib/auth.ts or top of your page file
export interface TokenPayload {
  exp: number;
  role: string;
  sub: string;
}

export const getValidUser = (): TokenPayload | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload: TokenPayload = JSON.parse(window.atob(base64));

    // Check token expiration (JWT exp is in seconds, Date.now() is in ms)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      return null;
    }

    return payload;
  } catch (err) {
    console.error("Invalid token format:", err);
    return null;
  }
};