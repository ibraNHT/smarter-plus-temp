import React, { useEffect, useState } from 'react';
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

export const ServiceAppointmentPicker: React.FC<ServiceAppointmentPickerProps> = ({
  producerId,
  durationHours,
  selectedSlotIso,
  onSelectSlot,
  offerId,
  clientId,
  orders = [],
  cart = [],
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
          setSlotBlockReason(res.reason ? `Unavailable: ${res.reason}` : 'Unavailable');
          setServiceSlotStates([]);
          return;
        }
        setSlotBlockReason('');
        const currentIso = currentBookingIso
          ? new Date(currentBookingIso).toISOString()
          : null;
        const activeOrders = orders.filter(
          (o) => o.producerId === producerId && o.status !== OrderStatus.CANCELLED,
        );
        const myBookedStarts = new Set(
          activeOrders
            .filter((o) => !!clientId && o.clientId === clientId)
            .flatMap((o) =>
              (o.items || [])
                .filter((item) => item.type === OfferType.SERVICE && !!item.bookingDate)
                .map((item) => new Date(item.bookingDate!).toISOString()),
            ),
        );
        const myCartBookedStarts = new Set(
          cart
            .filter(
              (item) =>
                item.type === OfferType.SERVICE &&
                (!offerId || item.id === offerId) &&
                !!item.bookingDate,
            )
            .map((item) => new Date(item.bookingDate!).toISOString()),
        );
        const allSlots = (res?.slots || []).map((s) => {
          const iso = new Date(s.time).toISOString();
          if (currentIso && iso === currentIso) {
            return { time: new Date(s.time), status: 'AVAILABLE' as const };
          }
          if (myCartBookedStarts.has(iso)) {
            return {
              time: new Date(s.time),
              status: 'BOOKED_BY_ME' as const,
              reason: 'Already in your cart',
            };
          }
          if (s.status === 'BOOKED' && myBookedStarts.has(iso)) {
            return {
              time: new Date(s.time),
              status: 'BOOKED_BY_ME' as const,
              reason: 'You already booked this slot',
            };
          }
          if (s.status === 'BOOKED') {
            return {
              time: new Date(s.time),
              status: 'BOOKED' as const,
              reason: s.reason || 'Already busy',
            };
          }
          return { time: new Date(s.time), status: 'AVAILABLE' as const };
        });
        setServiceSlotStates(allSlots);
      } catch {
        if (!alive) return;
        setSlotBlockReason('Availability check failed. Please try another date.');
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
    orders,
    cart,
    offerId,
    clientId,
    currentBookingIso,
  ]);

  return (
    <div className={className}>
      <div className="mb-4">
        <label className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-1">
          <Calendar className="h-3.5 w-3.5" /> Date
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
              {slotBlockReason || 'No slots available for this date.'}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Pick a day when the producer is available and choose an open time slot.
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
                    Mine
                  </span>
                )}
                {slot.status === 'BOOKED' && (
                  <span className="absolute -top-2 right-1 rounded bg-gray-500 px-1 py-0.5 text-[9px] text-white">
                    Busy
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
      <p className="text-xs text-gray-500 mt-3 flex items-center">
        <Clock className="h-3 w-3 mr-1" /> Duration: {Math.max(1, durationHours || 1)} hours per slot
      </p>
    </div>
  );
};
