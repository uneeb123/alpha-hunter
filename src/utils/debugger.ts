export type DebugLevel = 'info' | 'verbose' | 'error';
export type DebugConfig = {
  enabled: boolean;
  level: DebugLevel;
};

let debuggerInstance: Debugger | null = null;

export class Debugger {
  private config: DebugConfig;

  private constructor(config?: DebugConfig) {
    this.config = {
      enabled: config?.enabled ?? true,
      level: config?.level ?? 'info',
    };
  }

  static create(config?: DebugConfig): Debugger {
    if (!debuggerInstance) {
      debuggerInstance = new Debugger(config);
    }
    return debuggerInstance;
  }

  static getInstance(): Debugger {
    if (!debuggerInstance) {
      // Default configuration if not initialized
      return this.create({
        enabled: process.env.NODE_ENV
          ? process.env.NODE_ENV === 'development'
          : true,
        level: 'info',
      });
    }
    return debuggerInstance;
  }

  private logMessage(
    level: DebugLevel,
    ...messages: (string | number | boolean | object | null | undefined)[]
  ): void {
    if (!this.config.enabled && level !== 'error') return;
    if (level === 'verbose' && this.config.level !== 'verbose') return;

    const color =
      level === 'verbose'
        ? '\x1b[36m' // cyan for verbose
        : level === 'error'
          ? '\x1b[31m' // red for error
          : '\x1b[35m'; // magenta for info

    console.log(
      `${color}[DEBUG:${level.toUpperCase()}]`,
      ...messages,
      '\x1b[0m',
    );
  }

  info(
    ...messages: (string | number | boolean | object | null | undefined)[]
  ): void {
    this.logMessage('info', ...messages);
  }

  verbose(
    ...messages: (string | number | boolean | object | null | undefined)[]
  ): void {
    this.logMessage('verbose', ...messages);
  }

  error(
    ...messages: (string | number | boolean | object | null | undefined)[]
  ): void {
    this.logMessage('error', ...messages);
  }
}
