'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface EquipmentOptionProps {
  provideEquipment: boolean;
  onProvideEquipmentChange: (value: boolean) => void;
  equipmentItems?: string[];
  equipmentCharge?: number;
}

export function EquipmentOption({
  provideEquipment,
  onProvideEquipmentChange,
  equipmentItems = [],
  equipmentCharge = 500,
}: EquipmentOptionProps) {
  const handleValueChange = (value: string) => {
    onProvideEquipmentChange(value === 'yes');
  };

  return (
    <section aria-labelledby="equipment-option" className="space-y-4">
      <div>
        <h3 id="equipment-option" className="text-base font-semibold text-slate-900 mb-3">
          Cleaning Equipment & Supplies
        </h3>
        <Label className="text-sm text-gray-700 mb-4 block">
          Do you want us to provide cleaning equipment/supplies?
        </Label>
        <RadioGroup
          value={provideEquipment ? 'yes' : 'no'}
          onValueChange={handleValueChange}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="provide-equipment-yes" />
            <Label htmlFor="provide-equipment-yes" className="text-sm font-normal cursor-pointer">
              Yes
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="provide-equipment-no" />
            <Label htmlFor="provide-equipment-no" className="text-sm font-normal cursor-pointer">
              No
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Show equipment list when Yes is selected */}
      {provideEquipment && equipmentItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 mb-1">
                Equipment & Supplies Included (R{equipmentCharge.toFixed(2)})
              </p>
              <p className="text-xs text-slate-600">
                You will receive the following equipment and supplies for your cleaning service:
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {equipmentItems.map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 text-sm text-slate-700"
              >
                <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </section>
  );
}

