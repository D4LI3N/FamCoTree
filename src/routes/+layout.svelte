<script>
	import '../app.css';
	import { pwaInfo } from 'virtual:pwa-info';

	$: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
	{@html webManifestLink}
</svelte:head>

<slot></slot>
<footer class="footer footer-center bg-base-100 py-1 text-base-content">
	<aside class="my-1 gap-1">
		<p class="ml-8">
			FamCoTree | All rights reserved | <a class="btn-ghost" href="https://danielthecyberdude.com"
				>Daniel Petrovich</a
			>
		</p>
		<p><b>Copyright © {new Date().getFullYear()}</b></p>
	</aside>
</footer>
