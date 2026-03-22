/**
 * Checkout coupon validation — must match Nest POST /api/coupons/validate.
 */
import { apiFetch } from './apiService';

/** Must match API ValidateCouponDto.channel */
export type CouponValidationChannel = 'MARKETPLACE' | 'RETAIL';

export type ValidatedCouponPayload = {
  valid: boolean;
  discountAmount: number;
  coupon: {
    id: string;
    code: string;
    type?: string;
    value?: number;
    applicableChannel?: string;
  };
};

export async function validateCouponRemote(
  code: string,
  orderAmount: number,
  channel: CouponValidationChannel,
  clientProfileId?: string
): Promise<ValidatedCouponPayload> {
  return apiFetch<ValidatedCouponPayload>('/api/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({
      code: code.trim(),
      orderAmount,
      channel,
      ...(clientProfileId ? { clientProfileId } : {}),
    }),
  });
}
