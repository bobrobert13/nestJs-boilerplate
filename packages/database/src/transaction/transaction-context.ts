import { ClientSession } from 'mongoose';

/**
 * Represents the current transactional context,
 * carrying the active MongoDB session and its state.
 */
export interface TransactionContext {
  /** The active MongoDB client session */
  session: ClientSession;
  /** Whether the transaction is currently active */
  isActive: boolean;
}

/** Symbol used as the injection token for the current transaction context. */
export const TRANSACTION_CONTEXT = Symbol('TRANSACTION_CONTEXT');