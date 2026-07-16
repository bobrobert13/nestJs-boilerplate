/**
 * Sync MongoDB indexes for every registered Mongoose model.
 *
 * PR2 / CC-2 — invoked manually during deploy and from a CI smoke step.
 * Does NOT run at application boot. Production index policy is documented
 * in `packages/auth/README.md` and `AGENTS.md` §6.
 *
 * Usage:
 *   npx ts-node apps/nominas/scripts/sync-indexes.ts
 *   MONGODB_URI=... npx ts-node apps/nominas/scripts/sync-indexes.ts
 */
import 'reflect-metadata';
import { connect, connection, model } from 'mongoose';
import { RefreshTokenSchema } from '../../packages/auth/src/schemas/refresh-token.schema';

const MODELS: Array<{ name: string; schema: any }> = [
  { name: 'RefreshToken', schema: RefreshTokenSchema },
];

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required to sync indexes.');
  }
  await connect(uri);

  for (const { name, schema } of MODELS) {
    const m = model(name, schema);
    try {
      await m.createIndexes();

      console.log(`[sync-indexes] created indexes for ${name}`);
    } catch (err) {
      console.error(`[sync-indexes] ${name} failed:`, err);
      throw err;
    }
  }

  await connection.close();
}

main().catch((err) => {
  console.error('[sync-indexes] fatal:', err);
  process.exit(1);
});
