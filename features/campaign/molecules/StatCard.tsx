'use client';

import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  delay: number;
  key?: React.Key;
}

export const StatCard = ({ icon: Icon, value, label, delay }: StatCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-stone-100 shadow-sm"
  >
    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
      <Icon size={24} />
    </div>
    <div className="text-3xl font-bold text-stone-900">{value}</div>
    <div className="text-stone-500 font-medium mt-1 uppercase tracking-wider text-xs">{label}</div>
  </motion.div>
);
