interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface D1Database {
  readonly __plannerDatabaseBrand?: never;
}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
  };
}
