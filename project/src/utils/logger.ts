/**
 * Production-ready logging utility
 * Automatically disables console.log in production while preserving error logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
    enableDebug: boolean;
    enableInfo: boolean;
    enableWarn: boolean;
    enableError: boolean;
    prefix?: string;
}

class Logger {
    private config: LoggerConfig;

    constructor(config?: Partial<LoggerConfig>) {
        const isProd = import.meta.env.PROD;

        this.config = {
            enableDebug: !isProd,  // Only in development
            enableInfo: !isProd,   // Only in development
            enableWarn: true,      // Always enabled
            enableError: true,     // Always enabled
            prefix: config?.prefix || '[BlockMusic]',
            ...config,
        };
    }

    /**
     * Debug logging - only in development
     */
    debug(...args: any[]) {
        if (this.config.enableDebug) {
            console.log(`${this.config.prefix} 🔍`, ...args);
        }
    }

    /**
     * Info logging - only in development
     */
    info(...args: any[]) {
        if (this.config.enableInfo) {
            console.log(`${this.config.prefix} ℹ️`, ...args);
        }
    }

    /**
     * Warning logging - always enabled
     */
    warn(...args: any[]) {
        if (this.config.enableWarn) {
            console.warn(`${this.config.prefix} ⚠️`, ...args);
        }
    }

    /**
     * Error logging - always enabled
     */
    error(...args: any[]) {
        if (this.config.enableError) {
            console.error(`${this.config.prefix} ❌`, ...args);
        }
    }

    /**
     * Success logging - only in development
     */
    success(...args: any[]) {
        if (this.config.enableInfo) {
            console.log(`${this.config.prefix} ✅`, ...args);
        }
    }

    /**
     * Group logging for better organization
     */
    group(label: string, callback: () => void) {
        if (this.config.enableDebug) {
            console.group(`${this.config.prefix} ${label}`);
            callback();
            console.groupEnd();
        }
    }

    /**
     * Table logging for structured data
     */
    table(data: any) {
        if (this.config.enableDebug) {
            console.table(data);
        }
    }

    /**
     * Performance timing
     */
    time(label: string) {
        if (this.config.enableDebug) {
            console.time(`${this.config.prefix} ${label}`);
        }
    }

    timeEnd(label: string) {
        if (this.config.enableDebug) {
            console.timeEnd(`${this.config.prefix} ${label}`);
        }
    }
}

// Create default logger instance
export const logger = new Logger();

// Create specialized loggers for different modules
export const web3Logger = new Logger({ prefix: '[Web3]' });
export const musicLogger = new Logger({ prefix: '[Music]' });
export const ipfsLogger = new Logger({ prefix: '[IPFS]' });
export const subscriptionLogger = new Logger({ prefix: '[Subscription]' });

// Export Logger class for custom instances
export { Logger };

// Export type
export type { LogLevel, LoggerConfig };
