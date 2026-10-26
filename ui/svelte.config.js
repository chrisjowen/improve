import adapter from "@sveltejs/adapter-node";

/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: {
    adapter: adapter(),
    // Off because hooks.server.js enforces the host allowlist and same-origin
    // writes itself, for every /api/* request rather than only form posts.
    csrf: { checkOrigin: false }
  }
};
