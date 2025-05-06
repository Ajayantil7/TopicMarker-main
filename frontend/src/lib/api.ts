import { hc } from "hono/client";
import { type ApiRoutes } from "@server/app";
import { queryOptions } from "@tanstack/react-query";

const client = hc<ApiRoutes>("/");

export const api = client.api;

async function getCurrentUser() {
  const res = await api.me.$get();
  if (!res.ok) {
    throw new Error("server error");
  }
  const data = await res.json();
  return data;
}

export const userQueryOptions = queryOptions({
  queryKey: ["get-current-user"],
  queryFn: getCurrentUser,
  staleTime: Infinity,
});

// RAG API functions

// Search for topics
export async function searchTopics(query: string, limit?: number) {
  const res = await api.rag["search-topics"].$post({
    json: { query, limit }
  });
  if (!res.ok) {
    throw new Error("Failed to search topics");
  }
  const data = await res.json();
  return data;
}

// Generate MDX content for a single topic
export async function generateSingleTopic(selectedTopic: string, mainTopic: string, numResults?: number) {
  const res = await api.rag["single-topic"].$post({
    json: { selected_topic: selectedTopic, main_topic: mainTopic, topic: selectedTopic, num_results: numResults }
  });
  if (!res.ok) {
    throw new Error("Failed to generate MDX content");
  }
  const data = await res.json();
  return data;
}

// Generate raw MDX content for a single topic
export async function generateSingleTopicRaw(selectedTopic: string, mainTopic: string, numResults?: number) {
  try {
    console.log('API call params:', { selected_topic: selectedTopic, main_topic: mainTopic, topic: selectedTopic, num_results: numResults });
    const res = await api.rag["single-topic-raw"].$post({
      json: { selected_topic: selectedTopic, main_topic: mainTopic, topic: selectedTopic, num_results: numResults }
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'No error text available');
      console.error('Server error response:', errorText);
      throw new Error(`Failed to generate raw MDX content: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    return text;
  } catch (error) {
    console.error('Error in generateSingleTopicRaw:', error);
    throw error;
  }
}

// Generate MDX content using LLM only
export async function generateMdxLlmOnly(selectedTopic: string, mainTopic: string) {
  const res = await api.rag["generate-mdx-llm-only"].$post({
    json: { selected_topic: selectedTopic, main_topic: mainTopic, topic: selectedTopic }
  });
  if (!res.ok) {
    throw new Error("Failed to generate MDX content using LLM only");
  }
  const data = await res.json();
  return data;
}

// Generate raw MDX content using LLM only
export async function generateMdxLlmOnlyRaw(selectedTopic: string, mainTopic: string) {
  try {
    console.log('API call params (LLM only):', { selected_topic: selectedTopic, main_topic: mainTopic, topic: selectedTopic });
    const res = await api.rag["generate-mdx-llm-only-raw"].$post({
      json: { selected_topic: selectedTopic, main_topic: mainTopic, topic: selectedTopic }
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'No error text available');
      console.error('Server error response (LLM only):', errorText);
      throw new Error(`Failed to generate raw MDX content using LLM only: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    return text;
  } catch (error) {
    console.error('Error in generateMdxLlmOnlyRaw:', error);
    throw error;
  }
}

// Generate MDX content from a URL
export async function generateMdxFromUrl(url: string, selectedTopic: string, mainTopic: string, topic?: string, useLlmKnowledge?: boolean) {
  const res = await api.rag["generate-mdx-from-url"].$post({
    json: { url, selected_topic: selectedTopic, main_topic: mainTopic, topic, use_llm_knowledge: useLlmKnowledge }
  });
  if (!res.ok) {
    throw new Error("Failed to generate MDX from URL");
  }
  const data = await res.json();
  return data;
}

// Generate raw MDX content from a URL
export async function generateMdxFromUrlRaw(url: string, selectedTopic: string, mainTopic: string, topic?: string, useLlmKnowledge?: boolean) {
  const res = await api.rag["generate-mdx-from-url-raw"].$post({
    json: { url, selected_topic: selectedTopic, main_topic: mainTopic, topic, use_llm_knowledge: useLlmKnowledge }
  });
  if (!res.ok) {
    throw new Error("Failed to generate raw MDX from URL");
  }
  const text = await res.text();
  return text;
}

// Generate MDX content from multiple URLs
export async function generateMdxFromUrls(urls: string[], selectedTopic: string, mainTopic: string, topic?: string, useLlmKnowledge?: boolean) {
  const res = await api.rag["generate-mdx-from-urls"].$post({
    json: { urls, selected_topic: selectedTopic, main_topic: mainTopic, topic, use_llm_knowledge: useLlmKnowledge }
  });
  if (!res.ok) {
    throw new Error("Failed to generate MDX from URLs");
  }
  const data = await res.json();
  return data;
}

// Generate raw MDX content from multiple URLs
export async function generateMdxFromUrlsRaw(urls: string[], selectedTopic: string, mainTopic: string, topic?: string, useLlmKnowledge?: boolean) {
  try {
    console.log('API call params (URLs):', {
      urls,
      selected_topic: selectedTopic,
      main_topic: mainTopic,
      topic,
      use_llm_knowledge: useLlmKnowledge
    });

    const res = await api.rag["generate-mdx-from-urls-raw"].$post({
      json: { urls, selected_topic: selectedTopic, main_topic: mainTopic, topic, use_llm_knowledge: useLlmKnowledge }
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'No error text available');
      console.error('Server error response (URLs):', errorText);
      throw new Error(`Failed to generate raw MDX from URLs: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    return text;
  } catch (error) {
    console.error('Error in generateMdxFromUrlsRaw:', error);
    throw error;
  }
}

// Refine content
export async function refineContent(mdx: string, question: string) {
  const res = await api.rag.refine.$post({
    json: { mdx, question }
  });
  if (!res.ok) {
    throw new Error("Failed to refine content");
  }
  const data = await res.json();
  return data;
}

// Refine content with selection
export async function refineWithSelection(mdx: string, question: string, selectedText: string, topic: string) {
  const res = await api.rag["refine-with-selection"].$post({
    json: { mdx, question, selected_text: selectedText, topic }
  });
  if (!res.ok) {
    throw new Error("Failed to refine content with selection");
  }
  const data = await res.json();
  return data;
}

// Refine content with crawling
export async function refineWithCrawling(
  mdx: string,
  question: string,
  selectedText: string,
  topic: string,
  numResults?: number
) {
  const res = await api.rag["refine-with-crawling"].$post({
    json: { mdx, question, selected_text: selectedText, topic, num_results: numResults }
  });
  if (!res.ok) {
    throw new Error("Failed to refine content with crawling");
  }
  const data = await res.json();
  return data;
}

// Refine content with URLs
export async function refineWithUrls(
  mdx: string,
  question: string,
  selectedText: string,
  topic: string,
  urls: string[]
) {
  const res = await api.rag["refine-with-urls"].$post({
    json: { mdx, question, selected_text: selectedText, topic, urls }
  });
  if (!res.ok) {
    throw new Error("Failed to refine content with URLs");
  }
  const data = await res.json();
  return data;
}

// React Query options
export const searchTopicsQueryOptions = queryOptions({
  queryKey: ["search-topics", "", undefined] as [string, string, number | undefined],
  queryFn: ({ queryKey }) => searchTopics(queryKey[1], queryKey[2]),
  enabled: false, // Only run when explicitly called
});

