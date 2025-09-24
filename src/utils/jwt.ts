export function getExpiredTime(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload && typeof payload.exp === "number") {
      return payload.exp * 1000; // Convert to milliseconds
    }
    return 0;
  } catch (e) {
    console.error("Invalid JWT token", e);
    return 0;
  }
}
