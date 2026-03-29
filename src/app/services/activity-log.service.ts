import { Injectable } from '@angular/core';
import {
  ActivityLogEntry,
  ActivityLogOptions,
  ActivityLogSource
} from '../models/activity-log.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private readonly logEndpoint = 'http://localhost:8091/internal/activity-logs';
  private readonly sessionKey = 'task-tracker.activity-log.session-id';
  private readonly maxStringLength = 160;
  private readonly maxArrayLength = 10;

  constructor() {
    this.ensureSessionId();
  }

  log(source: ActivityLogSource, action: string, options: ActivityLogOptions = {}): void {
    const date = this.getLocalDateStamp();
    const entry: ActivityLogEntry = {
      id: this.createEntryId(),
      timestamp: new Date().toISOString(),
      date,
      sessionId: this.getSessionId(),
      actor: this.resolveActor(options.actor),
      role: localStorage.getItem('role'),
      source,
      action,
      level: options.level ?? 'info',
      status: options.status ?? 'info',
      details: this.sanitizeDetails(options.details)
    };

    this.writeEntry(entry);
  }

  private sanitizeDetails(details: unknown): Record<string, unknown> | undefined {
    if (details === undefined || details === null) {
      return undefined;
    }

    const sanitized = this.sanitizeValue(details);
    if (sanitized && typeof sanitized === 'object' && !Array.isArray(sanitized)) {
      return sanitized as Record<string, unknown>;
    }

    return { value: sanitized };
  }

  private sanitizeValue(value: unknown, key = '', depth = 0): unknown {
    if (depth > 4) {
      return '[TRUNCATED]';
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      const items = value
        .slice(0, this.maxArrayLength)
        .map((item) => this.sanitizeValue(item, key, depth + 1));

      if (value.length > this.maxArrayLength) {
        items.push(`[${value.length - this.maxArrayLength} more items]`);
      }

      return items;
    }

    switch (typeof value) {
      case 'string':
        return this.sanitizeString(key, value);
      case 'number':
      case 'boolean':
        return value;
      case 'object': {
        const output: Record<string, unknown> = {};

        for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
          output[childKey] = this.sanitizeValue(childValue, childKey, depth + 1);
        }

        return output;
      }
      default:
        return this.limitString(String(value), this.maxStringLength);
    }
  }

  private sanitizeString(key: string, value: string): string {
    const normalized = value.trim();

    if (!normalized) {
      return normalized;
    }

    if (this.isSensitiveKey(key)) {
      return '[REDACTED]';
    }

    if (this.isEmailKey(key)) {
      return this.maskEmail(normalized);
    }

    if (this.isContentKey(key)) {
      return `[OMITTED:${normalized.length} chars]`;
    }

    if (this.isUrlKey(key)) {
      return this.sanitizeUrl(normalized);
    }

    return this.limitString(normalized, this.maxStringLength);
  }

  private sanitizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url, window.location.origin);
      const params: string[] = [];

      parsedUrl.searchParams.forEach((value, key) => {
        const safeValue = this.isSensitiveKey(key)
          ? '[REDACTED]'
          : this.limitString(value, 40);
        params.push(`${key}=${safeValue}`);
      });

      return params.length > 0
        ? `${parsedUrl.pathname}?${params.join('&')}`
        : parsedUrl.pathname;
    } catch {
      return this.limitString(url, this.maxStringLength);
    }
  }

  private resolveActor(actor: string | null | undefined): string {
    if (actor && actor.trim()) {
      return this.maskEmail(actor.trim());
    }

    const currentEmail = localStorage.getItem('email');
    return currentEmail ? this.maskEmail(currentEmail) : 'anonymous';
  }

  private maskEmail(value: string): string {
    const [localPart, domain] = value.split('@');

    if (!domain || localPart.length < 2) {
      return this.limitString(value, this.maxStringLength);
    }

    return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
  }

  private isSensitiveKey(key: string): boolean {
    return /(password|token|authorization|secret|cookie|session)/i.test(key);
  }

  private isEmailKey(key: string): boolean {
    return /email/i.test(key);
  }

  private isContentKey(key: string): boolean {
    return /(title|description|name|note|comment)/i.test(key);
  }

  private isUrlKey(key: string): boolean {
    return /(url|path)/i.test(key);
  }

  private limitString(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength - 3)}...`;
  }

  private ensureSessionId(): void {
    if (!sessionStorage.getItem(this.sessionKey)) {
      sessionStorage.setItem(this.sessionKey, this.createEntryId());
    }
  }

  private getSessionId(): string {
    this.ensureSessionId();
    return sessionStorage.getItem(this.sessionKey) ?? 'unknown-session';
  }

  private getLocalDateStamp(date = new Date()): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private createEntryId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private writeEntry(entry: ActivityLogEntry): void {
    const payload = JSON.stringify(entry);

    try {
      if (navigator.sendBeacon) {
        const queued = navigator.sendBeacon(
          this.logEndpoint,
          new Blob([payload], { type: 'application/json' })
        );

        if (queued) {
          return;
        }
      }
    } catch {
      // Fall back to fetch below.
    }

    void fetch(this.logEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      credentials: 'omit',
      keepalive: true,
      mode: 'cors'
    }).catch(() => undefined);
  }
}
