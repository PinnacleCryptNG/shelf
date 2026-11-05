import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export function aiProvider(): "anthropic" | "google" | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "google";
  return null;
}

export function model(kind: "smart" | "fast" = "smart"): LanguageModel | null {
  const p = aiProvider();
  if (p === "anthropic") {
    return anthropic(
      kind === "smart"
        ? process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5"
        : process.env.ANTHROPIC_FAST_MODEL || "claude-haiku-4-5",
    );
  }
  if (p === "google") return google(kind === "smart" ? "gemini-pro-latest" : "gemini-flash-latest");
  return null;
}

export function modelLabel() {
  const p = aiProvider();
  if (p === "anthropic") return `Claude (${process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5"})`;
  if (p === "google") return "Gemini";
  return "offline mode";
}
