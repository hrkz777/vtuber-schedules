<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>{{TITLE}}</title>
	<script>
		(() => {
			let theme;
			try {
				theme = localStorage.getItem('theme');
			} catch {
				theme = null;
			}
			if (theme !== 'dark' && theme !== 'light')
				theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
			document.documentElement.classList.toggle('dark', theme === 'dark');
		})();
	</script>
	<link rel="stylesheet" href="./css/style.css">
	<link rel="stylesheet" href="./css/index.css">
</head>
<body class="page-index-body">
	<header class="header-container page-index-header">
		<h1>{{HEADING}}</h1>
	</header>

	<main class="page-index">
		<nav aria-label="{{HEADING}}">
			<ul class="page-index-list">
{{PAGE_LINKS}}
			</ul>
		</nav>
	</main>
</body>
</html>
