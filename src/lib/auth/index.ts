// Authentication utilities — placeholder for future implementation
export type AuthSession = {
  userId: string;
  role: "driver" | "customer" | "admin";
};

export async function getSession(): Promise<AuthSession | null> {
  return null;
}
