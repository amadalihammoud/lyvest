/**
 * Sistema de Logger Condicional
 * 
 * Substitui console.log direto por logger que:
 * - Só funciona em desenvolvimento
 * - Adiciona contexto e timestamp
 * - Pode ser facilmente desabilitado
 */

const isDevelopment = process.env.NODE_ENV === 'development';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LoggerOptions {
    prefix?: string;
    enabled?: boolean;
}

class Logger {
    private prefix: string;
    private enabled: boolean;

    constructor(options: LoggerOptions = {}) {
        this.prefix = options.prefix || '';
        this.enabled = options.enabled !== undefined ? options.enabled : isDevelopment;
    }

    private formatMessage(level: LogLevel, ...args: any[]): any[] {
        if (!this.enabled) return [];

        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = this.prefix ? `[${this.prefix}]` : '';
        const levelTag = `[${level.toUpperCase()}]`;

        return [`${timestamp} ${levelTag}${prefix}`, ...args];
    }

    info(...args: any[]): void {
        if (!this.enabled) return;
        console.log(...this.formatMessage('info', ...args));
    }

    warn(...args: any[]): void {
        if (!this.enabled) return;
        console.warn(...this.formatMessage('warn', ...args));
    }

    error(...args: any[]): void {
        if (!this.enabled) return;
        console.error(...this.formatMessage('error', ...args));
    }

    debug(...args: any[]): void {
        if (!this.enabled) return;
        console.debug(...this.formatMessage('debug', ...args));
    }

    group(label: string): void {
        if (!this.enabled) return;
        console.group(label);
    }

    groupEnd(): void {
        if (!this.enabled) return;
        console.groupEnd();
    }
}

// Exportar instâncias pré-configuradas para diferentes módulos
export const analyticsLogger = new Logger({ prefix: 'Analytics' });
export const paymentLogger = new Logger({ prefix: 'Payment' });
export const shippingLogger = new Logger({ prefix: 'Shipping' });
export const webVitalsLogger = new Logger({ prefix: 'Web Vitals' });

// Logger genérico
export const logger = new Logger();

// Factory para criar loggers customizados
export const createLogger = (prefix: string, enabled?: boolean): Logger => {
    return new Logger({ prefix, enabled });
};

export default logger;
