import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

const localEnv = parseEnv(readFileSync('.env.local', 'utf8'));
const databaseUrl = localEnv.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing from .env.local');
}

const databaseHost = new URL(databaseUrl).hostname;
if (databaseHost !== '127.0.0.1' && databaseHost !== 'localhost') {
    throw new Error(`Refusing local migration against non-local host: ${databaseHost}`);
}

const migrationCli = resolve('node_modules/node-pg-migrate/bin/node-pg-migrate.js');
const result = spawnSync(process.execPath, [migrationCli, ...process.argv.slice(2)], {
    env: { ...process.env, ...localEnv },
    stdio: 'inherit',
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;