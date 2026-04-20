/**
 * Minimal typings for Supabase Edge Functions (Deno runtime).
 * The app tsconfig excludes this folder; this file + tsconfig.json give the IDE a correct project.
 */
type DenoServeHandler = (req: Request) => Response | Promise<Response>;

declare const Deno: {
  serve(handler: DenoServeHandler): void;
  env: {
    get(key: string): string | undefined;
  };
};
