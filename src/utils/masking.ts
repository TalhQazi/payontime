/**
 * Privacy and PII Masking Utilities
 * Protects SSN, Tax ID, Phone, Email, and Customer Names
 */

export function maskTaxId(taxId?: string): string {
  if (!taxId) return '';
  const cleaned = taxId.replace(/[^0-9]/g, '');
  if (cleaned.length < 4) return '***';
  return `***-**-${cleaned.slice(-4)}`;
}

export function maskPhone(phone?: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length < 4) return '***-***-****';
  return `(***) ***-${cleaned.slice(-4)}`;
}

export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export function maskName(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return `${parts[0][0]}***`;
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${first[0]}*** ${lastInitial}.`;
}

export function redactSensitiveObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const sensitiveKeys = [
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'mfaSecret',
    'secret',
    'ssn',
    'taxId',
    'authorization',
  ];

  const result: any = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      result[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      result[key] = redactSensitiveObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
