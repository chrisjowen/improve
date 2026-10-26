<script>
  /** Lucide icon paths (ISC licence), inlined so the UI needs no icon package. */
  const PATHS = {
    home: ["M3 10.5 12 3l9 7.5", "M5 9.5V20h14V9.5", "M10 20v-6h4v6"],
    inbox: ["M22 12h-6l-2 3h-4l-2-3H2", "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"],
    moon: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
    sun: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 2v2", "M12 20v2", "m4.93 4.93 1.41 1.41", "m17.66 17.66 1.41 1.41", "M2 12h2", "M20 12h2", "m6.34 17.66-1.41 1.41", "m19.07 4.93-1.41 1.41"],
    gauge: ["m12 14 4-4", "M3.34 19a10 10 0 1 1 17.32 0"],
    target: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"],
    activity: ["M22 12h-4l-3 9L9 3l-3 9H2"],
    sparkles: ["M9.94 14.06 4 20", "M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"],
    check: ["M20 6 9 17l-5-5"],
    x: ["M18 6 6 18", "M6 6l12 12"],
    alert: ["M12 9v4", "M12 17h.01", "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"],
    info: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 16v-4", "M12 8h.01"],
    play: ["M6 3l14 9-14 9V3z"],
    square: ["M5 5h14v14H5z"],
    refresh: ["M21 12a9 9 0 0 1-15.5 6.2L3 16", "M3 12a9 9 0 0 1 15.5-6.2L21 8", "M21 3v5h-5", "M3 21v-5h5"],
    file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"],
    chevron: ["m9 18 6-6-6-6"],
    arrowLeft: ["M19 12H5", "m12 19-7-7 7-7"],
    terminal: ["m4 17 6-6-6-6", "M12 19h8"],
    clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 6v6l4 2"]
  };
  /** @type {{ name: keyof typeof PATHS, size?: number, label?: string }} */
  let { name, size = 16, label } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : "true"}
     role={label ? "img" : undefined} aria-label={label} style="flex:none">
  {#each PATHS[name] ?? [] as d}<path {d} />{/each}
</svg>
