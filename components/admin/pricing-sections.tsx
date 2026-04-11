'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Save,
  X,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  RefreshCw,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  pricingStore,
  type ServiceRecord,
  type PricingRule,
  type ExtraRecord,
  type CleanerPricing,
  type PromoCode,
  type BathroomRule,
  type ExtraRoomRecord,
} from './pricingStore';
import {
  type ToastState,
  formatZAR,
  fadeUp,
  stagger,
  SectionHeader,
  PriceInput,
} from './pricing-shared';

interface EditingService {
  id: string;
  basePrice: string;
  name: string;
  duration: string;
  description: string;
}
interface EditingRule {
  id: string;
  label: string;
  price: string;
  extraPricePerUnit: string;
}
interface EditingExtra {
  id: string;
  name: string;
  price: string;
  icon: string;
}

export const ServicesSection = ({ onToast }: { onToast: (t: ToastState) => void }) => {
  const [services, setServices] = useState<ServiceRecord[]>(pricingStore.getData().services);
  const [editing, setEditing] = useState<EditingService | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  useEffect(() => pricingStore.subscribe(() => setServices(pricingStore.getData().services)), []);

  const startEdit = (svc: ServiceRecord) => {
    setEditing({
      id: svc.id,
      basePrice: String(svc.basePrice),
      name: svc.name,
      duration: svc.duration,
      description: svc.description,
    });
  };
  const saveEdit = () => {
    if (!editing) return;
    const price = parseFloat(editing.basePrice);
    if (isNaN(price) || price < 0) {
      onToast({ message: 'Please enter a valid price (≥ 0)', type: 'error' });
      return;
    }
    setSaving(editing.id);
    setTimeout(() => {
      pricingStore.updateService(editing.id, {
        basePrice: price,
        name: editing.name.trim() || undefined,
        duration: editing.duration.trim() || undefined,
        description: editing.description.trim() || undefined,
      });
      onToast({ message: `"${editing.name}" pricing updated successfully`, type: 'success' });
      setSaving(null);
      setEditing(null);
    }, 600);
  };
  const toggleActive = (svc: ServiceRecord) => {
    pricingStore.updateService(svc.id, { active: !svc.active });
    onToast({ message: `"${svc.name}" ${!svc.active ? 'activated' : 'deactivated'}`, type: 'success' });
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <SectionHeader
        icon={<Sparkles className="h-4 w-4" />}
        title="Services Pricing"
        subtitle={`${services.filter((s) => s.active !== false).length} active services`}
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
            <div className="border-t border-gray-100">
              <div className="hidden grid-cols-[1fr_120px_130px_130px_80px_100px] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-2.5 md:grid">
                {['Service', 'Duration', 'Price Type', 'Base Price', 'Active', 'Actions'].map((h) => (
                  <p key={h} className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                    {h}
                  </p>
                ))}
              </div>
              <div className="divide-y divide-gray-50">
                {services.map((svc) => {
                  const isEditing = editing?.id === svc.id;
                  return (
                    <motion.div
                      key={svc.id}
                      layout
                      className={cn(
                        'px-5 py-4 transition-colors',
                        !svc.active && 'opacity-50',
                        isEditing && 'bg-indigo-50/40'
                      )}
                    >
                      <div className="mb-3 flex items-start gap-3 md:hidden">
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                          style={{ backgroundColor: svc.color }}
                        >
                          {svc.name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editing.name}
                              onChange={(e) =>
                                setEditing((prev) => prev && { ...prev, name: e.target.value })
                              }
                              className="w-full rounded-lg border border-indigo-300 px-2 py-1 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          ) : (
                            <p className="text-sm font-bold text-gray-900">{svc.name}</p>
                          )}
                          <p className="mt-0.5 text-xs text-gray-400">{svc.description}</p>
                        </div>
                      </div>

                      <div className="hidden grid-cols-[1fr_120px_130px_130px_80px_100px] items-center gap-4 md:grid">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white"
                            style={{ backgroundColor: svc.color }}
                          >
                            {svc.name
                              .split(' ')
                              .map((w) => w[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editing.name}
                                onChange={(e) =>
                                  setEditing((prev) => prev && { ...prev, name: e.target.value })
                                }
                                className="w-full truncate rounded-lg border border-indigo-300 px-2 py-1 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
                              />
                            ) : (
                              <p className="truncate text-sm font-semibold text-gray-900">{svc.name}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editing.duration}
                              onChange={(e) =>
                                setEditing((prev) => prev && { ...prev, duration: e.target.value })
                              }
                              className="w-full rounded-lg border border-indigo-300 px-2 py-1.5 text-xs text-gray-600 outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          ) : (
                            <span className="text-xs text-gray-500">{svc.duration}</span>
                          )}
                        </div>
                        <span
                          className={cn(
                            'inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-bold',
                            svc.priceType === 'fixed'
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : svc.priceType === 'per_room'
                                ? 'border-purple-200 bg-purple-50 text-purple-700'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                          )}
                        >
                          {svc.priceType === 'fixed'
                            ? 'Fixed'
                            : svc.priceType === 'per_room'
                              ? 'Per Room'
                              : 'Per Hour'}
                        </span>
                        {isEditing ? (
                          <PriceInput
                            value={editing.basePrice}
                            onChange={(v) => setEditing((prev) => prev && { ...prev, basePrice: v })}
                          />
                        ) : (
                          <p className="text-sm font-extrabold text-gray-900">{formatZAR(svc.basePrice)}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleActive(svc)}
                          className={cn(
                            'flex items-center gap-1 text-[10px] font-bold transition-colors',
                            svc.active ? 'text-green-600' : 'text-gray-400'
                          )}
                          aria-label={`Toggle ${svc.name}`}
                        >
                          {svc.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={saving === svc.id}
                              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-70"
                            >
                              {saving === svc.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(svc)}
                            className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between md:hidden">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold',
                              svc.priceType === 'fixed'
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : svc.priceType === 'per_room'
                                  ? 'border-purple-200 bg-purple-50 text-purple-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-700'
                            )}
                          >
                            {svc.priceType === 'fixed'
                              ? 'Fixed'
                              : svc.priceType === 'per_room'
                                ? 'Per Room'
                                : 'Per Hour'}
                          </span>
                          {isEditing ? (
                            <PriceInput
                              value={editing.basePrice}
                              onChange={(v) => setEditing((prev) => prev && { ...prev, basePrice: v })}
                            />
                          ) : (
                            <p className="text-sm font-extrabold text-gray-900">{formatZAR(svc.basePrice)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleActive(svc)}
                            className={cn(
                              'text-[10px] font-bold transition-colors',
                              svc.active ? 'text-green-600' : 'text-gray-400'
                            )}
                          >
                            {svc.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                          {isEditing ? (
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold text-white"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(svc)}
                              className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-bold text-gray-600"
                            >
                              Edit
                            </button>
                          )}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
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

export const RulesSection = ({ onToast }: { onToast: (t: ToastState) => void }) => {
  const [rules, setRules] = useState<PricingRule[]>(pricingStore.getData().rules);
  const [services, setServices] = useState<ServiceRecord[]>(pricingStore.getData().services);
  const [expanded, setExpanded] = useState(true);
  const perRoomFirst = pricingStore.getData().services.find((s) => s.priceType === 'per_room')?.id ?? 'standard';
  const [activeServiceId, setActiveServiceId] = useState(perRoomFirst);
  const [editing, setEditing] = useState<EditingRule | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({ label: '', price: '', extraPricePerUnit: '' });

  useEffect(
    () =>
      pricingStore.subscribe(() => {
        setRules(pricingStore.getData().rules);
        setServices(pricingStore.getData().services);
      }),
    []
  );

  const ruleServices = services.filter((s) => s.priceType === 'per_room');
  const displayRules = rules.filter((r) => r.serviceId === activeServiceId);

  const handleSaveRule = () => {
    if (!editing) return;
    const price = parseFloat(editing.price);
    if (isNaN(price) || price < 0) {
      onToast({ message: 'Enter a valid price', type: 'error' });
      return;
    }
    pricingStore.updateRule(editing.id, {
      label: editing.label.trim(),
      price,
      extraPricePerUnit: editing.extraPricePerUnit ? parseFloat(editing.extraPricePerUnit) || undefined : undefined,
    });
    onToast({ message: 'Pricing rule updated', type: 'success' });
    setEditing(null);
  };

  const handleAddRule = () => {
    if (!newRule.label.trim() || !newRule.price) {
      onToast({ message: 'Label and price are required', type: 'error' });
      return;
    }
    const price = parseFloat(newRule.price);
    if (isNaN(price) || price < 0) {
      onToast({ message: 'Enter a valid price', type: 'error' });
      return;
    }
    pricingStore.addRule({
      serviceId: activeServiceId,
      label: newRule.label.trim(),
      price,
      extraPricePerUnit: newRule.extraPricePerUnit ? parseFloat(newRule.extraPricePerUnit) || undefined : undefined,
    });
    onToast({ message: 'Pricing rule added', type: 'success' });
    setNewRule({ label: '', price: '', extraPricePerUnit: '' });
    setShowAddForm(false);
  };

  const handleDelete = (id: string, label: string) => {
    pricingStore.deleteRule(id);
    onToast({ message: `Rule "${label}" removed`, type: 'success' });
  };

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <SectionHeader
        icon={<ArrowUpDown className="h-4 w-4" />}
        title="Room-Based Pricing Rules"
        subtitle="Define price brackets by bedroom count per service"
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
              <div className="flex flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3">
                {ruleServices.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => setActiveServiceId(svc.id)}
                    className={cn(
                      'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                      activeServiceId === svc.id
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    )}
                  >
                    {svc.name}
                  </button>
                ))}
              </div>
              <div className="space-y-2 px-5 py-4">
                {displayRules.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">No rules defined for this service. Add one above.</p>
                )}
                {displayRules.map((rule) => {
                  const isEditing = editing?.id === rule.id;
                  return (
                    <div
                      key={rule.id}
                      className={cn(
                        'flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-colors',
                        isEditing ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                          <span className="text-[9px] font-bold text-white">BD</span>
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editing.label}
                            onChange={(e) => setEditing((prev) => prev && { ...prev, label: e.target.value })}
                            className="flex-1 rounded-lg border border-indigo-300 px-2 py-1 text-sm font-semibold text-gray-900 outline-none"
                            placeholder="e.g. 3 Bedrooms"
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
                        ) : (
                          <span className="text-sm font-extrabold text-gray-900">{formatZAR(rule.price)}</span>
                        )}
                        {isEditing && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">+extra/unit:</span>
                            <PriceInput
                              value={editing.extraPricePerUnit}
                              onChange={(v) => setEditing((prev) => prev && { ...prev, extraPricePerUnit: v })}
                              className="w-24"
                            />
                          </div>
                        )}
                        {rule.extraPricePerUnit && !isEditing && (
                          <span className="rounded-lg bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
                            +{formatZAR(rule.extraPricePerUnit)}/extra
                          </span>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        {isEditing ? (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={handleSaveRule}
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
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setEditing({
                                  id: rule.id,
                                  label: rule.label,
                                  price: String(rule.price),
                                  extraPricePerUnit: rule.extraPricePerUnit ? String(rule.extraPricePerUnit) : '',
                                })
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(rule.id, rule.label)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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
                        placeholder="e.g. 5 Bedrooms"
                        className="min-w-[120px] flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-400">R</span>
                        <input
                          type="number"
                          min="0"
                          value={newRule.price}
                          onChange={(e) => setNewRule((p) => ({ ...p, price: e.target.value }))}
                          placeholder="Price"
                          className="w-20 rounded-xl border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">+extra/unit:</span>
                        <input
                          type="number"
                          min="0"
                          value={newRule.extraPricePerUnit}
                          onChange={(e) => setNewRule((p) => ({ ...p, extraPricePerUnit: e.target.value }))}
                          placeholder="Optional"
                          className="w-20 rounded-xl border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={handleAddRule}
                          className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Add</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200"
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

export {
  ExtrasSection,
  CleanerPricingSection,
  PromoCodesSection,
  BathroomsSection,
  ExtraRoomsSection,
  PriceCalculator,
} from './pricing-sections-more';
