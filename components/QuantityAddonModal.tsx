'use client';

import React, { useEffect, useState } from 'react';

export type QuantityAddonModalAddon = {
  id: string;
  name: string;
  price: number;
};

type QuantityAddonModalProps = {
  addon: QuantityAddonModalAddon;
  /** True when this extra is already in the booking (show remove + update labels). */
  inBooking: boolean;
  initialQty: number;
  onClose: () => void;
  onConfirm: (qty: number) => void;
};

export function QuantityAddonModal({ addon, inBooking, initialQty, onClose, onConfirm }: QuantityAddonModalProps) {
  const [qty, setQty] = useState(() => Math.max(0, initialQty));

  useEffect(() => {
    setQty(Math.max(0, initialQty));
  }, [addon.id, initialQty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quantity-addon-title"
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />

      <div className="relative bg-white rounded-xl p-6 w-80 max-w-[100vw] shadow-xl">
        <h3 id="quantity-addon-title" className="text-lg font-semibold text-gray-900">
          {addon.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          R{addon.price.toLocaleString('en-ZA')} each
        </p>

        <div className="flex items-center justify-center gap-4 my-6">
          <button
            type="button"
            className="w-10 h-10 rounded-lg border-2 border-gray-200 text-lg font-semibold text-gray-700 hover:bg-gray-50"
            onClick={() => setQty((q) => Math.max(0, q - 1))}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="text-xl font-bold tabular-nums min-w-[2ch] text-center">{qty}</span>
          <button
            type="button"
            className="w-10 h-10 rounded-lg border-2 border-gray-200 text-lg font-semibold text-gray-700 hover:bg-gray-50"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <p className="text-center font-semibold text-gray-900">
          Total: R{(qty * addon.price).toLocaleString('en-ZA')}
        </p>

        {inBooking && qty > 0 && (
          <button
            type="button"
            className="mt-4 w-full text-sm font-semibold text-red-600 hover:text-red-700 py-2 rounded-lg hover:bg-red-50"
            onClick={() => onConfirm(0)}
          >
            Remove from booking
          </button>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!inBooking && qty <= 0}
            className="flex-1 bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700"
            onClick={() => onConfirm(qty)}
          >
            {!inBooking ? 'Add to booking' : qty <= 0 ? 'Remove' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}
