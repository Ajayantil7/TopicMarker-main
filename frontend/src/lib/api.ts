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

export async function queryRag(query: string) {
  const res = await api.rag.$get({ query: { query } });
  if (!res.ok) {
    throw new Error("server error");
  }
  const data = await res.json();
  return data;
}

export const ragQueryOptions = queryOptions({
  queryKey: ["rag-query"],
  queryFn: ({ queryKey }) => queryRag(queryKey[1] as string),
  enabled: false, // Only run when explicitly called
});

