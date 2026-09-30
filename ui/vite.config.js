import { sveltekit } from "@sveltejs/kit/vite";

export default {
  plugins: [sveltekit()],
  server: { host: "0.0.0.0", port: 5173 },
  preview: { host: "0.0.0.0", port: 4173 }
};
