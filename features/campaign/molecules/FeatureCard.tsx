'use client';

import React from 'react';
import { motion } from 'motion/react';

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
  key?: React.Key;
}

export const FeatureCard = ({ icon: Icon, title, description, delay }: FeatureCardProps) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="group p-8 bg-white rounded-[2rem] border border-stone-100 hover:border-rose-200 transition-all shadow-sm hover:shadow-xl hover:shadow-rose-500/5"
  >
    <div className="w-14 h-14 bg-stone-50 group-hover:bg-rose-600 text-stone-600 group-hover:text-white rounded-2xl flex items-center justify-center mb-6 transition-colors shadow-inner">
      <Icon className="size-7" />
    </div>
    <h3 className="text-xl font-bold text-stone-900 mb-3">{title}</h3>
    <p className="text-stone-600 leading-relaxed text-sm md:text-base">
      {description}
    </p>
  </motion.div>
);
