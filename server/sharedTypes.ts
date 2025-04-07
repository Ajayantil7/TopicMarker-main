import { insertExpensesSchema } from "./db/schema/expenses";
import { z } from "zod";

// Expense types
export const createExpenseSchema = insertExpensesSchema.omit({
  userId: true,
  createdAt: true,
  id: true,
});

export type CreateExpense = z.infer<typeof createExpenseSchema>;

// Topic types
export const createTopicSchema = z.object({
  axiomWing: z.string().min(1, { message: "Axiom Wing must not be empty" }),
  topic: z.string().min(3, { message: "Topic must be at least 3 characters" }),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  mdxContent: z.string().min(10, { message: "Lecture notes must be at least 10 characters" })
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export type Topic = {
  id: number;
  userId: string;
  axiomWing: string;
  topic: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  mdxContent: string;
  createdAt: string;
  updatedAt: string;
};