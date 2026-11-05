import "server-only";

type Row = Record<string, unknown>;
type Query = (text: string, params?: unknown[]) => Promise<Row[]>;

const SCHEMA = `
create table if not exists shops (
  id text primary key,
  slug text unique not null,
  name text not null,
  tagline text not null default '',
  about text not null default '',
  city text not null default '',
  country text not null default '',
  currency text not null default 'USD',
  source_url text,
  payee_email text,
  owner_key text not null,
  ships_to text not null default 'Local pickup and delivery',
  accent text not null default '#c2410c',
  is_demo boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists products (
  id text primary key,
  shop_id text not null references shops(id) on delete cascade,
  name text not null,
  description text not null default '',
  price_cents integer not null,
  currency text not null,
  category text not null default '',
  tags text[] not null default '{}',
  image_url text,
  stock integer,
  paypal_product_id text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists products_shop on products(shop_id);
create table if not exists orders (
  id text primary key,
  shop_id text not null references shops(id) on delete cascade,
  paypal_order_id text unique,
  status text not null,
  channel text not null,
  agent_name text,
  items jsonb not null,
  total_cents integer not null,
  currency text not null,
  note text,
  buyer_name text,
  buyer_email text,
  capture_id text,
  tracking jsonb,
  refund_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_shop on orders(shop_id);
create table if not exists events (
  id bigserial primary key,
  shop_id text not null references shops(id) on delete cascade,
  kind text not null,
  actor text not null default 'agent',
  summary text not null,
  data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_shop on events(shop_id, id desc);
`;


async function connect(): Promise<Query> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  let q: Query;
  if (url) {
    const { Pool } = await import("@neondatabase/serverless");
    const pool = new Pool({ connectionString: url });
    q = async (text, params = []) => (await pool.query(text, params)).rows as Row[];
    for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) await q(stmt);
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const g = globalThis as unknown as { __shelfPg?: InstanceType<typeof PGlite> };
    const dir = process.env.PGLITE_DIR || "./.data/pg";
    if (!dir.includes("://")) (await import("node:fs")).mkdirSync(dir, { recursive: true });
    g.__shelfPg ??= new PGlite(dir);
    const pg = g.__shelfPg;
    await pg.exec(SCHEMA);
    q = async (text, params = []) => (await pg.query(text, params)).rows as Row[];
  }
  const { seedDemo } = await import("./seed");
  await seedDemo(q);
  return q;
}

export async function sql<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const g = globalThis as unknown as { __shelfDb?: Promise<Query> };
  g.__shelfDb ??= connect().catch((e) => {
    g.__shelfDb = undefined;
    throw e;
  });
  const q = await g.__shelfDb;
  return (await q(text, params)) as T[];
}

export async function one<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await sql<T>(text, params);
  return rows[0] ?? null;
}
