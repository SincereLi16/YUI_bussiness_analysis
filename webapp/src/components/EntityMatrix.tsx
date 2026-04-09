'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { BrandModal } from './BrandModal';
import { Brand } from '../types';

const SECTIONS = ['智性决策', '情绪补偿', '身份叙事'];

export const EntityMatrix = () => {
  const filteredBrands = useStore((state) => state.filteredBrands);
  const activeSection = useStore((state) => state.activeSection);
  const setActiveSection = useStore((state) => state.setActiveSection);

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const loaderRef = useRef<HTMLDivElement>(null);

  // 1. 无限滚动懒加载 (IntersectionObserver)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredBrands.length) {
          setVisibleCount((prev) => prev + 20);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => observer.disconnect();
  }, [filteredBrands, visibleCount]);

  // 重置 visibleCount 当过滤条件改变时
  useEffect(() => {
    setVisibleCount(20);
  }, [filteredBrands, activeSection]);

  const visibleBrands = filteredBrands.slice(0, visibleCount);

  return (
    <div className="h-full flex flex-col overflow-hidden relative bg-parchment">
      {/* 顶部常驻筛选器 */}
      <div className="sticky top-0 z-10 bg-parchment/90 backdrop-blur-md p-6 border-b border-border-cream flex items-center justify-between">
        <h2 className="text-[32px] leading-[1.10] font-serif font-medium text-near-black">Entity Matrix</h2>
        <div className="flex gap-3">
          <button 
            className={`px-[16px] py-[8px] rounded-[12px] text-[16px] transition-all duration-200 font-sans ${
              !activeSection 
                ? 'bg-near-black text-ivory shadow-[0px_0px_0px_1px_var(--color-dark-surface)]' 
                : 'bg-warm-sand text-charcoal-warm hover:shadow-[0px_0px_0px_1px_var(--color-ring-warm)]'
            }`}
            onClick={() => setActiveSection(null)}
          >
            全景视角
          </button>
          {SECTIONS.map(sec => (
            <button 
              key={sec} 
              className={`px-[16px] py-[8px] rounded-[12px] text-[16px] transition-all duration-200 font-sans ${
                sec === activeSection 
                  ? 'bg-near-black text-ivory shadow-[0px_0px_0px_1px_var(--color-dark-surface)]' 
                  : 'bg-warm-sand text-charcoal-warm hover:shadow-[0px_0px_0px_1px_var(--color-ring-warm)]'
              }`}
              onClick={() => setActiveSection(sec === activeSection ? null : sec)}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* 无限滚动卡片墙 */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {visibleBrands.map((brand, index) => {
              return (
                <motion.div
                  key={brand.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index % 20 * 0.05, 
                    ease: [0.34, 1.56, 0.64, 1] 
                  }}
                  whileHover={{ y: -8 }}
                  className="cursor-pointer bg-ivory border border-border-cream rounded-[8px] p-6 transition-shadow duration-300 hover:shadow-[0px_0px_0px_1px_var(--color-ring-warm)] flex flex-col justify-between"
                  onClick={() => setSelectedBrand(brand)}
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[25px] leading-[1.20] font-serif font-medium text-near-black truncate pr-2">
                        {brand.brand_name}
                      </h3>
                      <span className="shrink-0 px-[8px] py-[2px] bg-warm-sand text-olive-gray rounded-[6px] text-[12px] font-sans tracking-[0.12px]">
                        {brand.section}
                      </span>
                    </div>
                    <p className="text-[15px] text-olive-gray font-sans leading-[1.60] mb-6 line-clamp-2">
                      {brand.core_product}
                    </p>
                    
                    <div className="flex justify-between items-end pt-4 border-t border-border-cream">
                      <div>
                        <span className="text-[12px] tracking-[0.12px] text-stone-gray block mb-1">GMV</span>
                        <span className="font-mono text-[15px] text-near-black">{brand.gmv_val.toFixed(1)}亿</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[12px] tracking-[0.12px] text-stone-gray block mb-1">溢价率</span>
                        <span className={`font-mono text-[15px] ${brand.premium_rate > 0 ? 'text-coral' : 'text-olive-gray'}`}>
                          {brand.premium_rate > 0 ? '+' : ''}{brand.premium_rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Loading trigger element */}
        {visibleCount < filteredBrands.length && (
          <div ref={loaderRef} className="h-20 flex items-center justify-center mt-8">
            <div className="w-6 h-6 border-2 border-olive-gray border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* 品牌参数化面板 (Brand Modal) */}
      {selectedBrand && (
        <BrandModal brand={selectedBrand} onClose={() => setSelectedBrand(null)} />
      )}
    </div>
  );
};
