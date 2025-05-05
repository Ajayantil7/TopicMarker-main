import { Hono } from "hono";
import { getUser } from "../kinde"; import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const ragQuerySchema = z.object({
    query: z.string().min(1),
});

export const ragRoute = new Hono()
.get("/", getUser, zValidator("query", ragQuerySchema), async (c) => {
    const { query } = c.req.valid("query");
    try {
        const response = await fetch("http://your-python-service:8080/query", {
            method: "POST", headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
        });
        if (!response.ok) {
            throw new Error("RAG service error");
        }
        const data = await response.json();
        return c.json(data);
    } catch (error) {
        console.error(error); return c.json({ error: "Failed to query RAG service" }, 500);
    }
});

















