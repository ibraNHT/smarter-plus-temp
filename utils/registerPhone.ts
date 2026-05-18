/**
 * Canonical E.164-style phone for registration OTP + /auth/register.
 * Keep in sync with OtpService.normalizePhone on the API.
 */
export function normalizeRegisterPhoneFull(raw: string): string {
  let s = String(raw ?? '')
    .trim()
    .replace(/\s+/g, '');
  if (!s) return s;
  const secondPlus = s.indexOf('+', 1);
  if (secondPlus !== -1) {
    s = s.slice(secondPlus);
  }
  if (!s.startsWith('+')) s = `+${s}`;
  if (s.startsWith('+2370') && s.length > 5) {
    s = `+237${s.slice(5)}`;
  }
  return s;
}

export function buildRegisterPhone(phoneCode: string, localPhone: string): string {
  const local = String(localPhone ?? '')
    .trim()
    .replace(/\s+/g, '');
  if (!local) {
    const code = String(phoneCode ?? '')
      .trim()
      .replace(/\s+/g, '');
    return code ? normalizeRegisterPhoneFull(code) : '';
  }
  if (local.startsWith('+')) {
    return normalizeRegisterPhoneFull(local);
  }

  const prefix = normalizeRegisterPhoneFull(
    String(phoneCode ?? '').trim().replace(/\s+/g, '') || '+',
  );
  let digits = local.replace(/^\+/, '').replace(/\D/g, '');
  const codeDigits = prefix.replace(/\D/g, '');
  if (codeDigits && digits.startsWith(codeDigits)) {
    digits = digits.slice(codeDigits.length);
  }
  if (digits.startsWith('0')) digits = digits.slice(1);

  return normalizeRegisterPhoneFull(`${prefix}${digits}`);
}
