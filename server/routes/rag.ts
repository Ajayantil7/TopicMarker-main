import { Hono } from "hono";
import { getUser } from "../kinde";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// Base RAG service URL
const RAG_SERVICE_URL = "http://127.0.0.1:8000";

// Schema for topic search
const searchTopicsSchema = z.object({
    query: z.string().min(1),
    limit: z.number().optional(),
});

// Schema for single topic generation
const singleTopicSchema = z.object({
    topic: z.string().min(1),
    num_results: z.number().optional(),
});

// Schema for URL-based MDX generation
const urlMdxSchema = z.object({
    url: z.string().url(),
    topic: z.string().min(1),
    use_llm_knowledge: z.boolean().optional(),
});

// Schema for multiple URLs MDX generation
const urlsMdxSchema = z.object({
    urls: z.array(z.string().url()),
    topic: z.string().min(1),
    use_llm_knowledge: z.boolean().optional(),
});

// Schema for content refinement
const refineSchema = z.object({
    mdx: z.string(),
    question: z.string().min(1),
});

// Schema for content refinement with selection
const refineWithSelectionSchema = z.object({
    mdx: z.string(),
    question: z.string().min(1),
    selected_text: z.string(),
    topic: z.string().min(1),
});

// Schema for content refinement with crawling
const refineWithCrawlingSchema = z.object({
    mdx: z.string(),
    question: z.string().min(1),
    selected_text: z.string(),
    topic: z.string().min(1),
    num_results: z.number().optional(),
});

// Schema for content refinement with URLs
const refineWithUrlsSchema = z.object({
    mdx: z.string(),
    question: z.string().min(1),
    selected_text: z.string(),
    topic: z.string().min(1),
    urls: z.array(z.string().url()),
});

export const ragRoute = new Hono()
    // Topic Generation
    .post("/search-topics", zValidator("json", searchTopicsSchema), async (c) => {
        const { query, limit } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/search-topics`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query, limit }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const data = await response.json();
            return c.json(data);
        } catch (error) {
            console.error(error);
            return c.json({ error: "Failed to query RAG service" }, 500);
        }
    })

    // MDX Generation
    .post("/single-topic", zValidator("json", singleTopicSchema), async (c) => {
        const { topic, num_results } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/single-topic`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ topic, num_results }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const data = await response.json();
            return c.json(data);
        } catch (error) {
            console.error(error);
            return c.json({ error: "Failed to generate MDX content" }, 500);
        }
    })

    .post("/single-topic-raw", zValidator("json", singleTopicSchema), async (c) => {
        const { topic, num_results } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/single-topic-raw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ topic, num_results }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const rawText = await response.text();
            return c.text(rawText);
        } catch (error) {
            console.error(error);
            return c.text("Failed to generate MDX content", 500);
        }
    })

    // URL-based MDX Generation
    .post("/generate-mdx-from-url", zValidator("json", urlMdxSchema), async (c) => {
        const { url, topic, use_llm_knowledge } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/generate-mdx-from-url`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url, topic, use_llm_knowledge }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const data = await response.json();
            return c.json(data);
        } catch (error) {
            console.error(error);
            return c.json({ error: "Failed to generate MDX from URL" }, 500);
        }
    })

    .post("/generate-mdx-from-url-raw", zValidator("json", urlMdxSchema), async (c) => {
        const { url, topic, use_llm_knowledge } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/generate-mdx-from-url-raw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url, topic, use_llm_knowledge }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const rawText = await response.text();
            return c.text(rawText);
        } catch (error) {
            console.error(error);
            return c.text("Failed to generate MDX from URL", 500);
        }
    })

    .post("/generate-mdx-from-urls", zValidator("json", urlsMdxSchema), async (c) => {
        const { urls, topic, use_llm_knowledge } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/generate-mdx-from-urls`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ urls, topic, use_llm_knowledge }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const data = await response.json();
            return c.json(data);
        } catch (error) {
            console.error(error);
            return c.json({ error: "Failed to generate MDX from URLs" }, 500);
        }
    })

    .post("/generate-mdx-from-urls-raw", zValidator("json", urlsMdxSchema), async (c) => {
        const { urls, topic, use_llm_knowledge } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/generate-mdx-from-urls-raw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ urls, topic, use_llm_knowledge }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const rawText = await response.text();
            return c.text(rawText);
        } catch (error) {
            console.error(error);
            return c.text("Failed to generate MDX from URLs", 500);
        }
    })

    // Content Refinement
    .post("/refine", zValidator("json", refineSchema), async (c) => {
        const { mdx, question } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/refine`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mdx, question }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const data = await response.json();
            return c.json(data);
        } catch (error) {
            console.error(error);
            return c.json({ error: "Failed to refine content" }, 500);
        }
    })

    .post("/refine-with-selection", zValidator("json", refineWithSelectionSchema), async (c) => {
        const { mdx, question, selected_text, topic } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/refine-with-selection`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mdx, question, selected_text, topic }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const data = await response.json();
            return c.json(data);
        } catch (error) {
            console.error(error);
            return c.json({ error: "Failed to refine content with selection" }, 500);
        }
    })

    .post("/refine-with-selection-raw", zValidator("json", refineWithSelectionSchema), async (c) => {
        const { mdx, question, selected_text, topic } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/refine-with-selection-raw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mdx, question, selected_text, topic }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const rawText = await response.text();
            return c.text(rawText);
        } catch (error) {
            console.error(error);
            return c.text("Failed to refine content with selection", 500);
        }
    })

    .post("/refine-with-crawling", zValidator("json", refineWithCrawlingSchema), async (c) => {
        const { mdx, question, selected_text, topic, num_results } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/refine-with-crawling`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mdx, question, selected_text, topic, num_results }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const data = await response.json();
            return c.json(data);
        } catch (error) {
            console.error(error);
            return c.json({ error: "Failed to refine content with crawling" }, 500);
        }
    })

    .post("/refine-with-crawling-raw", zValidator("json", refineWithCrawlingSchema), async (c) => {
        const { mdx, question, selected_text, topic, num_results } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/refine-with-crawling-raw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mdx, question, selected_text, topic, num_results }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const rawText = await response.text();
            return c.text(rawText);
        } catch (error) {
            console.error(error);
            return c.text("Failed to refine content with crawling", 500);
        }
    })

    .post("/refine-with-urls", zValidator("json", refineWithUrlsSchema), async (c) => {
        const { mdx, question, selected_text, topic, urls } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/refine-with-urls`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mdx, question, selected_text, topic, urls }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const data = await response.json();
            return c.json(data);
        } catch (error) {
            console.error(error);
            return c.json({ error: "Failed to refine content with URLs" }, 500);
        }
    })

    .post("/refine-with-urls-raw", zValidator("json", refineWithUrlsSchema), async (c) => {
        const { mdx, question, selected_text, topic, urls } = c.req.valid("json");
        try {
            const response = await fetch(`${RAG_SERVICE_URL}/rag/refine-with-urls-raw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mdx, question, selected_text, topic, urls }),
            });

            if (!response.ok) {
                throw new Error("RAG service error");
            }

            const rawText = await response.text();
            return c.text(rawText);
        } catch (error) {
            console.error(error);
            return c.text("Failed to refine content with URLs", 500);
        }
    });

















