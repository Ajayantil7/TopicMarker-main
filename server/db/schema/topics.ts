import { text, pgTable, serial, index, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from "zod";

export const topics = pgTable(
    "topics",
    {
        id: serial("id").primaryKey(),
        userId: text("user_id").notNull(),
        axiosWing: text("axios_wing").notNull(),
        topic: text("topic").notNull(),
        difficulty: text("difficulty").notNull().default("Beginner"),
        mdxContent: text("mdx_content").notNull(),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow()
    },
    (topics) => {
        return {
            userIdIndex: index("user_id_idx").on(topics.userId),
            axiosWingIndex: index("axios_wing_idx").on(topics.axiosWing)
        };
    }
);

// Schema for inserting a topic - can be used to validate API requests
export const insertTopicSchema = createInsertSchema(topics, {
    axiosWing: z.string().min(1, { message: "Axios Wing must not be empty" }),
    topic: z.string().min(3, { message: "Topic must be at least 3 characters" }),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
    mdxContent: z.string().min(10, { message: "Lecture notes must be at least 10 characters" })
});

// Schema for selecting a Topic - can be used to validate API responses
export const selectTopicSchema = createSelectSchema(topics);