/** Tagged entries in `ProducerProfile.certifications` for typed compliance uploads. */
export const NIU_CERT_PREFIX = 'doc:niu:';
export const BUSINESS_REG_PREFIX = 'doc:business:';

export function splitProducerDocuments(certifications: string[] | undefined) {
  let niuCertificateUrl = '';
  let businessRegistrationUrl = '';
  const legacy: string[] = [];
  for (const entry of certifications ?? []) {
    if (!entry) continue;
    if (entry.startsWith(NIU_CERT_PREFIX)) {
      niuCertificateUrl = entry.slice(NIU_CERT_PREFIX.length);
    } else if (entry.startsWith(BUSINESS_REG_PREFIX)) {
      businessRegistrationUrl = entry.slice(BUSINESS_REG_PREFIX.length);
    } else {
      legacy.push(entry);
    }
  }
  return { niuCertificateUrl, businessRegistrationUrl, legacy };
}

export function mergeProducerDocuments(
  niuCertificateUrl?: string,
  businessRegistrationUrl?: string,
  legacy: string[] = [],
): string[] {
  const out: string[] = [];
  if (niuCertificateUrl?.trim()) out.push(`${NIU_CERT_PREFIX}${niuCertificateUrl.trim()}`);
  if (businessRegistrationUrl?.trim()) out.push(`${BUSINESS_REG_PREFIX}${businessRegistrationUrl.trim()}`);
  return [...out, ...legacy.filter(Boolean)];
}

export function documentFileLabel(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = path.split('/').pop();
    return name && name.length > 0 ? decodeURIComponent(name) : 'View document';
  } catch {
    return url.length > 48 ? `${url.slice(0, 45)}…` : url;
  }
}
