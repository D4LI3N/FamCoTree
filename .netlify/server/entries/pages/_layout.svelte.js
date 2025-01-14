import { c as create_ssr_component, e as escape } from "../../chunks/ssr.js";
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${slots.default ? slots.default({}) : ``} <footer class="footer footer-center bg-base-100 py-1 text-base-content"><aside class="my-1 gap-1"><p class="ml-8" data-svelte-h="svelte-v5gj2j">FamCoTree | All rights reserved | <a class="btn-ghost" href="https://danielthecyberdude.com">Daniel Petrovich</a></p> <p><b>Copyright © ${escape((/* @__PURE__ */ new Date()).getFullYear())}</b></p></aside></footer>`;
});
export {
  Layout as default
};
