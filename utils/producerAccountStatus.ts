import { ProducerStatus, type ProducerProfile, type UserSession } from '../types';
import { isProducerDashboardUser } from '../services/producerSession';

/** Resolve the logged-in user's producer profile row from the store list. */
/** Producer profile id used to filter seller-side orders on the dashboard. */
export function resolveManagedProducerProfileId(
  producers: ProducerProfile[],
  user: UserSession | null | undefined,
): string | undefined {
  return findProducerForUser(producers, user)?.id ?? user?.producerId ?? undefined;
}

export function findProducerForUser(
  producers: ProducerProfile[],
  user: UserSession | null | undefined,
): ProducerProfile | undefined {
  if (!user) return undefined;
  const managedUserId = user.managedProducerUserId;
  return producers.find((p) => {
    const profileUserId = p.userId ?? (p as { user?: { id?: string } }).user?.id;
    return (
      (user.producerId && p.id === user.producerId) ||
      profileUserId === user.id ||
      (!!managedUserId && profileUserId === managedUserId)
    );
  });
}

export function isProducerPendingApproval(
  user: UserSession | null | undefined,
  producer: ProducerProfile | undefined,
): boolean {
  return (
    isProducerDashboardUser(user) &&
    producer?.status === ProducerStatus.PENDING
  );
}

export function isProducerRejected(
  user: UserSession | null | undefined,
  producer: ProducerProfile | undefined,
): boolean {
  return (
    isProducerDashboardUser(user) &&
    producer?.status === ProducerStatus.REJECTED
  );
}

export function isProducerValidated(
  user: UserSession | null | undefined,
  producer: ProducerProfile | undefined,
): boolean {
  return (
    isProducerDashboardUser(user) &&
    producer?.status === ProducerStatus.VALIDATED
  );
}
