import adapter from '@sveltejs/adapter-auto'
import preprocess from "svelte-preprocess"
import tailwind from "tailwindcss"

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter()
  },
  preprocess: [
    preprocess({
      postcss: {
        plugins: [tailwind]
      },
    }),
  ],
};

export default config
