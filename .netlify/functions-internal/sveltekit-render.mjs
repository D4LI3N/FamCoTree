import { init } from '../serverless.js';

export const handler = init((() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["apple-touch-icon.png","Avatar.webp","favicon-96x96.png","favicon.ico","favicon.png","favicon.svg","favicon_org.svg","robots.txt","site.webmanifest","sitemap.xml","web-app-manifest-192x192.png","web-app-manifest-512x512.png"]),
	mimeTypes: {".png":"image/png",".webp":"image/webp",".svg":"image/svg+xml",".txt":"text/plain",".webmanifest":"application/manifest+json",".xml":"text/xml"},
	_: {
		client: {"start":"_app/immutable/entry/start.um8ir9K8.js","app":"_app/immutable/entry/app.DdWFmsbb.js","imports":["_app/immutable/entry/start.um8ir9K8.js","_app/immutable/chunks/entry.cjXRYna0.js","_app/immutable/chunks/scheduler.bEsX_Fvh.js","_app/immutable/chunks/index.DgNgicwf.js","_app/immutable/entry/app.DdWFmsbb.js","_app/immutable/chunks/scheduler.bEsX_Fvh.js","_app/immutable/chunks/index.D1rNCsTi.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('../server/nodes/0.js')),
			__memo(() => import('../server/nodes/1.js')),
			__memo(() => import('../server/nodes/2.js')),
			__memo(() => import('../server/nodes/3.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/main",
				pattern: /^\/main\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})());
