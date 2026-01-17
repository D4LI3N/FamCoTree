<script>
	import '../app.css';
</script>

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
