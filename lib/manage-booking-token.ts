import { randomBytes } from 'crypto';

/** 64-char hex token (32 random bytes). */
export function generateManageToken(): string {
  return randomBytes(32).toString('hex');
}

export const MANAGE_TOKEN_HEX_LENGTH = 64;

export function isValidManageTokenFormat(token: string | null | undefined): boolean {
  return typeof token === 'string' && /^[a-f0-9]{64}$/i.test(token.trim());
}
