import { ClientSession } from 'mongoose';

export interface TransactionContext {
  session: ClientSession;
  isActive: boolean;
}

export const TRANSACTION_CONTEXT = Symbol('TRANSACTION_CONTEXT');