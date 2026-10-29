import { sveltekit } from "@sveltejs/kit/vite";

/**
 * Vite's own CORS lets any page on a loopback origin read every answer,
 * including the pages that carry this launch's token, and SvelteKit's plugin
 * turns it on, so this plugin, which comes after, turns it off again.
 * hooks.server.js decides which other origin may read, and only with the token.
 * @type {import("vite").Plugin}
 */
const noViteCors = {
  name: "improve-no-vite-cors",
  enforce: "post",
  config: () => ({ server: { cors: false }, preview: { cors: false } })
};

export default {
  plugins: [sveltekit(), noViteCors],
  server: { host: process.env.HOST || "127.0.0.1", port: 5173 },
  preview: { host: process.env.HOST || "127.0.0.1", port: 4173 }
};
