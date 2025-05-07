import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getUser } from "../kinde";
import { hasRole, hasAnyRole } from "../middleware/authorize";
import { db } from "../db";
import {
    lessonPlans as lessonPlanTable,
    insertLessonPlanSchema,
} from "../db/schema/lessonPlans.ts";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

// Define the create lesson plan schema for API validation
export const createLessonPlanSchema = z.object({
    name: z.string().min(1),
    mainTopic: z.string().min(1),
    topics: z.array(z.object({
        topic: z.string().min(1),
        mdxContent: z.string(),
        isSubtopic: z.boolean(),
        parentTopic: z.string().optional()
    }))
});

export const lessonPlansRoute = new Hono()
    // Get all lesson plans for the user
    .get("/", getUser, async (c) => {
        const user = c.var.user;
        const lessonPlans = await db
            .select()
            .from(lessonPlanTable)
            .where(eq(lessonPlanTable.userId, user.id))
            .orderBy(desc(lessonPlanTable.createdAt))
            .limit(100);
        return c.json({ lessonPlans });
    })

    // Get a specific lesson plan by ID
    .get("/:id", getUser, async (c) => {
        const user = c.var.user;
        const id = parseInt(c.req.param("id"));
        
        if (isNaN(id)) {
            c.status(400);
            return c.json({ error: "Invalid lesson plan ID" });
        }
        
        const lessonPlan = await db
            .select()
            .from(lessonPlanTable)
            .where(and(
                eq(lessonPlanTable.id, id),
                eq(lessonPlanTable.userId, user.id)
            ))
            .limit(1);
            
        if (!lessonPlan.length) {
            c.status(404);
            return c.json({ error: "Lesson plan not found" });
        }
        
        return c.json(lessonPlan[0]);
    })

    // Create a new lesson plan
    .post("/", getUser, zValidator("json", createLessonPlanSchema), async (c) => {
        const lessonPlanData = await c.req.valid("json");
        const user = c.var.user;
        const validatedLessonPlan = insertLessonPlanSchema.parse({
            ...lessonPlanData,
            userId: user.id,
        });

        const result = await db
            .insert(lessonPlanTable)
            .values(validatedLessonPlan)
            .returning()
            .then((res) => res[0]);

        c.status(201);
        return c.json(result);
    })

    // Update an existing lesson plan
    .put("/:id", getUser, zValidator("json", createLessonPlanSchema), async (c) => {
        const lessonPlanData = await c.req.valid("json");
        const user = c.var.user;
        const id = parseInt(c.req.param("id"));
        
        if (isNaN(id)) {
            c.status(400);
            return c.json({ error: "Invalid lesson plan ID" });
        }
        
        // Check if the lesson plan exists and belongs to the user
        const existingLessonPlan = await db
            .select()
            .from(lessonPlanTable)
            .where(and(
                eq(lessonPlanTable.id, id),
                eq(lessonPlanTable.userId, user.id)
            ))
            .limit(1);
            
        if (!existingLessonPlan.length) {
            c.status(404);
            return c.json({ error: "Lesson plan not found" });
        }
        
        // Update the lesson plan
        const result = await db
            .update(lessonPlanTable)
            .set({
                name: lessonPlanData.name,
                mainTopic: lessonPlanData.mainTopic,
                topics: lessonPlanData.topics,
                updatedAt: new Date()
            })
            .where(and(
                eq(lessonPlanTable.id, id),
                eq(lessonPlanTable.userId, user.id)
            ))
            .returning()
            .then((res) => res[0]);
            
        return c.json(result);
    })

    // Delete a lesson plan
    .delete("/:id", getUser, async (c) => {
        const user = c.var.user;
        const id = parseInt(c.req.param("id"));
        
        if (isNaN(id)) {
            c.status(400);
            return c.json({ error: "Invalid lesson plan ID" });
        }
        
        // Check if the lesson plan exists and belongs to the user
        const existingLessonPlan = await db
            .select()
            .from(lessonPlanTable)
            .where(and(
                eq(lessonPlanTable.id, id),
                eq(lessonPlanTable.userId, user.id)
            ))
            .limit(1);
            
        if (!existingLessonPlan.length) {
            c.status(404);
            return c.json({ error: "Lesson plan not found" });
        }
        
        // Delete the lesson plan
        await db
            .delete(lessonPlanTable)
            .where(and(
                eq(lessonPlanTable.id, id),
                eq(lessonPlanTable.userId, user.id)
            ));
            
        c.status(204);
        return c.body(null);
    });
