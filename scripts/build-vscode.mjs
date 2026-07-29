import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const localDirectory = path.join(projectDirectory, '.local');
const requiredFiles = {
	PAGES_JSON: 'PAGES_JSON.json',
	AGENCY_JSON: 'AGENCY_JSON.json',
	TAGS_JSON: 'TAGS_JSON.json',
};

for (const [name, fileName] of Object.entries(requiredFiles)) {
	const filePath = path.join(localDirectory, fileName);

	try {
		process.env[name] = await readFile(filePath, 'utf8');
	} catch (error) {
		if (error?.code === 'ENOENT') {
			throw new Error(
				`Local configuration file not found: .local/${fileName}`
			);
		}
		throw error;
	}
}

delete process.env.LIVES_JSON_ROOT;

await import('./build.mjs');
