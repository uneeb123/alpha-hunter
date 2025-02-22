import { PrismaClient } from '@prisma/client';
import { Debugger } from './debugger';

export class Database {
  private static instance: Database;
  private debug: Debugger;
  private maxRetries: number = 5;
  private initialDelay: number = 1000; // 1 second
  private maxDelay: number = 300000; // 5 minutes

  private constructor() {
    this.debug = Debugger.getInstance();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.maxRetries,
    currentDelay: number = this.initialDelay,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        retries > 0 &&
        error instanceof Error &&
        error.message.includes("Can't reach database server")
      ) {
        this.debug.error(
          `Database operation failed, retrying... (${retries} attempts left)`,
        );
        // Calculate next delay with exponential backoff, capped at maxDelay
        const nextDelay = Math.min(currentDelay * 2, this.maxDelay);
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        return this.withRetry(operation, retries - 1, nextDelay);
      }
      throw error;
    }
  }

  private createRetryProxy(prisma: PrismaClient): PrismaClient {
    return new Proxy(prisma, {
      get: (target, prop) => {
        const value = target[prop as keyof typeof target];
        if (typeof value === 'object' && value !== null) {
          return new Proxy(value, {
            get: (target2, prop2) => {
              const method = target2[prop2 as keyof typeof target2];
              if (typeof method === 'function') {
                return (...args: unknown[]) =>
                  this.withRetry(() =>
                    (method as (...args: unknown[]) => Promise<unknown>).apply(
                      target2,
                      args,
                    ),
                  );
              }
              return method;
            },
          });
        }
        return value;
      },
    });
  }

  public createClient(
    options: Partial<PrismaClient['$connect']> = {},
  ): PrismaClient {
    const prismaBase = new PrismaClient({
      errorFormat: 'minimal',
      log: ['error', 'warn'],
      ...options,
    });

    return this.createRetryProxy(prismaBase);
  }
}
