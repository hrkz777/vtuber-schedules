import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const templatePath = path.join(
	projectDirectory,
	'templates',
	'index.html.tpl'
);
const topTemplatePath = path.join(
	projectDirectory,
	'templates',
	'top.html.tpl'
);
const outputDirectory = path.join(projectDirectory, 'html');

const siteConfig = parseSiteConfig(process.env.PAGES_JSON);
const pages = siteConfig.pages;
const supportedLanguages = ['ja', 'en'];
const groupLocalizations = {
	agency: parseLocalizations(
		process.env.AGENCY_JSON,
		'AGENCY_JSON'
	),
	tags: parseLocalizations(
		process.env.TAGS_JSON,
		'TAGS_JSON'
	),
};

/*
 * 環境変数から取得する
 *
 * LIVES_JSON_ROOT="xxxx.xxx"
 * apiPath="/lives.json"
 * 結果="xxxx.xxx/lives.json"
 */
const apiBaseUrl = normalizeApiBaseUrl(
	process.env.LIVES_JSON_ROOT || ''
);

function parseSiteConfig(value)
{
	const source = requireString(value, 'PAGES_JSON');
	let config;

	try {
		config = JSON.parse(source);
	} catch (error) {
		throw new Error('PAGES_JSON must be valid JSON', {
			cause: error,
		});
	}

	if (!Array.isArray(config.pages) || config.pages.length === 0)
		throw new Error('PAGES_JSON.pages must be a non-empty array');

	if (
		typeof config.index !== 'object'
		|| config.index === null
		|| Array.isArray(config.index)
	) {
		throw new Error('PAGES_JSON.index must be an object');
	}

	return {
		index: {
			title: requireString(
				config.index.title,
				'PAGES_JSON.index.title'
			),
			heading: requireString(
				config.index.heading,
				'PAGES_JSON.index.heading'
			),
		},
		pages: config.pages,
	};
}

function parseLocalizations(value, name)
{
	const source = requireString(value, name);
	let entries;

	try {
		entries = JSON.parse(source);
	} catch (error) {
		throw new Error(`${name} must be valid JSON`, {
			cause: error,
		});
	}

	if (
		typeof entries !== 'object'
		|| entries === null
		|| Array.isArray(entries)
		|| Object.keys(entries).length === 0
	) {
		throw new Error(`${name} must be a non-empty object`);
	}

	for (const [key, translations] of Object.entries(entries)) {
		requireString(key, `${name} key`);

		if (
			typeof translations !== 'object'
			|| translations === null
			|| Array.isArray(translations)
		) {
			throw new Error(
				`${name}.${key} must be an object`
			);
		}

		for (const language of supportedLanguages) {
			requireString(
				translations[language],
				`${name}.${key}.${language}`
			);
		}
	}

	return entries;
}

function normalizeApiBaseUrl(value)
{
	const normalized = String(value).trim();
	if (normalized === '')
		return '';
	return normalized.replace(/\/+$/, '');
}

function normalizeApiPath(value)
{
	const normalized = requireString(value, 'apiPath');
	if (/^https?:\/\//i.test(normalized)) {
		throw new Error(`apiPath must not contain an absolute URL: ${normalized}`);
	}
	return normalized.startsWith('/')
		? normalized
		: `/${normalized}`;
}

function createApiUrl(baseUrl, apiPath, relativeBasePath)
{
	const normalizedPath = normalizeApiPath(apiPath);

	if (baseUrl !== '')
		return `${baseUrl}${normalizedPath}`;

	return `${relativeBasePath}${normalizedPath.replace(/^\/+/, '')}`;
}

function createRelativeBasePath(outputPath)
{
	const relativePath = path.relative(
		path.dirname(outputPath),
		outputDirectory
	).replaceAll(path.sep, '/');

	return relativePath === ''
		? './'
		: `${relativePath}/`;
}

function requireString(value, name)
{
	if (typeof value !== 'string' || value.trim() === '')
		throw new Error(`${name} must be a non-empty string`);

	return value.trim();
}

function validateRoute(route)
{
	const normalized = requireString(route, 'route');

	if (!/^[a-z0-9_-]+$/.test(normalized))
		throw new Error(`Invalid route: ${normalized}`);

	return normalized;
}

function escapeHtml(value)
{
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

function renderTemplate(template, replacements)
{
	let output = template;

	for (const [name, value] of Object.entries(replacements))
		output = output.replaceAll(`{{${name}}}`, value);

	const unresolved = output.match(/{{[A-Z0-9_]+}}/g);

	if (unresolved) {
		throw new Error(
			`Unresolved placeholders: ${[
				...new Set(unresolved),
			].join(', ')}`
		);
	}

	return output;
}

async function generateLocalizationFiles()
{
	for (const language of supportedLanguages) {
		const languageDirectory = path.join(
			outputDirectory,
			'groups',
			language
		);

		await mkdir(languageDirectory, {
			recursive: true,
		});

		for (const [name, entries] of Object.entries(
			groupLocalizations
		)) {
			const localizedEntries = Object.fromEntries(
				Object.entries(entries).map(([key, translations]) =>
					[key, translations[language]]
				)
			);
			const outputPath = path.join(
				languageDirectory,
				`${name}.json`
			);

			await writeFile(
				outputPath,
				`${JSON.stringify(localizedEntries, null, '\t')}\n`,
				'utf8'
			);

			console.log(
				`Generated: html/groups/${language}/${name}.json`
			);
		}
	}
}

async function generatePages()
{
	const template = await readFile(templatePath, 'utf8');

	console.log(
		`API base URL: ${apiBaseUrl || '(current origin)'}`
	);

	for (const page of pages) {
		const route = validateRoute(page.route);
		const title = requireString(page.title, 'title');
		const heading = requireString(page.heading, 'heading');
		const agency = requireString(page.agency, 'agency');

		const outputPath = path.join(outputDirectory, route, 'index.html');
		const relativeBasePath = createRelativeBasePath(outputPath);
		const apiUrl = createApiUrl(
			apiBaseUrl,
			page.apiRoute,
			relativeBasePath
		);

		const html = renderTemplate(template, {
			TITLE: escapeHtml(title),
			HEADING: escapeHtml(heading),
			RELATIVE_BASE_PATH: escapeHtml(relativeBasePath),
			TITLE_JSON: JSON.stringify(title),
			HEADING_JSON: JSON.stringify(heading),
			AGENCY_JSON: JSON.stringify(agency),
			API_URL_JSON: JSON.stringify(apiUrl),
			RELATIVE_BASE_PATH_JSON: JSON.stringify(
				relativeBasePath
			),
		});

		await mkdir(path.dirname(outputPath), {
			recursive: true,
		});

		await writeFile(outputPath, html, 'utf8');

		console.log(
			`Generated: html/${route}/index.html`
		);
		console.log(
			`API URL: ${apiUrl}`
		);
	}
}

async function generateTopPage()
{
	const template = await readFile(topTemplatePath, 'utf8');
	const links = pages.map(page => {
		const route = validateRoute(page.route);
		const heading = requireString(page.heading, 'heading');

		return [
			'\t\t\t<li class="page-index-item">',
			`\t\t\t\t<a href="./${escapeHtml(route)}/">${escapeHtml(heading)}</a>`,
			'\t\t\t</li>',
		].join('\n');
	}).join('\n');
	const html = renderTemplate(template, {
		TITLE: escapeHtml(siteConfig.index.title),
		HEADING: escapeHtml(siteConfig.index.heading),
		PAGE_LINKS: links,
	});
	const outputPath = path.join(outputDirectory, 'index.html');

	await writeFile(outputPath, html, 'utf8');

	console.log('Generated: html/index.html');
}

async function build()
{
	await generateLocalizationFiles();
	await generateTopPage();
	await generatePages();
}

build().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
