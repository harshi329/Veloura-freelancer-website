import { connectDB, disconnectDB } from './connect.js';
import {
  User,
  Project,
  Proposal,
  Contract,
  Review,
  Message,
  Notification,
  Report,
} from '../models/index.js';

export async function runMigrations(): Promise<void> {
  await connectDB();
  console.log('[Veloura DB] Synchronizing MongoDB collection schemas & indexes...');

  await Promise.all([
    User.syncIndexes(),
    Project.syncIndexes(),
    Proposal.syncIndexes(),
    Contract.syncIndexes(),
    Review.syncIndexes(),
    Message.syncIndexes(),
    Notification.syncIndexes(),
    Report.syncIndexes(),
  ]);

  console.log('[Veloura DB] All collection indexes verified and synchronized.');
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('migrate.ts') || process.argv[1].endsWith('migrate.js'));

if (isMain) {
  runMigrations()
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Veloura DB] Migration error:', err);
      process.exit(1);
    });
}
