import { sveltekit } from "@sveltejs/kit/vite";

export default {
  plugins: [sveltekit()],
  server: { host: process.env.HOST || "127.0.0.1", port: 5173 },
  preview: { host: process.env.HOST || "127.0.0.1", port: 4173 }
};
