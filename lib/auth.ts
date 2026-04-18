import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";

export async function getAuthState() {
  const { userId } = await auth();

  if (userId == null) {
    return {
      authenticated: false,
    };
  }

  const user = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.userId, userId));

  if (user[0].count == 0) {
    return {
      authenticated: true,
      onboarded: false,
    };
  }

  return {
    authenticated: true,
    onboarded: true,
    userData: user[0],
  };
}
