import mongoose from 'mongoose'

/**
 * Runs `work` in one MongoDB transaction. With `transactionAsyncLocalStorage` enabled, every
 * query inside `work` joins the session automatically, so repositories need no session argument.
 * Mongoose retries `work` on transient errors, so it must not have side effects outside the
 * database (send emails or delete remote files after this resolves). Run queries sequentially:
 * one session must not execute operations in parallel.
 */
export const withTransaction = <T>(work: () => Promise<T>): Promise<T> => mongoose.connection.transaction(work)
