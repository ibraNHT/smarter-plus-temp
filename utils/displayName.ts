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

/** Tailwind classes for single-line name truncation inside flex layouts. */
export const displayNameTruncateClass =
  'truncate min-w-0 max-w-full';
