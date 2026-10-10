import { Pool, type QueryResult, type QueryResultRow } from 'pg';

export type { QueryResult, QueryResultRow } from 'pg';

declare global {
    var postgresPool: Pool | undefined;
}

function getPool(): Pool {
    if (!globalThis.postgresPool) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL is not configured');
        }
        globalThis.postgresPool = new Pool({ connectionString });
    }
    return globalThis.postgresPool;
}

type Sql = {
    <Row extends QueryResultRow = QueryResultRow>(strings: TemplateStringsArray, ...values: unknown[]): Promise<QueryResult<Row>>;
    query<Row extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<Row>>;
};

export const sql: Sql = Object.assign(
    <Row extends QueryResultRow = QueryResultRow>(strings: TemplateStringsArray, ...values: unknown[]) => {
        const text = strings.reduce(
            (query, part, index) => query + part + (index < values.length ? `$${index + 1}` : ''),
            '',
        );
        return getPool().query<Row>(text, values);
    },
    {
        query: <Row extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) =>
            getPool().query<Row>(text, values),
    },
);