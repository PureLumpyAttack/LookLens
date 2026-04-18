"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { encryptText } from "@/lib/encryption";
import { auth } from "@clerk/nextjs/server";
import { budgetConstraint } from "@/lib/constants";
import z from "zod";

const budgetSchema = z
  .number()
  .min(budgetConstraint.minimum)
  .max(budgetConstraint.maximum);

export async function registerAccount(
  maxBudget: number,
  userRealPhoto: string,
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { success, data: budget, error } = budgetSchema.safeParse(maxBudget);
  if (!success) {
    throw new Error(error.message ?? "nope");
  }

  await db.insert(users).values({
    userId: userId,
    maxBudget: budget,
    userRealPhoto: encryptText(userRealPhoto),
  });

  return true;
}
