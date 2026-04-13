'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Plus,
  Save,
  X,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Check,
  Percent,
  Gift,
  Calendar,
  Hash,
  ShieldCheck,
  Tag,
  Bath,
  LayoutGrid,
  Users,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  pricingStore,
  type ServiceRecord,
  type ExtraRecord,
  type CleanerPricing,
  type PromoCode,
  type BathroomRule,
  type ExtraRoomRecord,
} from './pricingStore';
import { type ToastState, formatZAR, fadeUp, stagger, SectionHeader, PriceInput } from './pricing-shared';

interface EditingExtra {
  id: string;
  name: string;
  price: string;
  icon: string;
}

interface EditingPromo {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minOrderValue: string;
  maxUses: string;
  expiresAt: string;
  appliesTo: string;
}

interface EditingBathroomRule {
  id: string;
  label: string;
  price: string;
  description: string;
}

interface EditingExtraRoom {
  id: string;
  name: string;
  price: string;
  description: string;
  icon: string;
}

type NewPromoState = {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minOrderValue: string;
  maxUses: string;
  expiresAt: string;
  appliesTo: string;
};

function PromoFormFields({
  vals,
  setVals,
  services,
}: {
  vals: NewPromoState;
  setVals: React.Dispatch<React.SetStateAction<NewPromoState>>;
  services: ServiceRecord[];
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>Promo Code</span>
        </label>
        <input
          type="text"
          value={vals.code}
          onChange={(e) => setVals((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
          placeholder="e.g. SAVE20"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold uppercase tracking-widest outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>Description</span>
        </label>
        <input
          type="text"
          value={vals.description}
          onChange={(e) => setVals((p) => ({ ...p, description: e.target.value }))}
          placeholder="Brief description of this promo"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>Discount Type</span>
        </label>
        <div className="flex gap-2">
          {(['percentage', 'fixed'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setVals((p) => ({ ...p, discountType: t }))}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-xs font-bold transition-all',
                vals.discountType === t
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              )}
            >
              {t === 'percentage' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
              <span>{t === 'percentage' ? '% Off' : 'Flat Off'}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>{vals.discountType === 'percentage' ? 'Discount %' : 'Discount (R)'}</span>
        </label>
        <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
          <span className="text-xs font-bold text-gray-400">{vals.discountType === 'percentage' ? '%' : 'R'}</span>
          <input
            type="number"
            min="0"
            max={vals.discountType === 'percentage' ? 100 : undefined}
            value={vals.discountValue}
            onChange={(e) => setVals((p) => ({ ...p, discountValue: e.target.value }))}
            placeholder={vals.discountType === 'percentage' ? '20' : '50'}
            className="flex-1 bg-transparent text-sm font-bold text-gray-900 outline-none"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>Min Order (R)</span>
        </label>
        <input
          type="number"
          min="0"
          value={vals.minOrderValue}
          onChange={(e) => setVals((p) => ({ ...p, minOrderValue: e.target.value }))}
          placeholder="0 = no minimum"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>Max Uses</span>
        </label>
        <input
          type="number"
          min="0"
          value={vals.maxUses}
          onChange={(e) => setVals((p) => ({ ...p, maxUses: e.target.value }))}
          placeholder="Leave blank = unlimited"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>Expiry Date</span>
        </label>
        <input
          type="date"
          value={vals.expiresAt}
          onChange={(e) => setVals((p) => ({ ...p, expiresAt: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>Applies To</span>
        </label>
        <select
          value={vals.appliesTo}
          onChange={(e) => setVals((p) => ({ ...p, appliesTo: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="all">All Services</option>
          {services.map((svc) => (
            <option key={svc.id} value={svc.id}>
              {svc.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export const ExtrasSection = ({ onToast }: { onToast: (t: ToastState) => void }) => {
  const [extras, setExtras] = useState<ExtraRecord[]>(pricingStore.getData().extras);
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState<EditingExtra | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExtra, setNewExtra] = useState({
    name: '',
    price: '',
    icon: '✨',
    pricingType: 'fixed' as 'fixed' | 'per_item',
  });

  useEffect(() => pricingStore.subscribe(() => setExtras(pricingStore.getData().extras)), []);

  const handleSaveEdit = () => {
    if (!editing) return;
    const price = parseFloat(editing.price);
    if (isNaN(price) || price < 0) {
      onToast({ message: 'Enter a valid price', type: 'error' });
      return;
    }
    pricingStore.updateExtra(editing.id, { name: editing.name.trim(), price, icon: editing.icon });
    onToast({ message: `"${editing.name}" pricing updated`, type: 'success' });
    setEditing(null);
  };

  const handleToggle = (extra: ExtraRecord) => {
    pricingStore.updateExtra(extra.id, { active: !extra.active });
    onToast({ message: `"${extra.name}" ${!extra.active ? 'enabled' : 'disabled'}`, type: 'success' });
  };

  const handleDelete = (extra: ExtraRecord) => {
    pricingStore.deleteExtra(extra.id);
    onToast({ message: `"${extra.name}" removed`, type: 'success' });
  };

  const handleAdd = () => {
    if (!newExtra.name.trim() || !newExtra.price) {
      onToast({ message: 'Name and price are required', type: 'error' });
      return;
    }
    const price = parseFloat(newExtra.price);
    if (isNaN(price) || price < 0) {
      onToast({ message: 'Enter a valid price', type: 'error' });
      return;
    }
    pricingStore.addExtra({
      name: newExtra.name.trim(),
      price,
      pricingType: newExtra.pricingType,
      active: true,
      icon: newExtra.icon || '✨',
    });
    onToast({ message: `"${newExtra.name}" extra added`, type: 'success' });
    setNewExtra({ name: '', price: '', icon: '✨', pricingType: 'fixed' });
    setShowAddForm(false);
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <SectionHeader
        icon={<Tag className="h-4 w-4" />}
        title="Extras Pricing"
        subtitle={`${extras.filter((e) => e.active !== false).length} of ${extras.length} extras active`}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        action={
          expanded ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddForm(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Extra</span>
            </button>
          ) : undefined
        }
      />
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-5 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {extras.map((extra) => {
                  const isEditing = editing?.id === extra.id;
                  return (
                    <motion.div
                      key={extra.id}
                      layout
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3.5 transition-all',
                        !extra.active && 'opacity-50',
                        isEditing ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      )}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editing.icon}
                          onChange={(e) => setEditing((prev) => prev && { ...prev, icon: e.target.value })}
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-indigo-300 text-center text-xl outline-none"
                          maxLength={2}
                        />
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl shadow-sm">
                          {extra.icon}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editing.name}
                            onChange={(e) => setEditing((prev) => prev && { ...prev, name: e.target.value })}
                            className="mb-1 w-full rounded-lg border border-indigo-300 px-2 py-1 text-sm font-bold text-gray-900 outline-none"
                          />
                        ) : (
                          <p className="truncate text-sm font-semibold text-gray-900">{extra.name}</p>
                        )}
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {isEditing ? (
                            <PriceInput
                              value={editing.price}
                              onChange={(v) => setEditing((prev) => prev && { ...prev, price: v })}
                              className="h-7"
                            />
                          ) : (
                            <span className="text-sm font-extrabold text-gray-900">{formatZAR(extra.price)}</span>
                          )}
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                              extra.pricingType === 'fixed' || !extra.pricingType
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-amber-50 text-amber-600'
                            )}
                          >
                            {extra.pricingType === 'per_item' ? '/item' : 'flat'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-col gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setEditing({
                                  id: extra.id,
                                  name: extra.name,
                                  price: String(extra.price),
                                  icon: extra.icon,
                                })
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-200 text-gray-500 transition-colors hover:bg-indigo-100 hover:text-indigo-600"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggle(extra)}
                              className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-lg transition-colors',
                                extra.active
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                  : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                              )}
                            >
                              {extra.active ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(extra)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-200 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="flex flex-col gap-2.5 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/30 p-3.5"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newExtra.icon}
                          onChange={(e) => setNewExtra((p) => ({ ...p, icon: e.target.value }))}
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 text-center text-xl outline-none"
                          maxLength={2}
                          placeholder="✨"
                        />
                        <input
                          type="text"
                          value={newExtra.name}
                          onChange={(e) => setNewExtra((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Extra name"
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-1 items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-400">R</span>
                          <input
                            type="number"
                            min="0"
                            value={newExtra.price}
                            onChange={(e) => setNewExtra((p) => ({ ...p, price: e.target.value }))}
                            placeholder="Price"
                            className="flex-1 rounded-xl border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-indigo-400"
                          />
                        </div>
                        <select
                          value={newExtra.pricingType}
                          onChange={(e) =>
                            setNewExtra((p) => ({ ...p, pricingType: e.target.value as 'fixed' | 'per_item' }))
                          }
                          className="rounded-xl border border-gray-200 px-2 py-2 text-xs outline-none focus:border-indigo-400"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="per_item">Per Item</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAdd}
                          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Add Extra</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const CleanerPricingSection = ({ onToast }: { onToast: (t: ToastState) => void }) => {
  const [cpList, setCpList] = useState<CleanerPricing[]>(pricingStore.getData().cleanerPricing);
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState<
    Record<
      string,
      { baseRate: string; additionalCleanerRate: string; label: string; description: string }
    >
  >({});

  useEffect(() => pricingStore.subscribe(() => setCpList(pricingStore.getData().cleanerPricing)), []);

  const startEdit = (cp: CleanerPricing) => {
    setEditing((prev) => ({
      ...prev,
      [cp.id]: {
        baseRate: String(cp.baseRate),
        additionalCleanerRate: String(cp.additionalCleanerRate),
        label: cp.label,
        description: cp.description,
      },
    }));
  };

  const saveEdit = (cp: CleanerPricing) => {
    const e = editing[cp.id];
    if (!e) return;
    const baseRate = parseFloat(e.baseRate);
    const additionalRate = parseFloat(e.additionalCleanerRate);
    if (isNaN(baseRate) || baseRate < 0) {
      onToast({ message: 'Enter a valid base rate', type: 'error' });
      return;
    }
    pricingStore.updateCleanerPricing(cp.id, {
      baseRate,
      additionalCleanerRate: isNaN(additionalRate) ? 0 : additionalRate,
      label: e.label.trim(),
      description: e.description.trim(),
    });
    onToast({ message: `"${e.label}" pricing saved`, type: 'success' });
    setEditing((prev) => {
      const next = { ...prev };
      delete next[cp.id];
      return next;
    });
  };

  const cancelEdit = (id: string) => {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <SectionHeader
        icon={<Users className="h-4 w-4" />}
        title="Cleaner Pricing"
        subtitle="Set individual and team cleaner rates"
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-4 border-t border-gray-100 px-5 py-4 sm:grid-cols-2">
              {cpList.map((cp) => {
                const e = editing[cp.id];
                const isEditing = !!e;
                return (
                  <div
                    key={cp.id}
                    className={cn(
                      'rounded-2xl border p-5 transition-all',
                      isEditing ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-100 bg-gray-50'
                    )}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white',
                            cp.type === 'individual'
                              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                              : 'bg-gradient-to-br from-purple-500 to-purple-700'
                          )}
                        >
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          {isEditing ? (
                            <input
                              type="text"
                              value={e.label}
                              onChange={(ev) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [cp.id]: { ...prev[cp.id]!, label: ev.target.value },
                                }))
                              }
                              className="w-full rounded-lg border border-indigo-300 px-2 py-0.5 text-sm font-bold text-gray-900 outline-none"
                            />
                          ) : (
                            <p className="text-sm font-bold text-gray-900">{cp.label}</p>
                          )}
                          {isEditing ? (
                            <input
                              type="text"
                              value={e.description}
                              onChange={(ev) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [cp.id]: { ...prev[cp.id]!, description: ev.target.value },
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-0.5 text-xs text-gray-500 outline-none"
                            />
                          ) : (
                            <p className="mt-0.5 text-xs text-gray-400">{cp.description}</p>
                          )}
                        </div>
                      </div>
                      {isEditing ? (
                        <div className="flex flex-shrink-0 gap-1.5">
                          <button
                            type="button"
                            onClick={() => saveEdit(cp)}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-indigo-700"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelEdit(cp.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(cp)}
                          className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-gray-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Base Rate</span>
                        {isEditing ? (
                          <PriceInput
                            value={e.baseRate}
                            onChange={(v) =>
                              setEditing((prev) => ({
                                ...prev,
                                [cp.id]: { ...prev[cp.id]!, baseRate: v },
                              }))
                            }
                          />
                        ) : (
                          <span className="text-sm font-extrabold text-gray-900">{formatZAR(cp.baseRate)}</span>
                        )}
                      </div>
                      {cp.type === 'team' && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Extra Cleaner Rate</span>
                          {isEditing ? (
                            <PriceInput
                              value={e.additionalCleanerRate}
                              onChange={(v) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [cp.id]: { ...prev[cp.id]!, additionalCleanerRate: v },
                                }))
                              }
                            />
                          ) : (
                            <span className="text-sm font-extrabold text-gray-900">
                              {formatZAR(cp.additionalCleanerRate)}
                              <span className="ml-1 text-xs font-normal text-gray-400">/cleaner</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const PromoCodesSection = ({ onToast }: { onToast: (t: ToastState) => void }) => {
  const [promos, setPromos] = useState<PromoCode[]>(pricingStore.getData().promoCodes);
  const [services, setServices] = useState<ServiceRecord[]>(() => pricingStore.getData().services);
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState<EditingPromo | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPromo, setNewPromo] = useState<NewPromoState>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    maxUses: '',
    expiresAt: '',
    appliesTo: 'all',
  });

  useEffect(() => {
    return pricingStore.subscribe(() => {
      setPromos(pricingStore.getData().promoCodes);
      setServices(pricingStore.getData().services);
    });
  }, []);

  const startEdit = (promo: PromoCode) => {
    setEditing({
      id: promo.id,
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: String(promo.discountValue),
      minOrderValue: String(promo.minOrderValue),
      maxUses: promo.maxUses !== null ? String(promo.maxUses) : '',
      expiresAt: promo.expiresAt ?? '',
      appliesTo: Array.isArray(promo.appliesTo) ? promo.appliesTo.join(',') : 'all',
    });
    setShowAddForm(false);
  };

  const saveEdit = () => {
    if (!editing) return;
    const val = parseFloat(editing.discountValue);
    if (isNaN(val) || val <= 0) {
      onToast({ message: 'Enter a valid discount value (> 0)', type: 'error' });
      return;
    }
    if (editing.discountType === 'percentage' && val > 100) {
      onToast({ message: 'Percentage discount cannot exceed 100%', type: 'error' });
      return;
    }
    if (!editing.code.trim()) {
      onToast({ message: 'Promo code cannot be empty', type: 'error' });
      return;
    }
    const appliesToVal: 'all' | string[] =
      editing.appliesTo.trim() === 'all' || editing.appliesTo.trim() === ''
        ? 'all'
        : editing.appliesTo
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    pricingStore.updatePromoCode(editing.id, {
      code: editing.code.trim().toUpperCase(),
      description: editing.description.trim(),
      discountType: editing.discountType,
      discountValue: val,
      minOrderValue: parseFloat(editing.minOrderValue) || 0,
      maxUses: editing.maxUses.trim() ? parseInt(editing.maxUses, 10) || null : null,
      expiresAt: editing.expiresAt.trim() || null,
      appliesTo: appliesToVal,
    });
    onToast({ message: `Promo code "${editing.code.toUpperCase()}" updated`, type: 'success' });
    setEditing(null);
  };

  const handleAdd = () => {
    const val = parseFloat(newPromo.discountValue);
    if (!newPromo.code.trim()) {
      onToast({ message: 'Promo code is required', type: 'error' });
      return;
    }
    if (isNaN(val) || val <= 0) {
      onToast({ message: 'Enter a valid discount value (> 0)', type: 'error' });
      return;
    }
    if (newPromo.discountType === 'percentage' && val > 100) {
      onToast({ message: 'Percentage discount cannot exceed 100%', type: 'error' });
      return;
    }
    const codeUpper = newPromo.code.trim().toUpperCase();
    if (promos.some((p) => p.code === codeUpper)) {
      onToast({ message: `Code "${codeUpper}" already exists`, type: 'error' });
      return;
    }
    const appliesToVal: 'all' | string[] =
      newPromo.appliesTo.trim() === 'all' || newPromo.appliesTo.trim() === ''
        ? 'all'
        : newPromo.appliesTo
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    pricingStore.addPromoCode({
      code: codeUpper,
      description: newPromo.description.trim(),
      discountType: newPromo.discountType,
      discountValue: val,
      minOrderValue: parseFloat(newPromo.minOrderValue) || 0,
      maxUses: newPromo.maxUses.trim() ? parseInt(newPromo.maxUses, 10) || null : null,
      active: true,
      expiresAt: newPromo.expiresAt.trim() || null,
      appliesTo: appliesToVal,
    });
    onToast({ message: `Promo code "${codeUpper}" created!`, type: 'success' });
    setNewPromo({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderValue: '',
      maxUses: '',
      expiresAt: '',
      appliesTo: 'all',
    });
    setShowAddForm(false);
  };

  const handleToggle = (promo: PromoCode) => {
    pricingStore.updatePromoCode(promo.id, { active: !promo.active });
    onToast({ message: `"${promo.code}" ${!promo.active ? 'activated' : 'deactivated'}`, type: 'success' });
  };

  const handleDelete = (promo: PromoCode) => {
    pricingStore.deletePromoCode(promo.id);
    onToast({ message: `"${promo.code}" deleted`, type: 'success' });
  };

  const isExpired = (expiresAt: string | null) => !!expiresAt && new Date(expiresAt) < new Date();

  const usagePct = (promo: PromoCode) => {
    if (promo.maxUses === null) return null;
    return Math.min(100, Math.round((promo.usedCount / promo.maxUses) * 100));
  };

  const editingToNewPromoState = (e: EditingPromo): NewPromoState => ({
    code: e.code,
    description: e.description,
    discountType: e.discountType,
    discountValue: e.discountValue,
    minOrderValue: e.minOrderValue,
    maxUses: e.maxUses,
    expiresAt: e.expiresAt,
    appliesTo: e.appliesTo,
  });

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <SectionHeader
        icon={<Gift className="h-4 w-4" />}
        title="Promo Codes & Discounts"
        subtitle={`${promos.filter((p) => p.active && !isExpired(p.expiresAt)).length} active codes · ${promos.length} total`}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        action={
          expanded ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddForm(true);
                setEditing(null);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Code</span>
            </button>
          ) : undefined
        }
      />
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100">
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="m-5 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/30 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-gray-900">New Promo Code</h3>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <PromoFormFields vals={newPromo} setVals={setNewPromo} services={services} />
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={handleAdd}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Create Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3 p-5 pt-3">
                {promos.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-400">No promo codes yet. Create your first one above.</p>
                )}
                {promos.map((promo) => {
                  const pct = usagePct(promo);
                  const expired = isExpired(promo.expiresAt);
                  const isEdit = editing?.id === promo.id;
                  return (
                    <motion.div
                      key={promo.id}
                      layout
                      className={cn(
                        'overflow-hidden rounded-2xl border transition-all',
                        !promo.active || expired ? 'opacity-60' : '',
                        isEdit ? 'border-indigo-300 shadow-md' : 'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      {isEdit && editing ? (
                        <div className="bg-indigo-50/30 p-5">
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-gray-900">Edit Promo Code</h3>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <PromoFormFields
                            vals={editingToNewPromoState(editing)}
                            setVals={(updater) => {
                              setEditing((prev) => {
                                if (!prev) return prev;
                                const base = editingToNewPromoState(prev);
                                const next = typeof updater === 'function' ? updater(base) : updater;
                                return {
                                  ...prev,
                                  code: next.code,
                                  description: next.description,
                                  discountType: next.discountType,
                                  discountValue: next.discountValue,
                                  minOrderValue: next.minOrderValue,
                                  maxUses: next.maxUses,
                                  expiresAt: next.expiresAt,
                                  appliesTo: next.appliesTo,
                                };
                              });
                            }}
                            services={services}
                          />
                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
                            >
                              <Save className="h-3.5 w-3.5" />
                              <span>Save Changes</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'min-w-[90px] rounded-xl px-3 py-2 text-center',
                                promo.active && !expired
                                  ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white'
                                  : 'bg-gray-100 text-gray-400'
                              )}
                            >
                              <p className="text-[11px] font-extrabold leading-none tracking-widest">{promo.code}</p>
                              <p
                                className={cn(
                                  'mt-1 text-[10px] font-bold',
                                  promo.active && !expired ? 'text-indigo-200' : 'text-gray-400'
                                )}
                              >
                                {promo.discountType === 'percentage'
                                  ? `${promo.discountValue}% OFF`
                                  : `R${promo.discountValue} OFF`}
                              </p>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-gray-900">{promo.description || '—'}</p>
                                {expired && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                    <Calendar className="h-2.5 w-2.5" />
                                    <span>Expired</span>
                                  </span>
                                )}
                                {!expired && promo.active && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                    <ShieldCheck className="h-2.5 w-2.5" />
                                    <span>Active</span>
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                                {promo.minOrderValue > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                                    <DollarSign className="h-3 w-3 text-gray-400" />
                                    <span>Min R{promo.minOrderValue}</span>
                                  </span>
                                )}
                                {promo.expiresAt && (
                                  <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <span>Expires {promo.expiresAt}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                                  <Tag className="h-3 w-3 text-gray-400" />
                                  <span>
                                    {Array.isArray(promo.appliesTo)
                                      ? promo.appliesTo
                                          .map((id) => services.find((s) => s.id === id)?.name ?? id)
                                          .join(', ')
                                      : 'All services'}
                                  </span>
                                </span>
                              </div>
                              <div className="mt-2.5">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                                    <Hash className="h-2.5 w-2.5" />
                                    <span>
                                      {promo.usedCount} used
                                      {promo.maxUses !== null ? ` of ${promo.maxUses}` : ' (unlimited)'}
                                    </span>
                                  </span>
                                  {pct !== null && (
                                    <span
                                      className={cn(
                                        'text-[10px] font-bold',
                                        pct >= 90 ? 'text-red-500' : pct >= 60 ? 'text-amber-500' : 'text-indigo-600'
                                      )}
                                    >
                                      {pct}%
                                    </span>
                                  )}
                                </div>
                                {pct !== null && (
                                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      transition={{ duration: 0.6, ease: 'easeOut' }}
                                      className={cn(
                                        'h-full rounded-full',
                                        pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-400' : 'bg-indigo-500'
                                      )}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-shrink-0 flex-col gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEdit(promo)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                aria-label="Edit promo"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggle(promo)}
                                className={cn(
                                  'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                                  promo.active
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                )}
                                aria-label="Toggle promo"
                              >
                                {promo.active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(promo)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                aria-label="Delete promo"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const BathroomsSection = ({ onToast }: { onToast: (t: ToastState) => void }) => {
  const [rules, setRules] = useState<BathroomRule[]>(pricingStore.getData().bathroomRules);
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState<EditingBathroomRule | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({ label: '', price: '', description: '' });

  useEffect(() => pricingStore.subscribe(() => setRules(pricingStore.getData().bathroomRules)), []);

  const handleSave = () => {
    if (!editing) return;
    const price = parseFloat(editing.price);
    if (isNaN(price) || price < 0) {
      onToast({ message: 'Enter a valid price (≥ 0)', type: 'error' });
      return;
    }
    pricingStore.updateBathroomRule(editing.id, {
      label: editing.label.trim(),
      price,
      description: editing.description.trim(),
    });
    onToast({ message: `Bathroom rule "${editing.label}" updated`, type: 'success' });
    setEditing(null);
  };

  const handleAdd = () => {
    if (!newRule.label.trim()) {
      onToast({ message: 'Label is required', type: 'error' });
      return;
    }
    const price = parseFloat(newRule.price);
    if (isNaN(price) || price < 0) {
      onToast({ message: 'Enter a valid price (≥ 0)', type: 'error' });
      return;
    }
    pricingStore.addBathroomRule({
      label: newRule.label.trim(),
      price,
      description: newRule.description.trim(),
      active: true,
    });
    onToast({ message: 'Bathroom rule added', type: 'success' });
    setNewRule({ label: '', price: '', description: '' });
    setShowAddForm(false);
  };

  const handleDelete = (rule: BathroomRule) => {
    pricingStore.deleteBathroomRule(rule.id);
    onToast({ message: `"${rule.label}" removed`, type: 'success' });
  };

  const handleToggle = (rule: BathroomRule) => {
    pricingStore.updateBathroomRule(rule.id, { active: !rule.active });
    onToast({ message: `"${rule.label}" ${!rule.active ? 'enabled' : 'disabled'}`, type: 'success' });
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <SectionHeader
        icon={<Bath className="h-4 w-4" />}
        title="Bathroom Pricing"
        subtitle={`${rules.filter((r) => r.active !== false).length} active rules · surcharge added to base price`}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        action={
          expanded ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddForm(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Rule</span>
            </button>
          ) : undefined
        }
      />
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100">
              <div className="mx-5 mb-2 mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5">
                <Bath className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                <p className="text-[11px] font-medium text-blue-700">
                  Bathroom surcharges are added on top of the base/room price. The first bathroom is included free — subsequent
                  bathrooms add the configured amount.
                </p>
              </div>
              <div className="hidden grid-cols-[1fr_140px_1fr_80px_90px] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-2.5 md:grid">
                {['Tier', 'Surcharge', 'Description', 'Active', 'Actions'].map((h) => (
                  <p key={h} className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                    {h}
                  </p>
                ))}
              </div>
              <div className="space-y-2 px-5 py-4">
                {rules.map((rule) => {
                  const isEditing = editing?.id === rule.id;
                  return (
                    <div
                      key={rule.id}
                      className={cn(
                        'flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-colors',
                        !rule.active && 'opacity-50',
                        isEditing ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      )}
                    >
                      <div className="flex min-w-[120px] flex-1 items-center gap-2">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                          <Bath className="h-3.5 w-3.5 text-white" />
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editing.label}
                            onChange={(e) => setEditing((prev) => prev && { ...prev, label: e.target.value })}
                            className="flex-1 rounded-lg border border-indigo-300 px-2 py-1 text-sm font-semibold text-gray-900 outline-none"
                            placeholder="e.g. 2 Bathrooms"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-800">{rule.label}</span>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {isEditing ? (
                          <PriceInput
                            value={editing.price}
                            onChange={(v) => setEditing((prev) => prev && { ...prev, price: v })}
                          />
                        ) : rule.price === 0 ? (
                          <span className="text-sm font-extrabold text-green-600">Free</span>
                        ) : (
                          <span className="text-sm font-extrabold text-gray-900">{formatZAR(rule.price)}</span>
                        )}
                      </div>
                      <div className="hidden min-w-[120px] flex-1 sm:block">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editing.description}
                            onChange={(e) => setEditing((prev) => prev && { ...prev, description: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 outline-none"
                            placeholder="Brief description"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">{rule.description}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle(rule)}
                        className={cn('flex-shrink-0', rule.active ? 'text-green-600' : 'text-gray-400')}
                        aria-label={`Toggle ${rule.label}`}
                      >
                        {rule.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                      </button>
                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={handleSave}
                              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold text-white"
                            >
                              <Save className="h-3 w-3" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setEditing({
                                  id: rule.id,
                                  label: rule.label,
                                  price: String(rule.price),
                                  description: rule.description,
                                })
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(rule)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/30 p-3"
                    >
                      <input
                        type="text"
                        value={newRule.label}
                        onChange={(e) => setNewRule((p) => ({ ...p, label: e.target.value }))}
                        placeholder="e.g. 3 Bathrooms"
                        className="min-w-[120px] flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-400">R</span>
                        <input
                          type="number"
                          min="0"
                          value={newRule.price}
                          onChange={(e) => setNewRule((p) => ({ ...p, price: e.target.value }))}
                          placeholder="Surcharge"
                          className="w-24 rounded-xl border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                      </div>
                      <input
                        type="text"
                        value={newRule.description}
                        onChange={(e) => setNewRule((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Description (optional)"
                        className="min-w-[140px] flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={handleAdd}
                          className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Add</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const ExtraRoomsSection = ({ onToast }: { onToast: (t: ToastState) => void }) => {
  const [rooms, setRooms] = useState<ExtraRoomRecord[]>(pricingStore.getData().extraRooms);
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState<EditingExtraRoom | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', price: '', description: '', icon: '🏠' });

  useEffect(() => pricingStore.subscribe(() => setRooms(pricingStore.getData().extraRooms)), []);

  const handleSave = () => {
    if (!editing) return;
    const price = parseFloat(editing.price);
    if (isNaN(price) || price < 0) {
      onToast({ message: 'Enter a valid price (≥ 0)', type: 'error' });
      return;
    }
    pricingStore.updateExtraRoom(editing.id, {
      name: editing.name.trim(),
      price,
      description: editing.description.trim(),
      icon: editing.icon,
    });
    onToast({ message: `"${editing.name}" updated`, type: 'success' });
    setEditing(null);
  };

  const handleAdd = () => {
    if (!newRoom.name.trim()) {
      onToast({ message: 'Room name is required', type: 'error' });
      return;
    }
    const price = parseFloat(newRoom.price);
    if (isNaN(price) || price < 0) {
      onToast({ message: 'Enter a valid price (≥ 0)', type: 'error' });
      return;
    }
    pricingStore.addExtraRoom({
      name: newRoom.name.trim(),
      price,
      description: newRoom.description.trim(),
      active: true,
      icon: newRoom.icon || '🏠',
    });
    onToast({ message: `"${newRoom.name}" added`, type: 'success' });
    setNewRoom({ name: '', price: '', description: '', icon: '🏠' });
    setShowAddForm(false);
  };

  const handleToggle = (room: ExtraRoomRecord) => {
    pricingStore.updateExtraRoom(room.id, { active: !room.active });
    onToast({ message: `"${room.name}" ${!room.active ? 'enabled' : 'disabled'}`, type: 'success' });
  };

  const handleDelete = (room: ExtraRoomRecord) => {
    pricingStore.deleteExtraRoom(room.id);
    onToast({ message: `"${room.name}" removed`, type: 'success' });
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <SectionHeader
        icon={<LayoutGrid className="h-4 w-4" />}
        title="Extra Rooms Pricing"
        subtitle={`${rooms.filter((r) => r.active !== false).length} of ${rooms.length} rooms active · per-room add-on pricing`}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        action={
          expanded ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddForm(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Room</span>
            </button>
          ) : undefined
        }
      />
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-5 py-4">
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5">
                <LayoutGrid className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-purple-500" />
                <p className="text-[11px] font-medium text-purple-700">
                  Extra rooms are optional add-ons customers can select when booking. Each selected room&apos;s price is added to
                  the booking total.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {rooms.map((room) => {
                  const isEditing = editing?.id === room.id;
                  return (
                    <motion.div
                      key={room.id}
                      layout
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3.5 transition-all',
                        !room.active && 'opacity-50',
                        isEditing ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      )}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editing.icon}
                          onChange={(e) => setEditing((prev) => prev && { ...prev, icon: e.target.value })}
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-indigo-300 text-center text-xl outline-none"
                          maxLength={2}
                        />
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl shadow-sm">
                          {room.icon}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editing.name}
                              onChange={(e) => setEditing((prev) => prev && { ...prev, name: e.target.value })}
                              className="mb-1 w-full rounded-lg border border-indigo-300 px-2 py-1 text-sm font-bold text-gray-900 outline-none"
                            />
                            <input
                              type="text"
                              value={editing.description}
                              onChange={(e) => setEditing((prev) => prev && { ...prev, description: e.target.value })}
                              className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 outline-none"
                              placeholder="Description"
                            />
                          </>
                        ) : (
                          <>
                            <p className="truncate text-sm font-semibold text-gray-900">{room.name}</p>
                            <p className="mt-0.5 truncate text-xs text-gray-400">{room.description}</p>
                          </>
                        )}
                        <div className="mt-1.5">
                          {isEditing ? (
                            <PriceInput
                              value={editing.price}
                              onChange={(v) => setEditing((prev) => prev && { ...prev, price: v })}
                              className="h-7"
                            />
                          ) : (
                            <span className="text-sm font-extrabold text-gray-900">{formatZAR(room.price)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-col gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={handleSave}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setEditing({
                                  id: room.id,
                                  name: room.name,
                                  price: String(room.price),
                                  description: room.description ?? '',
                                  icon: room.icon,
                                })
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-200 text-gray-500 transition-colors hover:bg-indigo-100 hover:text-indigo-600"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggle(room)}
                              className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-lg transition-colors',
                                room.active
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                  : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                              )}
                            >
                              {room.active ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(room)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-200 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="flex flex-col gap-2.5 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/30 p-3.5"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newRoom.icon}
                          onChange={(e) => setNewRoom((p) => ({ ...p, icon: e.target.value }))}
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 text-center text-xl outline-none"
                          maxLength={2}
                          placeholder="🏠"
                        />
                        <input
                          type="text"
                          value={newRoom.name}
                          onChange={(e) => setNewRoom((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Room name"
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                      </div>
                      <input
                        type="text"
                        value={newRoom.description}
                        onChange={(e) => setNewRoom((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Description (optional)"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-400">R</span>
                        <input
                          type="number"
                          min="0"
                          value={newRoom.price}
                          onChange={(e) => setNewRoom((p) => ({ ...p, price: e.target.value }))}
                          placeholder="Price"
                          className="flex-1 rounded-xl border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAdd}
                          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Add Room</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const BEDROOM_OPTIONS = [
  { value: '1', label: '1 Bed' },
  { value: '2', label: '2 Beds' },
  { value: '3', label: '3 Beds' },
  { value: '4', label: '4 Beds' },
  { value: '5', label: '5 Beds' },
  { value: '6', label: '6+ Beds' },
];

const BATHROOM_OPTIONS = [
  { value: '1', label: '1 Bath' },
  { value: '2', label: '2 Baths' },
  { value: '3', label: '3 Baths' },
  { value: '4', label: '4+ Baths' },
];

export const PriceCalculator = () => {
  const [services, setServices] = useState(() => pricingStore.getData().services);
  const [rules, setRules] = useState(() => pricingStore.getData().rules);
  const [bathroomRules, setBathroomRules] = useState(() => pricingStore.getData().bathroomRules);
  const [extras, setExtras] = useState(() => pricingStore.getData().extras);
  const [extraRooms, setExtraRooms] = useState(() => pricingStore.getData().extraRooms);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('1');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedExtraRooms, setSelectedExtraRooms] = useState<string[]>([]);
  const [cleanerCount, setCleanerCount] = useState('1');
  const [useTeam, setUseTeam] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    return pricingStore.subscribe(() => {
      const d = pricingStore.getData();
      setServices(d.services);
      setRules(d.rules);
      setBathroomRules(d.bathroomRules);
      setExtras(d.extras);
      setExtraRooms(d.extraRooms);
    });
  }, []);

  const total = pricingStore.calculateTotal({
    serviceId,
    bedrooms,
    bathrooms,
    extraIds: selectedExtras,
    extraRoomIds: selectedExtraRooms,
    cleanerCount: parseInt(cleanerCount, 10) || 1,
    useTeam,
  });

  const selectedSvc = services.find((s) => s.id === serviceId);
  const selectedRules = rules.filter((r) => r.serviceId === serviceId);
  const baseRule = selectedRules.find((r) => r.label.trim().toLowerCase() === 'base');
  const perBedroomRule = selectedRules.find((r) => r.label.trim().toLowerCase() === 'per bedroom');
  const perBathroomRule = selectedRules.find((r) => r.label.trim().toLowerCase() === 'per bathroom');
  const bedroomNum = Math.max(1, parseInt(bedrooms, 10) || 1);
  const bathroomNum = Math.max(1, parseInt(bathrooms, 10) || 1);
  const baseLine = baseRule?.price ?? selectedSvc?.basePrice ?? 0;
  const bedroomsLine = perBedroomRule ? Math.max(0, bedroomNum - 1) * perBedroomRule.price : 0;
  const bathroomsLine = perBathroomRule
    ? Math.max(0, bathroomNum - 1) * perBathroomRule.price
    : (() => {
        const sorted = bathroomRules
          .filter((b) => b.active)
          .sort((a, b) => (parseInt(a.label, 10) || 0) - (parseInt(b.label, 10) || 0));
        let matched = sorted[sorted.length - 1];
        for (const rule of sorted) {
          const n = parseInt(rule.label, 10) || 0;
          if (bathroomNum <= n) {
            matched = rule;
            break;
          }
        }
        return matched?.price ?? 0;
      })();
  const activeExtras = extras.filter((e) => e.active !== false);
  const activeExtraRooms = extraRooms.filter((r) => r.active !== false);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <SectionHeader
        icon={<Calculator className="h-4 w-4" />}
        title="Live Price Calculator"
        subtitle="Preview what a booking would cost with current pricing"
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 p-5">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-gray-700">
                      <span>Service</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {services
                        .filter((s) => s.active !== false)
                        .map((svc) => (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => setServiceId(svc.id)}
                            className={cn(
                              'rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all',
                              serviceId === svc.id
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            )}
                          >
                            {svc.name}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-gray-700">
                      <span>Bedrooms</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {BEDROOM_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBedrooms(opt.value)}
                          className={cn(
                            'rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all',
                            bedrooms === opt.value
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-gray-700">
                      <span>Bathrooms</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {BATHROOM_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBathrooms(opt.value)}
                          className={cn(
                            'rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all',
                            bathrooms === opt.value
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeExtraRooms.length > 0 && (
                    <div>
                      <label className="mb-2 block text-xs font-bold text-gray-700">
                        <span>Extra Rooms</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {activeExtraRooms.map((room) => {
                          const isSelected = selectedExtraRooms.includes(room.id);
                          return (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() =>
                                setSelectedExtraRooms((prev) =>
                                  isSelected ? prev.filter((id) => id !== room.id) : [...prev, room.id]
                                )
                              }
                              className={cn(
                                'flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-xs font-semibold transition-all',
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
                              )}
                            >
                              <span>{room.icon}</span>
                              <span>{room.name}</span>
                              <span className="font-bold">+{formatZAR(room.price)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-xs font-bold text-gray-700">
                      <span>Add Extras</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {activeExtras.map((extra) => {
                        const isSelected = selectedExtras.includes(extra.id);
                        return (
                          <button
                            key={extra.id}
                            type="button"
                            onClick={() =>
                              setSelectedExtras((prev) =>
                                isSelected ? prev.filter((id) => id !== extra.id) : [...prev, extra.id]
                              )
                            }
                            className={cn(
                              'flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-xs font-semibold transition-all',
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            )}
                          >
                            <span>{extra.icon}</span>
                            <span>{extra.name}</span>
                            <span className="font-bold">+{formatZAR(extra.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-gray-700">
                        <span>Cleaners</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCleanerCount((v) => String(Math.max(1, parseInt(v, 10) - 1)))}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 font-bold text-gray-600 transition-colors hover:bg-gray-200"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-extrabold text-gray-900">{cleanerCount}</span>
                        <button
                          type="button"
                          onClick={() => setCleanerCount((v) => String(parseInt(v, 10) + 1))}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 font-bold text-gray-600 transition-colors hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold text-gray-700">
                        <span>Team Rate</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setUseTeam((v) => !v)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all',
                          useTeam
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-500'
                        )}
                      >
                        {useTeam ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        <span>Apply team pricing</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-5 text-center text-white">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-200">Estimated Total</p>
                    <motion.p
                      key={total}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-3xl font-extrabold tracking-tight"
                    >
                      {formatZAR(total)}
                    </motion.p>
                    <p className="mt-2 text-xs text-indigo-300">Based on current pricing database</p>
                  </div>
                  <div className="space-y-2 rounded-xl bg-gray-50 p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Breakdown</p>
                    {selectedSvc && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{selectedSvc.name}</span>
                        <span className="text-xs font-bold text-gray-900">{formatZAR(baseLine)}</span>
                      </div>
                    )}
                    {bedroomsLine > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Bedrooms</span>
                        <span className="text-xs font-bold text-gray-900">+{formatZAR(bedroomsLine)}</span>
                      </div>
                    )}
                    {bathroomsLine > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Bathrooms</span>
                        <span className="text-xs font-bold text-gray-900">+{formatZAR(bathroomsLine)}</span>
                      </div>
                    )}
                    {selectedExtraRooms.map((rid) => {
                      const rm = extraRooms.find((r) => r.id === rid);
                      if (!rm) return null;
                      return (
                        <div key={rid} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            <span>{rm.icon}</span>
                            <span className="ml-1">{rm.name}</span>
                          </span>
                          <span className="text-xs font-bold text-gray-900">+{formatZAR(rm.price)}</span>
                        </div>
                      );
                    })}
                    {selectedExtras.map((eid) => {
                      const ex = extras.find((e) => e.id === eid);
                      if (!ex) return null;
                      return (
                        <div key={eid} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            <span>{ex.icon}</span>
                            <span className="ml-1">{ex.name}</span>
                          </span>
                          <span className="text-xs font-bold text-gray-900">+{formatZAR(ex.price)}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                      <span className="text-xs font-bold text-gray-700">Total</span>
                      <span className="text-sm font-extrabold text-indigo-600">{formatZAR(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
