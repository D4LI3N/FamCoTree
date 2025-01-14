

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.Bo3zFKTH.js","_app/immutable/chunks/scheduler.bEsX_Fvh.js","_app/immutable/chunks/index.D1rNCsTi.js"];
export const stylesheets = ["_app/immutable/assets/0.CCdmjmFa.css"];
export const fonts = [];
