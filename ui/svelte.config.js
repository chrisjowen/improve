import adapter from "@sveltejs/adapter-node";

/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: {
    adapter: adapter(),
    // The UI is served from ONA, whose proxy origin is not known at build time.
    csrf: { checkOrigin: false }
  }
};
