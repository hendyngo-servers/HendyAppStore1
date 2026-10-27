#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase())
    .replace(/[\s-_]+/g, '');
}

const args = process.argv.slice(2);
const nameArg = args.find((a) => a.startsWith('--name='));
const workerArg = args.find((a) => a.startsWith('--worker=')) || '--worker=platform-api';

if (!nameArg) {
  console.log('Usage: npx tsx scripts/scaffold/generate-module.ts --name=<module-name> [--worker=<target>]');
  process.exit(1);
}

const moduleName = nameArg.replace('--name=', '').trim();
const worker = workerArg.replace('--worker=', '').trim();
const pascalName = toPascalCase(moduleName);

console.log(`[Scaffold] Generating new module "${moduleName}" for worker "${worker}"...`);

const targetDir = path.resolve(process.cwd(), `workers/${worker}/src/routes`);
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const targetFile = path.join(targetDir, `${moduleName}.ts`);
const content = `import { DatabaseService } from '../services/database';

export async function handle${pascalName}(request: Request, env?: any): Promise<Response> {
  const db = DatabaseService.getInstance(env?.DB);
  return new Response(JSON.stringify({ module: '${moduleName}', status: 'operational' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
`;

fs.writeFileSync(targetFile, content);
console.log(`[Scaffold] Created: ${targetFile}`);
