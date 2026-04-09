import React from 'react';
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
  const gmv = useCounter(brand?.gmv_val || 0, 1500);
  const { displayedText } = useTypewriter(brand?.prescription || '暂无品牌处方信息', 80);

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
        { name: '声量', max: 100 },
        { name: 'GMV', max: Math.max(1000, brand.gmv_val) },
        { name: '溢价', max: 100 },
        { name: '情绪能量', max: 100 },
        { name: '逻辑强度', max: 100 },
        { name: '智性指数', max: 100 }
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
            Math.random() * 100, 
            brand.gmv_val, 
            Math.abs(brand.premium_rate), 
            Math.random() * 100, 
            Math.random() * 100, 
            Math.random() * 100
          ],
          name: brand.brand_name,
          itemStyle: { color: colors.terracotta },
          areaStyle: { color: 'rgba(201, 100, 66, 0.2)' }
        }
      ]
    }]
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-near-black/40 backdrop-blur-sm p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="bg-ivory rounded-[16px] shadow-[0px_4px_24px_rgba(0,0,0,0.05)] border border-border-cream w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar flex flex-col"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-ivory/90 backdrop-blur-md px-8 py-6 border-b border-border-cream flex justify-between items-center z-10">
            <h2 className="text-[36px] leading-[1.30] font-serif font-medium text-near-black">{brand.brand_name}</h2>
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
                  {gmv.toFixed(1)} <span className="text-[25px]">亿</span>
                </div>
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
                <h3 className="text-[25px] leading-[1.20] font-serif font-medium text-near-black mb-4">诊断与处方</h3>
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
                <div className="flex flex-wrap gap-3">
                  <span className="px-[12px] py-[4px] bg-near-black text-ivory rounded-[24px] text-[14px] font-sans">
                    {brand.section}
                  </span>
                  <span className="px-[12px] py-[4px] bg-terracotta text-ivory rounded-[24px] text-[14px] font-sans">
                    {brand.motivation}
                  </span>
                  {brand.cross_motivations?.map((m, i) => (
                    <span key={i} className="px-[12px] py-[4px] bg-warm-sand text-charcoal-warm rounded-[24px] text-[14px] font-sans">
                      {m}
                    </span>
                  ))}
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
    </AnimatePresence>
  );
};
