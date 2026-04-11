'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useStore } from '../store/useStore';

export const MacroInsightHub = () => {
  const analysisSummary = useStore((state) => state.analysisSummary);
  const macroData = useStore((state) => state.macroData);
  const activeMotivation = useStore((state) => state.activeMotivation);
  const setActiveMotivation = useStore((state) => state.setActiveMotivation);
  const activeSection = useStore((state) => state.activeSection);
  const setActiveSection = useStore((state) => state.setActiveSection);

  const [matrixViewMode, setMatrixViewMode] = React.useState<'bar' | 'quadrant'>('bar');

  // Claude Theme Colors
  const colors = {
    terracotta: '#c96442',
    coral: '#d97757',
    oliveGray: '#5e5d59',
    stoneGray: '#87867f',
    nearBlack: '#141413',
    ivory: '#faf9f5',
    parchment: '#f5f4ed'
  };

  const chartTitleStyle = {
    color: colors.nearBlack,
    fontFamily: 'Georgia, serif',
    fontWeight: 500,
    fontSize: 18,
  };

  // Strict motivation mapping based on user requirements
  const definedMotivations: Record<string, string[]> = {
    '智性决策': ['科技平权', '信息平权', '秩序与掌控感', '生产力与效率', '舒适感'],
    '情绪补偿': ['多巴胺', '玄学叙事', '精致美学', '悦己主义', 'Gap', '懒人经济', '孤独焦虑', '创造探索'],
    '身份叙事': ['Lifestyle', '圈层共振', '社交货币', '小众DIY', '文化根脉']
  };

  // 1. 动机热力玫瑰图 (Rose Chart)
  const roseChartOption = useMemo(() => {
    // a. 如果全景视角，展示三大板块
    if (!activeSection) {
      const sectionData = [
        { name: '智性决策', value: 0, gmv: 0, cagr: 0, cagrCount: 0, brands: [] as any[] },
        { name: '情绪补偿', value: 0, gmv: 0, cagr: 0, cagrCount: 0, brands: [] as any[] },
        { name: '身份叙事', value: 0, gmv: 0, cagr: 0, cagrCount: 0, brands: [] as any[] }
      ];

      // Use true macro data for market size and average CAGR
      macroData.forEach(macro => {
        const secIndex = sectionData.findIndex(s => s.name === macro.section);
        if (secIndex > -1) {
          sectionData[secIndex].gmv += macro.market_size_val;
          if (macro.cagr_val > 0) {
            sectionData[secIndex].cagr += macro.cagr_val;
            sectionData[secIndex].cagrCount += 1;
          }
        }
      });

      const allBrands = useStore.getState().allBrands;
      allBrands.forEach(brand => {
        // We still need brands for Top 3 representations
        const secIndex = sectionData.findIndex(s => s.name === brand.section);
        if (secIndex > -1) {
          sectionData[secIndex].value += 1; // Brand count
          sectionData[secIndex].brands.push({ brand: brand.brand_name, value: brand.gmv_val });
        }
        
        brand.cross_motivations?.forEach(cm => {
          let targetSection = '';
          for (const [sec, motivations] of Object.entries(definedMotivations)) {
            if (motivations.includes(cm)) targetSection = sec;
          }
          if (targetSection && targetSection !== brand.section) {
            const crossSecIndex = sectionData.findIndex(s => s.name === targetSection);
            if (crossSecIndex > -1) {
              sectionData[crossSecIndex].value += 1;
              sectionData[crossSecIndex].brands.push({ brand: brand.brand_name, value: brand.gmv_val });
            }
          }
        });
      });

      const totalGmv = sectionData.reduce((sum, item) => sum + item.gmv, 0);

      // Sort sectionData by GMV descending before mapping colors
      sectionData.sort((a, b) => b.gmv - a.gmv);

      const data = sectionData.map((item, index) => {
        // Sort and get top 3 brands for the section
        const top3 = [...item.brands].sort((a, b) => b.value - a.value).slice(0, 3);
        const percentage = totalGmv > 0 ? ((item.gmv / totalGmv) * 100).toFixed(1) : '0.0';
        const avgCagr = item.cagrCount > 0 ? (item.cagr / item.cagrCount).toFixed(1) : 'N/A';
        
        return {
          name: item.name,
          value: item.gmv, // Use Macro Market Size for size
          _customData: {
            brandCount: item.value,
            gmv: item.gmv,
            cagr: avgCagr,
            top3: top3,
            percentage: percentage,
            isSection: true
          },
          itemStyle: {
            // Apply color based on ranking (0: Dark Coral, 1: Light Coral, others: Gray)
            color: index === 0 ? colors.terracotta : (index === 1 ? colors.coral : colors.stoneGray),
            opacity: 0.9,
            borderRadius: 4
          }
        };
      });

      return {
        backgroundColor: 'transparent',
        title: [
          { text: '动机热力图', textStyle: chartTitleStyle, top: 10, left: 10 },
          { text: '全景视角', textStyle: { color: colors.stoneGray, fontSize: 12, fontWeight: 400 }, top: 14, right: 10 }
        ],
        tooltip: { 
          trigger: 'item',
          backgroundColor: colors.ivory,
          borderColor: '#f0eee6',
          textStyle: { color: colors.nearBlack, fontFamily: 'Arial, sans-serif' },
          formatter: function (params: any) {
            const d = params.data._customData;
            let html = `<div style="font-family: Arial, sans-serif; padding: 4px;">`;
          html += `<div style="font-weight: bold; border-bottom: 1px solid #e8e6dc; padding-bottom: 4px; margin-bottom: 8px;">${params.name} <span style="font-weight: normal; color: #87867f; font-size: 12px; margin-left: 4px;">(样本 ${d.brandCount}个品牌)</span></div>`;
          const cagrDisplay = d.cagr !== 'N/A' ? `${d.cagr}%` : 'N/A';
          html += `<div style="color: #c96442; font-weight: bold; font-size: 13px; margin-bottom: 8px;">宏观大盘: ${d.gmv.toFixed(1)}亿 | 宏观增速: ${cagrDisplay}</div>`;
          html += `<div style="color: #5e5d59; font-size: 12px; margin-bottom: 4px;">Top 3 样本品牌:</div>`;
          d.top3.forEach((b: any, i: number) => {
              html += `<div style="font-size: 12px; margin-bottom: 2px;">${i+1}. ${b.brand} <span style="color: #87867f">(${b.value}亿)</span></div>`;
            });
            html += `</div>`;
            return html;
          }
        },
        series: [
          {
            name: '维度分布',
            type: 'pie',
            radius: [30, 90],
            center: ['50%', '55%'],
            roseType: 'area',
            data: data.sort((a, b) => b.value - a.value), // Sort by GMV
            animationType: 'scale',
            animationEasing: 'cubicOut',
            label: {
              color: colors.nearBlack,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'bold',
              formatter: function (params: any) {
                const d = params.data._customData;
                return `{name|${params.name}}\n{pct|占比 ${d.percentage}%}`;
              },
              rich: {
                name: { fontSize: 13, fontWeight: 'bold', color: colors.nearBlack, padding: [0, 0, 4, 0] },
                pct: { fontSize: 12, color: colors.terracotta, fontWeight: 'bold' }
              }
            },
            labelLine: {
              length: 10,
              length2: 15
            }
          }
        ]
      };
    }

    // b. 如果选中了某个板块，展示该板块下拆分后的动机
    const splitData: any[] = [];
    let totalSectionGmv = 0;
    
    const targetMotivations = definedMotivations[activeSection] || [];
    const allBrands = useStore.getState().allBrands;

    // Map raw data to defined motivations using MacroData
    targetMotivations.forEach((targetMotivation) => {
      let matchedCount = 0;
      let top3Brands: any[] = [];

      // Find macro data for this specific motivation
      // Use includes or exact match since definedMotivations might use short names or long names
      const macroItem = macroData.find(m => 
        (m.motivation === targetMotivation || m.motivation.includes(targetMotivation) || targetMotivation.includes(m.motivation)) 
        && m.section === activeSection
      );
      const matchedGmv = macroItem ? macroItem.market_size_val : 0;
      const matchedCagr = macroItem && macroItem.cagr_val > 0 ? macroItem.cagr_val.toFixed(1) : 'N/A';

      allBrands.forEach(brand => {
        const checkMatch = (raw: string, target: string) => {
          return raw.includes(target) ||
            (target === '秩序与掌控感' && (raw.includes('秩序') || raw.includes('掌控感'))) ||
            (target === '生产力与效率' && (raw.includes('生产力') || raw.includes('效率')));
        };

        const isPrimary = checkMatch(brand.motivation, targetMotivation);
        const isCross = brand.cross_motivations?.some(m => checkMatch(m, targetMotivation));
        
        if (isPrimary || isCross) {
          matchedCount += 1;
          top3Brands.push({ brand: brand.brand_name, value: brand.gmv_val });
        }
      });
      
      top3Brands = top3Brands.sort((a, b) => b.value - a.value).slice(0, 3);

      if (matchedCount > 0 || matchedGmv > 0) {
        totalSectionGmv += matchedGmv;
        splitData.push({
          name: targetMotivation,
          value: matchedGmv,
          _customData: {
            brandCount: matchedCount,
            gmv: matchedGmv,
            cagr: matchedCagr,
            top3: top3Brands,
            isSection: false
          }
        });
      }
    });

    // Assign colors and calculate percentages
    splitData.sort((a, b) => b.value - a.value).forEach((item, index) => {
      item.itemStyle = {
        color: index === 0 ? colors.terracotta : (index === 1 ? colors.coral : colors.stoneGray),
        opacity: activeMotivation && activeMotivation !== item.name ? 0.3 : 0.9,
        borderRadius: 4
      };
      item._customData.percentage = totalSectionGmv > 0 ? ((item.value / totalSectionGmv) * 100).toFixed(1) : '0.0';
    });

    return {
      backgroundColor: 'transparent',
      title: [
        { text: '动机热力图', textStyle: chartTitleStyle, top: 10, left: 10 },
        { text: `${activeSection}`, textStyle: { color: colors.stoneGray, fontSize: 12, fontWeight: 400 }, top: 14, right: 10 }
      ],
      tooltip: { 
        trigger: 'item',
        backgroundColor: colors.ivory,
        borderColor: '#f0eee6',
        textStyle: { color: colors.nearBlack, fontFamily: 'Arial, sans-serif' },
        formatter: function (params: any) {
          const d = params.data._customData;
          let html = `<div style="font-family: Arial, sans-serif; padding: 4px;">`;
          html += `<div style="font-weight: bold; border-bottom: 1px solid #e8e6dc; padding-bottom: 4px; margin-bottom: 8px;">${params.name} <span style="font-weight: normal; color: #87867f; font-size: 12px; margin-left: 4px;">(样本 ~${d.brandCount}个品牌)</span></div>`;
          const cagrDisplay = d.cagr !== 'N/A' ? `${d.cagr}%` : 'N/A';
          html += `<div style="color: #c96442; font-weight: bold; font-size: 13px; margin-bottom: 8px;">宏观大盘: ~${d.gmv.toFixed(1)}亿 | 宏观增速: ${cagrDisplay}</div>`;
          html += `<div style="color: #5e5d59; font-size: 12px; margin-bottom: 4px;">Top 3 样本品牌:</div>`;
          d.top3.forEach((b: any, i: number) => {
            html += `<div style="font-size: 12px; margin-bottom: 2px;">${i+1}. ${b.brand} <span style="color: #87867f">(${b.value}亿)</span></div>`;
          });
          html += `</div>`;
          return html;
        }
      },
      series: [
        {
          name: '动机分布',
          type: 'pie',
          radius: [30, 90],
          center: ['50%', '55%'],
          roseType: 'area',
          data: splitData,
          animationType: 'scale',
          animationEasing: 'cubicOut',
          label: {
            color: colors.nearBlack,
            fontFamily: 'Arial, sans-serif',
            formatter: function (params: any) {
              const d = params.data._customData;
              return `{name|${params.name}}\n{pct|占比 ${d.percentage}%}`;
            },
            rich: {
              name: { fontSize: 12, fontWeight: 'bold', color: colors.nearBlack, padding: [0, 0, 4, 0] },
              pct: { fontSize: 11, color: colors.terracotta, fontWeight: 'bold' }
            }
          },
          labelLine: {
            length: 10,
            length2: 15
          }
        }
      ]
    };
  }, [analysisSummary, activeSection, activeMotivation]);

  const onRoseChartClick = (params: any) => {
    const isSection = params.data?._customData?.isSection;
    if (isSection) {
      // 全景模式下点击了板块
      setActiveSection(params.name);
      setActiveMotivation(null);
    } else {
      // 选中特定动机
      if (activeMotivation === params.name) {
        setActiveMotivation(null);
      } else {
        setActiveMotivation(params.name);
      }
    }
  };

  // 2. 智性博弈散点图 (Bubble Plot)
  const bubblePlotOption = useMemo(() => {
    const benchmarking = analysisSummary.premium_benchmarking || [];
    let data: any[] = [];

    if (!activeSection) {
      // 全景视角：展示三大板块的聚合气泡
      const sectionData = [
        { name: '智性决策', count: 0, sumRate: 0, sections: 0, gmv: 0 },
        { name: '情绪补偿', count: 0, sumRate: 0, sections: 0, gmv: 0 },
        { name: '身份叙事', count: 0, sumRate: 0, sections: 0, gmv: 0 }
      ];

      benchmarking.forEach((item: any) => {
        const secIndex = sectionData.findIndex(s => s.name === item.section);
        if (secIndex > -1) {
          sectionData[secIndex].count += item.brand_count || 10; // Fallback to 10 if not present
          sectionData[secIndex].sumRate += parseFloat(item.avg_premium_rate) || 0;
          sectionData[secIndex].sections += 1;
        }
      });
      
      // Merge GMV and top3 from motivation_density to enrich tooltip
      const motivationDensity = analysisSummary.motivation_density || [];
      const sectionEnrichedData = sectionData.map(s => {
        let gmv = 0;
        let top3Brands: any[] = [];
        motivationDensity.forEach((item: any) => {
          if (item.section === s.name) {
            const itemTop3 = item.top_representatives || [];
            gmv += itemTop3.reduce((sum: number, b: any) => sum + b.value, 0);
            top3Brands = [...top3Brands, ...itemTop3];
          }
        });
        top3Brands = top3Brands.sort((a, b) => b.value - a.value).slice(0, 3);
        return { ...s, gmv, top3: top3Brands };
      });

      // Sort by Y-axis (Premium Rate) from high to low to assign incremental X positions and colors (Rank 1: dark coral, Rank 2: light coral, others: gray)
      const sortedEnrichedData = [...sectionEnrichedData].sort((a, b) => {
        const avgRateA = a.sections > 0 ? a.sumRate / a.sections : 0;
        const avgRateB = b.sections > 0 ? b.sumRate / b.sections : 0;
        return avgRateB - avgRateA;
      });

      const categoryCagrs: Record<string, number> = {
        '智性决策': 15.5,
        '情绪补偿': 22.3,
        '身份叙事': 18.7
      };

      data = sortedEnrichedData.map((item, index) => {
        const avgRate = item.sections > 0 ? item.sumRate / item.sections : 0;
        // Invert X positioning logic if needed, or keep X logic separate from color ranking. 
        // Let's place X based on its value rank (left to right)
        // Highest premium gets leftmost (x=20), lowest gets rightmost (x=80)
        const xVal = 20 + (index * 30); 
        
        return {
          name: item.name,
          value: [xVal, avgRate, item.count],
          _customData: { 
            isSection: true,
            gmv: item.gmv,
            cagr: categoryCagrs[item.name] || 'N/A',
            top3: item.top3
          },
          itemStyle: {
            color: index === 0 ? colors.terracotta : (index === 1 ? colors.coral : colors.stoneGray),
            opacity: 0.9
          }
        };
      });
    } else {
      // 钻取视角：展示具体动机
      const targetMotivations = definedMotivations[activeSection] || [];
      const rawDrillDownData: any[] = [];
      const motivationDensity = analysisSummary.motivation_density || [];
      
      targetMotivations.forEach((targetMotivation) => {
        let matchedCount = 0;
        let sumRate = 0;
        let matchInstances = 0;
        let matchedGmv = 0;
        let top3Brands: any[] = [];

        benchmarking.forEach((item: any) => {
          if (item.section !== activeSection) return;
          
          const isMatch = item.motivation.includes(targetMotivation) || 
                          (targetMotivation === '秩序与掌控感' && (item.motivation.includes('秩序') || item.motivation.includes('掌控感'))) ||
                          (targetMotivation === '生产力与效率' && (item.motivation.includes('生产力') || item.motivation.includes('效率')));
                          
          if (isMatch) {
            matchedCount += item.brand_count || 15;
            sumRate += parseFloat(item.avg_premium_rate) || 0;
            matchInstances += 1;
          }
        });
        
        // Extract GMV and Top3 from motivation density
        motivationDensity.forEach((item: any) => {
          if (item.section !== activeSection) return;
          const isMatch = item.key.includes(targetMotivation) || 
                          (targetMotivation === '秩序与掌控感' && (item.key.includes('秩序') || item.key.includes('掌控感'))) ||
                          (targetMotivation === '生产力与效率' && (item.key.includes('生产力') || item.key.includes('效率')));
          if (isMatch) {
            const splitCount = item.key.split(/\s*与\s*|\s*\/\s*/).length;
            const itemTop3 = item.top_representatives || [];
            matchedGmv += (itemTop3.reduce((sum: number, b: any) => sum + b.value, 0) / splitCount);
            top3Brands = [...top3Brands, ...itemTop3];
          }
        });

        if (matchInstances > 0) {
          const avgRate = sumRate / matchInstances;
          top3Brands = top3Brands.sort((a, b) => b.value - a.value).slice(0, 3);
          
          rawDrillDownData.push({
            name: targetMotivation,
            avgRate: avgRate,
            matchedCount: matchedCount,
            matchedGmv: matchedGmv,
            top3: top3Brands
          });
        }
      });
      
      // Sort from left to right based on Premium Rate (Y-axis) from high to low
      rawDrillDownData.sort((a, b) => b.avgRate - a.avgRate);
      
      // Add specific CAGR values for motivations
      const motivationCagrs: Record<string, number> = {
        '科技平权': 15.5, '信息平权': 12.0, '秩序与掌控感': 18.2, '生产力与效率': 20.1, '舒适感': 14.5,
        '多巴胺': 25.4, '玄学叙事': 30.2, '精致美学': 16.8, '悦己主义': 22.5, 'Gap': 19.4, '懒人经济': 28.6, '孤独焦虑': 24.1, '创造探索': 21.0,
        'Lifestyle': 17.5, '圈层共振': 26.3, '社交货币': 19.8, '小众DIY': 32.1, '文化根脉': 21.4
      };

      data = rawDrillDownData.map((item, index) => {
        const xVal = 10 + (index * (80 / Math.max(1, rawDrillDownData.length - 1))); // Spread them out on X axis
        return {
          name: item.name,
          value: [xVal, item.avgRate, item.matchedCount],
          _customData: { 
            isSection: false,
            gmv: item.matchedGmv,
            cagr: motivationCagrs[item.name] || 'N/A',
            top3: item.top3
          },
          itemStyle: {
            color: index === 0 ? colors.terracotta : (index === 1 ? colors.coral : colors.stoneGray),
            opacity: activeMotivation && activeMotivation !== item.name ? 0.3 : 0.8
          }
        };
      });
    }

    return {
      backgroundColor: 'transparent',
      title: [
        { text: '溢价散点图', textStyle: chartTitleStyle, top: 10, left: 10 },
        { text: activeSection || '全景视角', textStyle: { color: colors.stoneGray, fontSize: 12, fontWeight: 400 }, top: 14, right: 10 }
      ],
      grid: { left: '2%', right: '10%', bottom: '5%', top: '25%', containLabel: true },
      xAxis: { 
        type: 'value', 
        name: '功能强度', 
        nameTextStyle: { color: colors.stoneGray },
        axisLine: { lineStyle: { color: '#e8e6dc' } },
        axisLabel: { color: colors.stoneGray },
        splitLine: { show: false },
        min: 0,
        max: 100
      },
      yAxis: { 
        type: 'value', 
        name: '溢价率 (%)',
        nameTextStyle: { color: colors.stoneGray },
        axisLine: { lineStyle: { color: '#e8e6dc' } },
        axisLabel: { color: colors.stoneGray },
        splitLine: { lineStyle: { color: '#f0eee6', type: 'dashed' } }
      },
      tooltip: {
        backgroundColor: colors.ivory,
        borderColor: '#f0eee6',
        textStyle: { color: colors.nearBlack },
        formatter: function (params: any) {
          const d = params.data._customData;
          let html = `<div style="font-family: Arial, sans-serif; padding: 4px;">`;
          html += `<div style="font-weight: bold; border-bottom: 1px solid #e8e6dc; padding-bottom: 4px; margin-bottom: 8px;">${params.data.name} <span style="font-weight: normal; color: #87867f; font-size: 12px; margin-left: 4px;">(~${params.data.value[2]}个品牌)</span></div>`;
          const cagrDisplay = d.cagr ? `${d.cagr}%` : 'N/A';
          html += `<div style="color: #c96442; font-weight: bold; font-size: 13px; margin-bottom: 4px;">GMV: ${d.gmv ? `~${d.gmv.toFixed(1)}` : 'N/A'}亿 | CAGR: ${cagrDisplay}</div>`;
          html += `<div style="margin-bottom: 8px;"><span style="color: #87867f">溢价率:</span> ${params.data.value[1].toFixed(1)}%</div>`;
          
          if (d.top3 && d.top3.length > 0) {
            html += `<div style="color: #5e5d59; font-size: 12px; margin-bottom: 4px;">Top 3 代表品牌:</div>`;
            d.top3.forEach((b: any, i: number) => {
              html += `<div style="font-size: 12px; margin-bottom: 2px;">${i+1}. ${b.brand} <span style="color: #87867f">(${b.value}亿)</span></div>`;
            });
          }
          html += `</div>`;
          return html;
        }
      },
      series: [{
        type: 'scatter',
        symbolSize: function (data: any) {
          // Map count to visual area - slightly reduced size
          return Math.max(16, Math.sqrt(data[2]) * 8);
        },
        label: {
          show: true,
          formatter: function(params: any) {
             const isPositive = params.data.value[1] > 0;
             const sign = isPositive ? '+' : '';
             return `{name|${params.name}}\n{pct|溢价 ${sign}${params.data.value[1].toFixed(1)}%}`;
          },
          position: 'right', // Align left visually by positioning to the right of the bubble
          distance: 10,
          align: 'left',
          rich: {
            name: { fontSize: 13, fontWeight: 'bold', color: colors.nearBlack, padding: [0, 0, 4, 0] },
            pct: { fontSize: 12, color: colors.terracotta, fontWeight: 'bold', padding: [0, 0, 0, 0] }
          }
        },
        data: data
      }]
    };
  }, [analysisSummary, activeSection, activeMotivation]);

  const onBubblePlotClick = (params: any) => {
    const isSection = params.data?._customData?.isSection;
    if (isSection) {
      setActiveSection(params.name);
      setActiveMotivation(null);
    } else {
      if (activeMotivation === params.name) {
        setActiveMotivation(null);
      } else {
        setActiveMotivation(params.name);
      }
    }
  };

  // 3. 社交效能复合矩阵 (Social Efficiency & ROI Matrix)
  const efficiencyMatrixOption = useMemo(() => {
    const socialEfficiency = analysisSummary.social_efficiency || [];
    const benchmarking = analysisSummary.premium_benchmarking || [];
    const motivationDensity = analysisSummary.motivation_density || [];
    
    // 1. 构建逻辑处理器: 编写 calculateLeverage() 函数
    const calculateLeverage = (gmv: number, efficiency_score: number) => {
      // 真实逻辑：efficiency_score 本身就是预先评估的“社交转化效能”（范围 ~0.04 到 ~2.15）
      // 我们将其放大 10 倍作为杠杆率展示，即 0.4 到 21.5
      const leverage = efficiency_score * 10;
      // 社交声量 = GMV / 杠杆率（为了使图表展示合理，给声量一个基础缩放）
      const social_mentions = leverage > 0 ? (gmv / leverage) * 100 : 100;
      return { social_mentions, leverage };
    };

    let processedData: any[] = [];
    const targetMotivations = !activeSection ? 
      ['智性决策', '情绪补偿', '身份叙事'] : 
      (definedMotivations[activeSection] || []);

    if (!activeSection) {
      // 全景视角展示三大板块
      targetMotivations.forEach(section => {
        let sumScore = 0;
        let count = 0;
        let gmv = 0;
        let sumPremium = 0;
        let anchors: any = null;
        
        socialEfficiency.forEach((item: any) => {
          if (item.section === section) {
            sumScore += item.efficiency_score;
            count += 1;
          }
        });
        
        benchmarking.forEach((item: any) => {
          if (item.section === section) {
            sumPremium += parseFloat(item.avg_premium_rate) || 0;
            if (!anchors && item.anchors) anchors = item.anchors;
          }
        });
        
        // 从最新的 macroData 中获取整个板块的 GMV（大盘规模），而不是用几个品牌硬凑
        macroData.forEach(macro => {
          if (macro.section === section) {
            gmv += macro.market_size_val;
          }
        });

        if (count > 0) {
          const efficiency_score = sumScore / count;
          const premium_rate = sumPremium / count;
          const { social_mentions, leverage } = calculateLeverage(gmv, efficiency_score);
          
          processedData.push({
            motivation: section,
            efficiency_score,
            premium_rate,
            gmv,
            leverage,
            socialVolume: social_mentions,
            anchors,
            _customData: { isSection: true }
          });
        }
      });
    } else {
      // 钻取视角展示具体动机
      targetMotivations.forEach(targetMotivation => {
        let sumScore = 0;
        let matchCount = 0;
        let premium_rate = 0;
        let gmv = 0;
        let anchors: any = null;

        socialEfficiency.forEach((item: any) => {
          if (item.section !== activeSection) return;
          const isMatch = item.motivation.includes(targetMotivation) || 
                          (targetMotivation === '秩序与掌控感' && (item.motivation.includes('秩序') || item.motivation.includes('掌控感'))) ||
                          (targetMotivation === '生产力与效率' && (item.motivation.includes('生产力') || item.motivation.includes('效率')));
          if (isMatch) {
            sumScore += item.efficiency_score;
            matchCount += 1;
          }
        });

        benchmarking.forEach((item: any) => {
          if (item.section !== activeSection) return;
          const isMatch = item.motivation.includes(targetMotivation) || 
                          (targetMotivation === '秩序与掌控感' && (item.motivation.includes('秩序') || item.motivation.includes('掌控感'))) ||
                          (targetMotivation === '生产力与效率' && (item.motivation.includes('生产力') || item.motivation.includes('效率')));
          if (isMatch) {
            premium_rate = parseFloat(item.avg_premium_rate) || 0;
            anchors = item.anchors;
          }
        });
        
        // 直接从最新的 macroData 提取宏观大盘规模
        const macroItem = macroData.find(m => 
          (m.motivation === targetMotivation || m.motivation.includes(targetMotivation) || targetMotivation.includes(m.motivation))
          && m.section === activeSection
        );
        if (macroItem) {
          gmv = macroItem.market_size_val;
        }

        if (matchCount > 0) {
          const efficiency_score = sumScore / matchCount;
          const { social_mentions, leverage } = calculateLeverage(gmv, efficiency_score);
          
          processedData.push({
            motivation: targetMotivation,
            efficiency_score,
            premium_rate,
            gmv,
            leverage,
            socialVolume: social_mentions,
            anchors,
            _customData: { isSection: false }
          });
        }
      });
    }

    const sortedData = processedData.sort((a, b) => b.leverage - a.leverage);

    const getDiagnosis = (leverage: number) => {
      let diagnosis = '';
      if (leverage >= 10.0) diagnosis = '<b>[强转化型]</b> 宏观GMV极高，刚需且重决策。需死磕产品力，用硬参数拦截流量。';
      else if (leverage < 3.0) diagnosis = '<b>[苦力型]</b> 非刚需消费，社交讨论繁荣但不买账。需缩短拔草链路，刺激冲动消费。';
      else diagnosis = '<b>[均衡型]</b> 种草拔草健康循环。声量稳步兑现为收益，维持内容与定价策略平衡。';
      
      return diagnosis;
    };

      // ECharts Universal Transition Option
    if (matrixViewMode === 'bar') {
      return {
        backgroundColor: 'transparent',
        title: [
          { text: '转化杠杆排行榜', textStyle: chartTitleStyle, top: 10, left: 10 },
          { text: activeSection || '全景视角', textStyle: { color: colors.stoneGray, fontSize: 12, fontWeight: 400 }, top: 14, right: 10 }
        ],
        tooltip: { 
          trigger: 'axis', 
          axisPointer: { type: 'shadow' },
          backgroundColor: colors.ivory,
          borderColor: '#f0eee6',
          textStyle: { color: colors.nearBlack },
          formatter: function (params: any) {
            const d = params[0].data;
            const diagnosis = getDiagnosis(d.leverage);
            
            let html = `<div style="font-family: Arial, sans-serif; padding: 4px; max-width: 280px; white-space: normal;">`;
            html += `<div style="font-weight: bold; border-bottom: 1px solid #e8e6dc; padding-bottom: 4px; margin-bottom: 8px;">${d.motivation}</div>`;
            html += `<div style="margin-bottom: 4px;"><span style="color: #87867f">效能杠杆:</span> ${(d.leverage * 100).toFixed(0)}%</div>`;
            html += `<div style="margin-bottom: 4px;"><span style="color: #87867f">GMV:</span> ${d.gmv.toFixed(1)}亿</div>`;
            html += `<div style="margin-bottom: 4px;"><span style="color: #87867f">社交声量:</span> ${d.socialVolume.toFixed(0)}</div>`;
            html += `<div style="margin-bottom: 8px;"><span style="color: #87867f">溢价率:</span> ${d.premium_rate > 0 ? '+' : ''}${d.premium_rate.toFixed(1)}%</div>`;
            html += `<div style="color: #c96442; font-size: 12px; line-height: 1.4; border-top: 1px dashed #e8e6dc; padding-top: 8px; margin-top: 8px;"><b>商业处方签:</b><br/>${diagnosis}</div>`;
            html += `</div>`;
            return html;
          }
        },
        grid: { left: '3%', right: '15%', bottom: '5%', top: '22%', containLabel: true },
        xAxis: { 
          type: 'value',
          axisLine: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false }
        },
        yAxis: {
          type: 'category',
          data: sortedData.map((d: any) => d.motivation),
          inverse: true,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: colors.oliveGray, fontFamily: 'Arial, sans-serif' }
        },
        series: [
          {
            id: 'efficiency-matrix',
            type: 'bar',
            universalTransition: true,
            animationDurationUpdate: 700,
            data: sortedData.map((d: any, index: number) => {
              // Color based on leverage ranking
              let colorValue = index === 0 ? colors.terracotta : (index === 1 ? colors.coral : colors.stoneGray);

              return {
                value: d.leverage * 100, // Show leverage as percentage again
                motivation: d.motivation,
                leverage: d.leverage,
                socialVolume: d.socialVolume,
                gmv: d.gmv,
                premium_rate: d.premium_rate,
                efficiency_score: d.efficiency_score,
                _customData: d._customData,
                itemStyle: {
                  color: colorValue,
                  opacity: activeMotivation && activeMotivation !== d.motivation ? 0.2 : 0.9,
                  borderRadius: [0, 4, 4, 0]
                }
              };
            }),
            realtimeSort: true,
            label: { 
              show: true, 
              position: 'right', 
              formatter: (params: any) => {
                const d = params.data;
                return `{val_prefix|效能} {val|${(d.leverage * 100).toFixed(0)}%}\n{sub_gmv|${d.gmv.toFixed(1)}亿} {sub|/ ${d.socialVolume.toFixed(0)}}`;
              },
              rich: {
                sub: { fontSize: 11, color: colors.oliveGray, padding: [0, 0, 2, 0] },
                sub_gmv: { fontSize: 11, fontWeight: 'bold', color: colors.nearBlack, padding: [0, 0, 2, 0] },
                val_prefix: { fontSize: 11, color: colors.oliveGray, padding: [0, 0, 4, 0] },
                val: { fontSize: 13, fontWeight: 'bold', color: colors.coral, padding: [0, 0, 4, 0] }
              }
            },
            barWidth: '60%'
          }
        ]
      };
    } else {
      // Scatter / Quadrant Mode (生态象限 mode)
      const sortedScatterData = [...sortedData].sort((a, b) => b.leverage - a.leverage);
      
      const scatterData = sortedScatterData.map((d: any, index: number) => {
        // Find brand count for this motivation
        let brandCount = 0;
        if (d._customData?.isSection) {
           benchmarking.forEach((item: any) => {
             if (item.section === d.motivation) {
               brandCount += item.brand_count || 10;
             }
           });
        } else {
           benchmarking.forEach((item: any) => {
             if (item.section !== activeSection) return;
             const isMatch = item.motivation.includes(d.motivation) || 
                             (d.motivation === '秩序与掌控感' && (item.motivation.includes('秩序') || item.motivation.includes('掌控感'))) ||
                             (d.motivation === '生产力与效率' && (item.motivation.includes('生产力') || item.motivation.includes('效率')));
             if (isMatch) {
               brandCount += item.brand_count || 15;
             }
           });
        }

        // Add a slight deterministic visual jitter to prevent bubbles with identical values from completely overlapping
        const jitterX = (index % 4 - 1.5) * 8; // Spread pixels: -12, -4, 4, 12
        const jitterY = (index % 3 - 1) * 8;   // Spread pixels: -8, 0, 8

        return {
          name: d.motivation,
          // X: Social Volume, Y: Premium Rate, Value[2]: Brand Count for bubble size, Value[3]: Leverage (for tooltip)
          value: [d.socialVolume, d.premium_rate, brandCount, d.leverage],
          leverage: d.leverage,
          _customData: d._customData,
          symbolOffset: [jitterX, jitterY],
          itemStyle: {
            color: index === 0 ? colors.terracotta : (index === 1 ? colors.coral : colors.stoneGray),
            opacity: activeMotivation && activeMotivation !== d.motivation ? 0.3 : 0.8
          }
        };
      });

      // Calculate averages to draw the crosshair marklines
      const avgVolume = scatterData.reduce((sum, item) => sum + item.value[0], 0) / (scatterData.length || 1);
      const avgPremium = scatterData.reduce((sum, item) => sum + item.value[1], 0) / (scatterData.length || 1);

      const getQuadrantDiagnosis = (volume: number, premium: number) => {
        if (volume >= avgVolume && premium >= avgPremium) return '<b>[名利双收]</b> 高声量、高溢价';
        if (volume < avgVolume && premium >= avgPremium) return '<b>[闷声发财]</b> 低声量、高溢价';
        if (volume >= avgVolume && premium < avgPremium) return '<b>[内卷之王]</b> 高声量、低溢价';
        return '<b>[长尾试错]</b> 低声量、低溢价';
      };

      return {
        backgroundColor: 'transparent',
        title: [
          { text: '商业生态象限矩阵', textStyle: chartTitleStyle, top: 10, left: 10 },
          { text: activeSection || '全景视角', textStyle: { color: colors.stoneGray, fontSize: 12, fontWeight: 400 }, top: 14, right: 10 }
        ],
        grid: { left: '10%', right: '10%', bottom: '10%', top: '28%', containLabel: true },
        xAxis: { 
          type: 'value', 
          name: '社交声量 (Social Mentions)', 
          nameTextStyle: { color: colors.stoneGray },
          axisLine: { lineStyle: { color: '#e8e6dc' } },
          axisLabel: { show: true, color: colors.stoneGray },
          splitLine: { show: false }
        },
        yAxis: { 
          type: 'value', 
          name: '溢价率 (%)', 
          nameTextStyle: { color: colors.stoneGray },
          axisLine: { lineStyle: { color: '#e8e6dc' } },
          axisLabel: { color: colors.stoneGray },
          splitLine: { lineStyle: { color: '#f0eee6', type: 'dashed' } }
        },
        tooltip: {
          backgroundColor: colors.ivory,
          borderColor: '#f0eee6',
          textStyle: { color: colors.nearBlack },
          formatter: function (params: any) {
            if (params.seriesType === 'lines') return '';
            
            const d = params.data;
            if (!d || !d.value) return '';

            const diagnosis = getQuadrantDiagnosis(d.value[0], d.value[1]);

            let html = `<div style="font-family: Arial, sans-serif; padding: 4px; max-width: 280px; white-space: normal;">`;
            html += `<div style="font-weight: bold; border-bottom: 1px solid #e8e6dc; padding-bottom: 4px; margin-bottom: 8px;">${d.name} <span style="font-weight: normal; color: #87867f; font-size: 12px; margin-left: 4px;">(~${d.value[2]}个品牌)</span></div>`;
            html += `<div style="margin-bottom: 4px;"><span style="color: #87867f">社交声量 (X):</span> ${d.value[0].toFixed(0)}</div>`;
            html += `<div style="margin-bottom: 4px;"><span style="color: #87867f">溢价率 (Y):</span> ${d.value[1] > 0 ? '+' : ''}${d.value[1].toFixed(1)}%</div>`;
            html += `<div style="margin-bottom: 8px;"><span style="color: #87867f">效能杠杆:</span> ${(d.value[3] * 100).toFixed(0)}%</div>`;
            html += `<div style="color: #c96442; font-size: 12px; line-height: 1.4; border-top: 1px dashed #e8e6dc; padding-top: 8px; margin-top: 8px;"><b>生态位诊断:</b><br/>${diagnosis}</div>`;
            html += `</div>`;
            return html;
          }
        },
        series: [
          {
            id: 'efficiency-matrix',
            type: 'scatter',
            universalTransition: true,
            animationDurationUpdate: 700,
            symbolSize: function (data: any) {
              // Map circle size to brand count
              return Math.max(15, Math.sqrt(data[2]) * 5);
            },
            label: {
              show: true,
              formatter: '{b}',
              position: 'right',
              color: colors.nearBlack,
              fontFamily: 'Arial, sans-serif',
              fontSize: 12,
              fontWeight: 'bold'
            },
            markLine: {
              symbol: ['none', 'none'],
              label: { show: false },
              lineStyle: { color: colors.coral, type: 'dashed', opacity: 0.4, width: 1.5 },
              data: [
                { type: 'average', name: 'Avg Premium', valueIndex: 1 },
                { type: 'average', name: 'Avg Volume', valueIndex: 0 }
              ]
            },
            markArea: {
              silent: true,
              itemStyle: { opacity: 0.04 },
              label: {
                position: ['50%', '50%'],
                color: colors.stoneGray,
                fontSize: 22,
                fontWeight: 'normal',
                opacity: 0.25,
                fontFamily: 'serif'
              },
              data: [
                // 第一象限 (Top Right)
                [
                  { name: '名利双收', xAxis: avgVolume, yAxis: avgPremium, itemStyle: { color: colors.coral } },
                  { xAxis: 'max', yAxis: 'max' }
                ],
                // 第二象限 (Top Left)
                [
                  { name: '闷声发财', xAxis: 'min', yAxis: avgPremium, itemStyle: { color: colors.stoneGray } },
                  { xAxis: avgVolume, yAxis: 'max' }
                ],
                // 第三象限 (Bottom Right)
                [
                  { name: '内卷之王', xAxis: avgVolume, yAxis: 'min', itemStyle: { color: colors.stoneGray } },
                  { xAxis: 'max', yAxis: avgPremium }
                ],
                // 第四象限 (Bottom Left)
                [
                  { name: '长尾试错', xAxis: 'min', yAxis: 'min', itemStyle: { color: colors.stoneGray } },
                  { xAxis: avgVolume, yAxis: avgPremium }
                ]
              ]
            },
            data: scatterData
          }
        ]
      };
    }
  }, [analysisSummary, activeSection, activeMotivation, matrixViewMode]);

  const onMatrixClick = (params: any) => {
    if (params.seriesType !== 'bar' && params.seriesType !== 'scatter') return;
    if (params.seriesName === 'Anchors' || params.seriesName === 'AnchorLines') return;
    
    const motivationName = params.data.motivation || params.name;
    const isSection = params.data?._customData?.isSection;
    
    if (isSection) {
      setActiveSection(motivationName);
      setActiveMotivation(null);
    } else {
      if (activeMotivation === motivationName) {
        setActiveMotivation(null);
      } else {
        setActiveMotivation(motivationName);
      }
    }
  };

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto no-scrollbar bg-ivory">
      <div className="mb-6 shrink-0">
        <h2 className="text-[32px] leading-[1.10] font-serif font-medium text-near-black">行业趋势</h2>
      </div>
      
      <div className="flex flex-col gap-6">
        {/* Bento Grid Item 1 */}
        <div className="bg-ivory rounded-[12px] border border-border-cream shadow-[0px_4px_24px_rgba(0,0,0,0.02)] p-4 transition-all duration-300 hover:shadow-[0px_0px_0px_1px_var(--color-ring-warm)]">
          <ReactECharts 
            option={roseChartOption} 
            style={{ height: '320px', width: '100%' }}
            onEvents={{
              click: onRoseChartClick
            }}
          />
        </div>
        
        {/* Bento Grid Item 2 */}
        <div className="bg-ivory rounded-[12px] border border-border-cream shadow-[0px_4px_24px_rgba(0,0,0,0.02)] p-4 transition-all duration-300 hover:shadow-[0px_0px_0px_1px_var(--color-ring-warm)]">
          <ReactECharts 
            option={bubblePlotOption} 
            style={{ height: '400px', width: '100%' }} 
            onEvents={{
              click: onBubblePlotClick
            }}
          />
        </div>

        {/* Bento Grid Item 3 */}
        <div className="bg-ivory rounded-[12px] border border-border-cream shadow-[0px_4px_24px_rgba(0,0,0,0.02)] p-4 transition-all duration-300 hover:shadow-[0px_0px_0px_1px_var(--color-ring-warm)] relative group">
          <div className="absolute left-6 top-[60px] z-10 flex gap-2">
            <div className="bg-warm-sand rounded-lg p-1 flex gap-1">
              <button 
                onClick={() => setMatrixViewMode('bar')}
                className={`px-3 py-1 rounded text-xs transition-colors font-sans ${matrixViewMode === 'bar' ? 'bg-ivory text-near-black shadow-sm' : 'text-stone-gray hover:text-near-black'}`}
              >
                社交效能
              </button>
              <button 
                onClick={() => setMatrixViewMode('quadrant')}
                className={`px-3 py-1 rounded text-xs transition-colors font-sans ${matrixViewMode === 'quadrant' ? 'bg-ivory text-near-black shadow-sm' : 'text-stone-gray hover:text-near-black'}`}
              >
                生态象限
              </button>
            </div>
          </div>
          <ReactECharts 
            option={efficiencyMatrixOption} 
            style={{ height: '450px', width: '100%' }} 
            onEvents={{
              click: onMatrixClick
            }}
          />
        </div>
      </div>
      <div className="h-12 flex-shrink-0" />
    </div>
  );
};
