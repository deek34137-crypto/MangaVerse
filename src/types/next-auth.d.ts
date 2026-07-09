import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    username: string;
    displayName: string;
    avatar?: string;
    preferences?: Record<string, unknown>;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    username: string;
    displayName: string;
    avatar?: string;
    preferences?: Record<string, unknown>;
  }
}
