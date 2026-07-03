// MCP tools run inside a Deno edge function at runtime; this declaration keeps
// TypeScript happy in the Vite/browser tsconfig without pulling in @types/node.
declare const process: { env: Record<string, string | undefined> };
