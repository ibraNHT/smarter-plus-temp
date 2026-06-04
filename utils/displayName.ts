/** Resolve producer label for UI (business name vs individual). */
export function resolveProducerDisplayName(producer: {
  type?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
} | null | undefined): string {
  if (!producer) return 'Unknown';
  if (producer.type === 'BUSINESS') {
    return (
      producer.name?.trim() ||
      `${producer.firstName ?? ''} ${producer.lastName ?? ''}`.trim() ||
      'Business'
    );
  }
  return (
    `${producer.firstName ?? ''} ${producer.lastName ?? ''}`.trim() ||
    producer.name?.trim() ||
    'Unknown'
  );
}

/** Profile picture URL from producer/client row or nested user. */
export function resolveProfileImageUrl(
  profile: { profileImageUrl?: string; user?: { profileImageUrl?: string } } | null | undefined,
): string | undefined {
  if (!profile) return undefined;
  const url = (profile.profileImageUrl || profile.user?.profileImageUrl || '').trim();
  return url || undefined;
}

/** Tailwind classes for single-line name truncation inside flex layouts. */
export const displayNameTruncateClass =
  'truncate min-w-0 max-w-full';
