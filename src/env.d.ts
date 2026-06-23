/// <reference types="astro/client" />

interface ModelContextTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: object) => Promise<unknown>;
}

interface ModelContext {
  registerTool(
    tool: ModelContextTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] }
  ): Promise<void>;
  provideContext?(context: { tools: ModelContextTool[] }): Promise<void>;
  ontoolchange?: ((event: Event) => void) | null;
}

interface Document {
  readonly modelContext: ModelContext;
}

interface Navigator {
  readonly modelContext: ModelContext;
}
