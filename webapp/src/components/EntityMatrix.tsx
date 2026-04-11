'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { BrandModal } from './BrandModal';
import { Brand } from '../types';

const SECTIONS = ['智性决策', '情绪补偿', '身份叙事'];
const ROLES = ['巨头', '黑马', '卷王', 'NPC'];

// Custom Dropdown Component
const CustomDropdown = ({ 
  value, 
  options, 
  onChange, 
  placeholder,
  width = "w-[140px]"
}: { 
  value: string | null; 
  options: string[]; 
  onChange: (val: string | null) => void; 
  placeholder: string;
  width?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${width} z-50`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-ivory border border-border-cream hover:border-warm-sand hover:bg-warm-sand/20 rounded-lg px-4 py-2 text-[14px] text-near-black shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-terracotta"
      >
        <span className="truncate pr-2">{value || placeholder}</span>
        <svg className={`w-4 h-4 text-stone-gray transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-full bg-ivory border border-border-cream rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.08)] z-50 overflow-hidden"
          >
            <div className="max-h-[240px] overflow-y-auto no-scrollbar">
              <button
                className={`w-full text-left px-4 py-2.5 text-[14px] transition-colors ${!value ? 'bg-warm-sand text-terracotta font-medium' : 'text-olive-gray hover:bg-warm-sand/50'}`}
                onClick={() => { onChange(null); setIsOpen(false); }}
              >
                {placeholder}
              </button>
              {options.map(opt => (
                <button
                  key={opt}
                  className={`w-full text-left px-4 py-2.5 text-[14px] transition-colors ${value === opt ? 'bg-warm-sand text-terracotta font-medium' : 'text-near-black hover:bg-warm-sand/50'}`}
                  onClick={() => { onChange(opt); setIsOpen(false); }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const EntityMatrix = () => {
  const filteredBrands = useStore((state) => state.filteredBrands);
  const activeSection = useStore((state) => state.activeSection);
  const setActiveSection = useStore((state) => state.setActiveSection);
  const activeMotivation = useStore((state) => state.activeMotivation);
  const setActiveMotivation = useStore((state) => state.setActiveMotivation);
  const activeRole = useStore((state) => state.activeRole);
  const setActiveRole = useStore((state) => state.setActiveRole);
  const searchQuery = useStore((state) => state.searchQuery);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  const sortConfig = useStore((state) => state.sortConfig);
  const setSortConfig = useStore((state) => state.setSortConfig);

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const loaderRef = useRef<HTMLDivElement>(null);

  const definedMotivations: Record<string, string[]> = {
    '智性决策': ['科技平权', '信息平权', '秩序与掌控感', '生产力与效率', '舒适感'],
    '情绪补偿': ['多巴胺', '玄学叙事', '精致美学', '悦己主义', 'Gap', '懒人经济', '孤独焦虑', '创造探索'],
    '身份叙事': ['Lifestyle', '圈层共振', '社交货币', '小众DIY', '文化根脉']
  };

  const handleClear = () => {
    setSearchQuery('');
    setActiveSection(null);
    setActiveMotivation(null);
    setActiveRole(null);
    setSortConfig({ key: 'default', direction: 'desc' });
  };

  const handleSortClick = (key: 'gmv_val' | 'brand_growth' | 'premium_rate') => {
    if (sortConfig.key === key) {
      setSortConfig({ key, direction: sortConfig.direction === 'desc' ? 'asc' : 'desc' });
    } else {
      setSortConfig({ key, direction: 'desc' }); // default to desc when switching keys
    }
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return (
      <svg
        className={`w-3.5 h-3.5 ml-1.5 text-current transition-transform duration-300 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

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

  // 重置 visibleCount 当过滤条件或排序改变时
  useEffect(() => {
    setVisibleCount(20);
  }, [filteredBrands]);

  const visibleBrands = filteredBrands.slice(0, visibleCount);

  return (
    <div className="h-full flex flex-col overflow-hidden relative bg-parchment">
      {/* 顶部常驻筛选器 */}
      <div className="sticky top-0 z-40 bg-parchment/90 backdrop-blur-md p-8 pb-4 border-b border-border-cream flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[32px] leading-[1.10] font-serif font-medium text-near-black">品牌主体</h2>
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
        
        {/* 排序与搜索筛选条 */}
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between text-[14px] text-olive-gray font-sans pt-2">
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="flex-1 min-w-[200px] max-w-[320px]">
              <input 
                type="text" 
                placeholder="搜索品牌中英文名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-ivory border border-border-cream rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-terracotta text-near-black placeholder:text-stone-gray shadow-sm transition-shadow"
              />
            </div>
            
            {activeSection && (
              <CustomDropdown
                value={activeMotivation}
                options={definedMotivations[activeSection] || []}
                onChange={setActiveMotivation}
                placeholder="所有动机"
                width="w-[140px]"
              />
            )}
            
            <CustomDropdown
              value={activeRole}
              options={ROLES}
              onChange={setActiveRole}
              placeholder="所有地位"
              width="w-[120px]"
            />
            
            <button 
              onClick={handleClear} 
              className="flex items-center justify-center p-2 rounded-lg transition-all duration-200 text-stone-gray hover:text-terracotta hover:bg-warm-sand/50 shadow-sm border border-transparent hover:border-border-cream bg-ivory"
              title="清空所有过滤条件"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="flex items-center shrink-0 gap-3 overflow-x-auto no-scrollbar w-full xl:w-auto pb-2 xl:pb-0">
            <span className="mr-1 text-stone-gray text-[14px] font-medium whitespace-nowrap">排序:</span>
            
            <button onClick={() => handleSortClick('gmv_val')} className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm whitespace-nowrap ${sortConfig.key === 'gmv_val' ? 'bg-near-black text-ivory' : 'bg-ivory hover:bg-warm-sand border border-border-cream text-olive-gray'}`}>
              GMV {renderSortIcon('gmv_val')}
            </button>
            <button onClick={() => handleSortClick('brand_growth')} className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm whitespace-nowrap ${sortConfig.key === 'brand_growth' ? 'bg-near-black text-ivory' : 'bg-ivory hover:bg-warm-sand border border-border-cream text-olive-gray'}`}>
              CAGR {renderSortIcon('brand_growth')}
            </button>
            <button onClick={() => handleSortClick('premium_rate')} className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm whitespace-nowrap ${sortConfig.key === 'premium_rate' ? 'bg-near-black text-ivory' : 'bg-ivory hover:bg-warm-sand border border-border-cream text-olive-gray'}`}>
              溢价率 {renderSortIcon('premium_rate')}
            </button>
          </div>
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
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.25, 
                    ease: "easeOut"
                  }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="cursor-pointer bg-ivory border border-border-cream rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-warm-sand flex flex-col justify-between group"
                  onClick={() => setSelectedBrand(brand)}
                >
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col pr-2">
                        <h3 className="text-[20px] leading-[1.20] font-serif font-bold text-near-black truncate group-hover:text-terracotta transition-colors">
                          {brand.brand_name_zh}
                        </h3>
                        {brand.brand_name_en && (
                          <span className="text-[12px] font-sans text-stone-gray mt-0.5 truncate">
                            {brand.brand_name_en}
                          </span>
                        )}
                      </div>
                      
                      {brand.role && (
                        <span className={`shrink-0 px-2.5 py-1 text-[11px] rounded-full font-sans font-bold whitespace-nowrap tracking-wide shadow-sm ${
                          brand.role === '巨头' ? 'bg-coral text-ivory' :
                          brand.role === '黑马' ? 'bg-near-black text-ivory' :
                          brand.role === '卷王' ? 'bg-olive-gray text-ivory' :
                          'bg-warm-sand text-stone-gray'
                        }`}>
                          {brand.role}
                        </span>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 mb-5">
                      <div className="inline-block px-[8px] py-[2px] bg-parchment border border-warm-sand text-olive-gray rounded-[6px] text-[11px] font-sans tracking-[0.2px] mb-3">
                        {brand.section}
                      </div>
                      <p className="text-[13px] text-olive-gray font-sans leading-[1.50] line-clamp-2 bg-warm-sand/30 p-2.5 rounded-lg border border-warm-sand/50">
                        {brand.core_product}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-end pt-4 border-t border-border-cream/80 mt-auto">
                      <div>
                        <span className="text-[11px] tracking-[0.5px] uppercase text-stone-gray block mb-1 font-semibold">GMV</span>
                        <span className="font-mono text-[16px] font-medium text-near-black">{brand.gmv_val > 0 ? `${brand.gmv_val.toFixed(1)}亿` : 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] tracking-[0.5px] uppercase text-stone-gray block mb-1 font-semibold">Growth</span>
                        <span className={`font-mono text-[16px] font-medium ${brand.brand_growth > 0 ? 'text-terracotta' : 'text-olive-gray'}`}>
                          {brand.brand_growth > 0 ? '+' : ''}{brand.brand_growth}%
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
      <AnimatePresence>
        {selectedBrand && (
          <BrandModal brand={selectedBrand} onClose={() => setSelectedBrand(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
