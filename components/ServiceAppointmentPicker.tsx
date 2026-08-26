import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { apiFetch } from '../services/apiService';
import { API_ENDPOINTS } from '../client-api/endpoints';
import { OfferType, OrderStatus, type CartItem, type Order } from '../types';
import { parseLocalYmd, toLocalYmd } from '../utils/parseLocalYmd';
import { ServiceSlotsSkeleton } from './Loaders';
import { useTranslation } from '../services/i18nContext';

export type ServiceSlotStatus = 'AVAILABLE' | 'BOOKED' | 'BOOKED_BY_ME';

export interface ServiceSlotState {
  time: Date;
  status: ServiceSlotStatus;
  reason?: string;
}

export interface ServiceAppointmentPickerProps {
  producerId: string;
  durationHours: number;
  selectedSlotIso: string | null;
  onSelectSlot: (iso: string | null) => void;
  offerId?: string;
  clientId?: string;
  orders?: Order[];
  cart?: CartItem[];
  /** During reschedule, keep the current booking selectable. */
  currentBookingIso?: string;
  className?: string;
}

/**
 * Stable identities for the optional list props. Inline `= []` defaults allocate a
 * new array on every render, and these feed the availability effect's dependency
 * array — which is how the reschedule modals (which pass `orders` but not `cart`)
 * ended up in an infinite fetch loop.
 */
const NO_ORDERS: Order[] = [];
const NO_CART: CartItem[] = [];

export const ServiceAppointmentPicker: React.FC<ServiceAppointmentPickerProps> = ({
  producerId,
  durationHours,
  selectedSlotIso,
  onSelectSlot,
  offerId,
  clientId,
  orders = NO_ORDERS,
  cart = NO_CART,
  currentBookingIso,
  className = '',
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (currentBookingIso) {
      const d = new Date(currentBookingIso);
      if (!Number.isNaN(d.getTime())) return toLocalYmd(d);
    }
    return toLocalYmd(new Date());
  });
  const { t } = useTranslation();
  const [serviceSlotStates, setServiceSlotStates] = useState<ServiceSlotState[]>([]);
  const [slotBlockReason, setSlotBlockReason] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Depend on the CONTENT of orders/cart, not their identity. Callers legitimately
  // hand us a fresh array each render (store state is rebuilt on every refresh
  // poll), so keying the effect on identity re-fetches forever. These collapse to
  // stable strings that only change when a relevant booking actually changes.
  const myBookedKey = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.producerId === producerId &&
            o.status !== OrderStatus.CANCELLED &&
            !!clientId &&
            o.clientId === clientId,
        )
        .flatMap((o) =>
          (o.items || [])
            .filter((item) => item.type === OfferType.SERVICE && !!item.bookingDate)
            .map((item) => new Date(item.bookingDate!).toISOString()),
        )
        .sort()
        .join('|'),
    [orders, producerId, clientId],
  );

  const myCartKey = useMemo(
    () =>
      cart
        .filter(
          (item) =>
            item.type === OfferType.SERVICE &&
            (!offerId || item.id === offerId) &&
            !!item.bookingDate,
        )
        .map((item) => new Date(item.bookingDate!).toISOString())
        .sort()
        .join('|'),
    [cart, offerId],
  );

  useEffect(() => {
    let alive = true;
    const loadAvailability = async () => {
      if (!producerId) return;
      const dateObj = parseLocalYmd(selectedDate);
      const dateStr = toLocalYmd(dateObj);
      const duration = Math.max(1, durationHours || 1);
      setSlotsLoading(true);
      try {
        const res = await apiFetch<{
          blocked: boolean;
          reason?: string;
          slots: Array<{ time: string; status: 'AVAILABLE' | 'BOOKED'; reason?: string }>;
        }>(API_ENDPOINTS.producers.availabilityByDate(producerId, dateStr, duration), {
          silent401: true,
        } as any);
        if (!alive) return;
        if (res?.blocked) {
          setSlotBlockReason(res.reason ? t('service.unavailableReason', { reason: res.reason }) : t('service.unavailable'));
          setServiceSlotStates([]);
          return;
        }
        setSlotBlockReason('');
        const currentIso = currentBookingIso
          ? new Date(currentBookingIso).toISOString()
          : null;
        const myBookedStarts = new Set(myBookedKey ? myBookedKey.split('|') : []);
        const myCartBookedStarts = new Set(myCartKey ? myCartKey.split('|') : []);
        const allSlots = (res?.slots || []).map((s) => {
          const iso = new Date(s.time).toISOString();
          if (currentIso && iso === currentIso) {
            return { time: new Date(s.time), status: 'AVAILABLE' as const };
          }
          if (myCartBookedStarts.has(iso)) {
            return {
              time: new Date(s.time),
              status: 'BOOKED_BY_ME' as const,
              reason: t('service.alreadyInCart'),
            };
          }
          if (s.status === 'BOOKED' && myBookedStarts.has(iso)) {
            return {
              time: new Date(s.time),
              status: 'BOOKED_BY_ME' as const,
              reason: t('service.alreadyBooked'),
            };
          }
          if (s.status === 'BOOKED') {
            return {
              time: new Date(s.time),
              status: 'BOOKED' as const,
              reason: s.reason || t('service.alreadyBusy'),
            };
          }
          return { time: new Date(s.time), status: 'AVAILABLE' as const };
        });
        setServiceSlotStates(allSlots);
      } catch {
        if (!alive) return;
        setSlotBlockReason(t('service.availabilityFailed'));
        setServiceSlotStates([]);
      } finally {
        if (alive) setSlotsLoading(false);
      }
    };
    void loadAvailability();
    return () => {
      alive = false;
    };
  }, [
    selectedDate,
    producerId,
    durationHours,
    myBookedKey,
    myCartKey,
    offerId,
    clientId,
    currentBookingIso,
  ]);

  return (
    <div className={className}>
      <div className="mb-4">
        <label className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-1">
          <Calendar className="h-3.5 w-3.5" /> {t('service.date')}
        </label>
        <input
          type="date"
          min={toLocalYmd(new Date())}
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            onSelectSlot(null);
          }}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white text-gray-900"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {slotsLoading ? (
          <ServiceSlotsSkeleton label={t('product.loadingSlots')} />
        ) : serviceSlotStates.length === 0 ? (
          <div className="col-span-3 space-y-2 py-2">
            <p className="text-sm text-gray-500 italic">
              {slotBlockReason || t('service.noSlots')}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {t('service.pickDayHint')}
            </p>
          </div>
        ) : (
          serviceSlotStates.map((slot) => {
            const slotStr = slot.time.toISOString();
            const displayTime = slot.time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const isSelected = selectedSlotIso === slotStr;
            const isDisabled = slot.status !== 'AVAILABLE';
            return (
              <button
                key={slotStr}
                type="button"
                onClick={() => {
                  if (isDisabled) return;
                  onSelectSlot(slotStr);
                }}
                disabled={isDisabled}
                title={slot.reason || ''}
                className={`relative py-2 px-1 text-xs font-bold rounded border ${
                  isDisabled
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : isSelected
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                }`}
              >
                {displayTime}
                {slot.status === 'BOOKED_BY_ME' && (
                  <span className="absolute -top-2 right-1 rounded bg-blue-600 px-1 py-0.5 text-[9px] text-white">
                    {t('service.mine')}
                  </span>
                )}
                {slot.status === 'BOOKED' && (
                  <span className="absolute -top-2 right-1 rounded bg-gray-500 px-1 py-0.5 text-[9px] text-white">
                    {t('service.busy')}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
      <p className="text-xs text-gray-500 mt-3 flex items-center">
        <Clock className="h-3 w-3 mr-1" /> {t('service.duration', { hours: Math.max(1, durationHours || 1) })}
      </p>
    </div>
  );
};
