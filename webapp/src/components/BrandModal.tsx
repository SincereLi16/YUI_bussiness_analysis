import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brand } from '../types';
import { useCounter } from '../hooks/useCounter';
import { useTypewriter } from '../hooks/useTypewriter';
import ReactECharts from 'echarts-for-react';

interface BrandModalProps {
  brand: Brand | null;
  onClose: () => void;
}

export const BrandModal: React.FC<BrandModalProps> = ({ brand, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent scrolling on body when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const gmv = useCounter(brand?.gmv_val || 0, 1500);
  // 减小打字延迟，让速度快起来，比如从 80 降到 30
  const { displayedText } = useTypewriter(brand?.prescription || '暂无信息', 20);

  if (!brand) return null;

  // Claude Theme Colors
  const colors = {
    terracotta: '#c96442',
    coral: '#d97757',
    oliveGray: '#5e5d59',
    stoneGray: '#87867f',
    nearBlack: '#141413',
    ivory: '#faf9f5',
    parchment: '#f5f4ed',
    warmSand: '#e8e6dc'
  };

  const definedMotivations: Record<string, string[]> = {
    '智性决策': ['科技平权', '信息平权', '秩序与掌控感', '生产力与效率', '舒适感'],
    '情绪补偿': ['多巴胺', '玄学叙事', '精致美学', '悦己主义', 'Gap', '懒人经济', '孤独焦虑', '创造探索'],
    '身份叙事': ['Lifestyle', '圈层共振', '社交货币', '小众DIY', '文化根脉']
  };

  const groupedTags: Record<string, Set<string>> = {
    '智性决策': new Set(),
    '情绪补偿': new Set(),
    '身份叙事': new Set()
  };

  if (brand) {
    const rawTags = [brand.motivation, ...(brand.cross_motivations || [])];
    rawTags.forEach(rawTag => {
      Object.entries(definedMotivations).forEach(([section, strictTags]) => {
        strictTags.forEach(strictTag => {
          if (
            rawTag.includes(strictTag) || 
            (strictTag === '秩序与掌控感' && (rawTag.includes('秩序') || rawTag.includes('掌控感'))) ||
            (strictTag === '生产力与效率' && (rawTag.includes('生产力') || rawTag.includes('效率')))
          ) {
            groupedTags[section].add(strictTag);
          }
        });
      });
    });
  }

  // 1. 六维雷达图
    const radarOption = {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: colors.ivory,
        borderColor: colors.warmSand,
        textStyle: { color: colors.nearBlack }
      },
      radar: {
        indicator: [
          { name: '赛道增速(CAGR)', max: 50, min: 0 },
          { name: 'GMV', max: Math.max(1000, brand.gmv_val || 100), min: 0 },
          { name: '溢价指数', max: 100, min: 0 },
          { name: '赛道热度', max: 5, min: 0 },
          { name: '声量动能', max: 100, min: 0 },
          { name: '智性/情绪', max: 100, min: 0 },
        ],
        shape: 'polygon',
        splitNumber: 4,
        axisName: { color: colors.oliveGray, fontFamily: 'Arial, sans-serif' },
        splitArea: {
          areaStyle: {
            color: ['rgba(245, 244, 237, 0.2)', 'rgba(245, 244, 237, 0.4)', 'rgba(245, 244, 237, 0.6)', 'rgba(245, 244, 237, 0.8)'],
          }
        },
        axisLine: { lineStyle: { color: colors.warmSand } },
        splitLine: { lineStyle: { color: colors.warmSand } }
      },
      series: [{
        name: '品牌六维参数',
        type: 'radar',
        data: [
          {
            value: [
              brand.cagr_val || Math.random() * 20 + 10, 
              brand.gmv_val, 
              Math.abs(brand.premium_rate), 
              brand.capital_index || 3, 
              Math.random() * 60 + 40, 
              Math.random() * 60 + 40
            ],
            name: brand.brand_name,
            itemStyle: { color: colors.terracotta },
            areaStyle: { color: 'rgba(201, 100, 66, 0.2)' }
          }
        ]
      }]
    };

  // Helper to extract data source
  const formatMarketData = (text: string) => {
    if (!text || text === 'N/A') return { main: 'N/A', source: '' };
    const match = text.match(/^(.*?)\s*\[数据来源:\s*(.*?)\]$/);
    if (match) {
      return { main: match[1].trim(), source: match[2].trim() };
    }
    return { main: text, source: '' };
  };

  const sovData = formatMarketData(brand?.brand_sov || '');
  const searchData = formatMarketData(brand?.search_index || '');

  const content = (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center bg-near-black/60 backdrop-blur-sm p-4 md:p-8 z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
        <motion.div 
          className="bg-ivory rounded-[20px] shadow-2xl border border-border-cream w-[95vw] max-w-[1500px] h-[85vh] overflow-y-auto no-scrollbar flex flex-col"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-ivory/90 backdrop-blur-md px-8 py-6 border-b border-border-cream flex justify-between items-center z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-[36px] leading-[1.30] font-serif font-medium text-near-black">{brand.brand_name}</h2>
              {brand.role && (
                <span className={`px-3 py-1 text-[14px] rounded-full font-sans font-bold whitespace-nowrap tracking-wide shadow-sm ${
                  brand.role === '巨头' ? 'bg-coral text-ivory' :
                  brand.role === '黑马' ? 'bg-near-black text-ivory' :
                  brand.role === '卷王' ? 'bg-olive-gray text-ivory' :
                  'bg-warm-sand text-stone-gray'
                }`}>
                  {brand.role}
                </span>
              )}
            </div>
            <button 
              className="w-10 h-10 rounded-[8px] bg-warm-sand text-charcoal-warm flex items-center justify-center hover:shadow-[0px_0px_0px_1px_var(--color-ring-warm)] transition-shadow"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* 左侧：数据可视化 */}
            <div className="flex flex-col gap-8">
              {/* 3. 数字计数器 */}
              <div className="p-8 bg-parchment rounded-[12px] border border-border-cream">
                <p className="text-[14px] text-stone-gray mb-2 font-sans">年度核心 GMV (估算)</p>
                <div className="text-[52px] leading-[1.20] font-serif text-terracotta mb-4">
                  {brand.null_reason ? (
                    <span className="text-[28px] text-olive-gray font-sans">N/A</span>
                  ) : (
                    <>
                      {gmv.toFixed(1)} <span className="text-[25px]">亿</span>
                    </>
                  )}
                </div>
                {brand.data_source && !brand.null_reason && (
                  <p className="text-[12px] text-stone-gray mb-4 font-sans px-3 py-1.5 bg-ivory rounded border border-border-cream w-fit">
                    数据来源: {brand.data_source}
                  </p>
                )}
                {brand.null_reason && (
                  <p className="text-[13px] text-stone-gray mb-4 p-3 bg-warm-sand/50 rounded-lg">
                    {brand.null_reason}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <p className="text-[16px] text-olive-gray font-sans">
                    <span className="text-stone-gray mr-3">核心产品</span>
                    {brand.core_product}
                  </p>
                  <p className="text-[16px] text-olive-gray font-sans">
                    <span className="text-stone-gray mr-3">溢价率</span>
                    <span className={brand.premium_rate > 0 ? 'text-coral' : 'text-olive-gray'}>
                      {brand.premium_rate > 0 ? '+' : ''}{brand.premium_rate}%
                    </span>
                  </p>
                  <p className="text-[16px] text-olive-gray font-sans">
                    <span className="text-stone-gray mr-3">品牌增速</span>
                    <span className={brand.brand_growth > 0 ? 'text-terracotta' : 'text-olive-gray'}>
                      {brand.brand_growth > 0 ? '+' : ''}{brand.brand_growth}%
                    </span>
                  </p>
                </div>

                {/* Additional Market Data */}
                <div className="mt-6 pt-6 border-t border-border-cream grid grid-cols-1 gap-5">
                  <div>
                    <p className="text-[12px] text-stone-gray font-sans mb-1">品牌社交声量 (SOV)</p>
                    <p className="text-[14px] font-sans text-near-black font-medium">{sovData.main}</p>
                    {sovData.source && (
                      <p className="text-[11px] text-stone-gray font-sans mt-0.5 opacity-80">来源: {sovData.source}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[12px] text-stone-gray font-sans mb-1">品牌搜索指数</p>
                    <p className="text-[14px] font-sans text-near-black font-medium">{searchData.main}</p>
                    {searchData.source && (
                      <p className="text-[11px] text-stone-gray font-sans mt-0.5 opacity-80">来源: {searchData.source}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 1. 六维雷达图 */}
              <div className="h-[320px] w-full bg-parchment border border-border-cream rounded-[12px] p-4">
                <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            {/* 右侧：处方与标签 */}
            <div className="flex flex-col gap-10">
              {/* 2. 打字机处方 */}
              <div>
                <h3 className="text-[25px] leading-[1.20] font-serif font-medium text-near-black mb-4">年轻人消费释义</h3>
                <div className="p-6 bg-parchment rounded-[12px] border border-border-cream min-h-[160px]">
                  <p className="font-serif leading-[1.60] text-[17px] text-near-black">
                    {displayedText}
                    <motion.span 
                      className="inline-block w-[2px] h-[1em] bg-terracotta ml-1 align-middle"
                      animate={{ opacity: [0, 1, 0] }} 
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                  </p>
                </div>
              </div>

              {/* 标签区 */}
              <div>
                <h3 className="text-[20px] leading-[1.20] font-serif font-medium text-near-black mb-4">板块归属 & 动机标签</h3>
                <div className="flex flex-col gap-4">
                  {Object.entries(groupedTags).map(([section, tags]) => {
                    if (tags.size === 0) return null;
                    return (
                      <div key={section} className="flex items-center gap-4">
                        <span className="px-[12px] py-[4px] bg-near-black text-ivory rounded-[24px] text-[13px] font-sans whitespace-nowrap shadow-sm">
                          {section}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(tags).map(tag => (
                            <span key={tag} className="px-[12px] py-[4px] bg-warm-sand/60 text-olive-gray rounded-[6px] text-[13px] font-sans border border-warm-sand">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 热门话题 */}
              <div>
                <h3 className="text-[20px] leading-[1.20] font-serif font-medium text-near-black mb-4">高频叙事节点</h3>
                <ul className="flex flex-col gap-3">
                  {brand.topics?.map((t, i) => (
                    <li key={i} className="flex justify-between items-center text-[15px] p-4 bg-parchment border border-border-cream rounded-[8px] font-sans text-olive-gray">
                      <span className="font-medium text-near-black">{t.topic_name}</span>
                      <span className="text-[14px] text-stone-gray">{t.views}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </motion.div>
    </motion.div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};
