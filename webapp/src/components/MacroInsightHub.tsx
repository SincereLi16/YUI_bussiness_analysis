'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useStore } from '../store/useStore';

export const MacroInsightHub = () => {
  const analysisSummary = useStore((state) => state.analysisSummary);
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

  // 1. 动机热力玫瑰图 (Rose Chart)
  const roseChartOption = useMemo(() => {
    // a. 如果全景视角，展示三大板块
    if (!activeSection) {
      const sectionData = [
        { name: '智性决策', value: 0, gmv: 0, brands: [] as any[] },
        { name: '情绪补偿', value: 0, gmv: 0, brands: [] as any[] },
        { name: '身份叙事', value: 0, gmv: 0, brands: [] as any[] }
      ];

      analysisSummary.motivation_density?.forEach((item: any) => {
        const secIndex = sectionData.findIndex(s => s.name === item.section);
        if (secIndex > -1) {
          sectionData[secIndex].value += item.brand_count;
          
          item.top_representatives?.forEach((brand: any) => {
             sectionData[secIndex].gmv += brand.value;
             sectionData[secIndex].brands.push(brand);
          });
        }
      });

      const totalGmv = sectionData.reduce((sum, item) => sum + item.gmv, 0);

      const data = sectionData.map((item, index) => {
        // Sort and get top 3 brands for the section
        const top3 = [...item.brands].sort((a, b) => b.value - a.value).slice(0, 3);
        const percentage = totalGmv > 0 ? ((item.gmv / totalGmv) * 100).toFixed(1) : '0.0';
        
        return {
          name: item.name,
          value: item.gmv, // Use GMV for size instead of brand_count
          _customData: {
            brandCount: item.value,
            gmv: item.gmv,
            top3: top3,
            percentage: percentage,
            isSection: true
          },
          itemStyle: {
            color: index === 0 ? colors.terracotta : (index === 1 ? colors.coral : colors.oliveGray),
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
            html += `<div style="font-weight: bold; border-bottom: 1px solid #e8e6dc; padding-bottom: 4px; margin-bottom: 8px;">${params.name} <span style="font-weight: normal; color: #87867f; font-size: 12px; margin-left: 4px;">(${d.brandCount}个品牌)</span></div>`;
            html += `<div style="color: #5e5d59; font-size: 12px; margin-bottom: 4px;">Top 3 代表品牌:</div>`;
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
                return `{name|${params.name}}\n{sub|GMV ${d.gmv.toFixed(1)}亿}\n{pct|${d.percentage}%}`;
              },
              rich: {
                name: { fontSize: 13, fontWeight: 'bold', color: colors.nearBlack, padding: [0, 0, 4, 0] },
                sub: { fontSize: 11, color: colors.oliveGray, padding: [0, 0, 2, 0] },
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
    const relevantMotivations = analysisSummary.motivation_density?.filter((m: any) => m.section === activeSection) || [];
    const splitData: any[] = [];
    let totalSectionGmv = 0;

    // Strict motivation mapping based on user requirements
    const definedMotivations: Record<string, string[]> = {
      '智性决策': ['科技平权', '信息平权', '秩序与掌控感', '生产力与效率', '舒适感'],
      '情绪补偿': ['多巴胺', '玄学叙事', '精致美学', '悦己主义', 'Gap', '懒人经济', '孤独焦虑', '创造探索'],
      '身份叙事': ['Lifestyle', '圈层共振', '社交货币', '小众DIY', '文化根脉']
    };

    const targetMotivations = definedMotivations[activeSection] || [];

    // Map raw data to defined motivations
    targetMotivations.forEach((targetMotivation) => {
      let matchedCount = 0;
      let matchedGmv = 0;
      let top3Brands: any[] = [];

      relevantMotivations.forEach((item: any) => {
        // If the raw key includes the target motivation, we attribute it
        // Or if it's "生产力与效率" and raw key has "生产力" or "效率"
        // Or "秩序与掌控感" and raw key has "秩序" or "掌控感"
        const isMatch = item.key.includes(targetMotivation) || 
                        (targetMotivation === '秩序与掌控感' && (item.key.includes('秩序') || item.key.includes('掌控感'))) ||
                        (targetMotivation === '生产力与效率' && (item.key.includes('生产力') || item.key.includes('效率')));
                        
        if (isMatch) {
          // If the raw item is a merged one (e.g. "Lifestyle 与 户外叙事"), we take a proportion
          const splitCount = item.key.split(/\s*与\s*|\s*\/\s*/).length;
          
          matchedCount += Math.ceil(item.brand_count / splitCount);
          
          const itemTop3 = item.top_representatives || [];
          const itemGmv = itemTop3.reduce((sum: number, b: any) => sum + b.value, 0) / splitCount;
          matchedGmv += itemGmv;
          
          // Merge top 3
          top3Brands = [...top3Brands, ...itemTop3].sort((a, b) => b.value - a.value).slice(0, 3);
        }
      });

      if (matchedCount > 0 || matchedGmv > 0) {
        totalSectionGmv += matchedGmv;
        splitData.push({
          name: targetMotivation,
          value: matchedGmv,
          _customData: {
            brandCount: matchedCount,
            gmv: matchedGmv,
            top3: top3Brands,
            isSection: false
          }
        });
      }
    });

    // Assign colors and calculate percentages
    splitData.sort((a, b) => b.value - a.value).forEach((item, index) => {
      item.itemStyle = {
        color: index % 2 === 0 ? colors.terracotta : colors.coral,
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
          html += `<div style="font-weight: bold; border-bottom: 1px solid #e8e6dc; padding-bottom: 4px; margin-bottom: 8px;">${params.name} <span style="font-weight: normal; color: #87867f; font-size: 12px; margin-left: 4px;">(~${d.brandCount}个品牌)</span></div>`;
          html += `<div style="color: #5e5d59; font-size: 12px; margin-bottom: 4px;">相关代表品牌:</div>`;
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
              return `{name|${params.name}}\n{sub|GMV ~${d.gmv.toFixed(1)}亿}\n{pct|${d.percentage}%}`;
            },
            rich: {
              name: { fontSize: 12, fontWeight: 'bold', color: colors.nearBlack, padding: [0, 0, 4, 0] },
              sub: { fontSize: 10, color: colors.oliveGray, padding: [0, 0, 2, 0] },
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

    // Strict motivation mapping based on user requirements
    const definedMotivations: Record<string, string[]> = {
      '智性决策': ['科技平权', '信息平权', '秩序与掌控感', '生产力与效率', '舒适感'],
      '情绪补偿': ['多巴胺', '玄学叙事', '精致美学', '悦己主义', 'Gap', '懒人经济', '孤独焦虑', '创造探索'],
      '身份叙事': ['Lifestyle', '圈层共振', '社交货币', '小众DIY', '文化根脉']
    };

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

      // Sort by Y-axis (Premium Rate) from low to high to assign incremental X positions
      const sortedEnrichedData = [...sectionEnrichedData].sort((a, b) => {
        const avgRateA = a.sections > 0 ? a.sumRate / a.sections : 0;
        const avgRateB = b.sections > 0 ? b.sumRate / b.sections : 0;
        return avgRateA - avgRateB;
      });

      data = sortedEnrichedData.map((item, index) => {
        const avgRate = item.sections > 0 ? item.sumRate / item.sections : 0;
        const xVal = 20 + (index * 30); // X from 20, 50, 80 based on sorted Premium Rate
        
        // Find original index for coloring
        const originalIndex = sectionData.findIndex(s => s.name === item.name);
        
        return {
          name: item.name,
          value: [xVal, avgRate, item.count],
          _customData: { 
            isSection: true,
            gmv: item.gmv,
            top3: item.top3
          },
          itemStyle: {
            color: originalIndex === 0 ? colors.terracotta : (originalIndex === 1 ? colors.coral : colors.oliveGray),
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
      
      // Sort from left to right based on Premium Rate (Y-axis) from low to high
      rawDrillDownData.sort((a, b) => a.avgRate - b.avgRate);
      
      data = rawDrillDownData.map((item, index) => {
        const xVal = 10 + (index * (80 / Math.max(1, rawDrillDownData.length - 1))); // Spread them out on X axis
        return {
          name: item.name,
          value: [xVal, item.avgRate, item.matchedCount],
          _customData: { 
            isSection: false,
            gmv: item.matchedGmv,
            top3: item.top3
          },
          itemStyle: {
            color: index % 2 === 0 ? colors.terracotta : colors.coral,
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
             const d = params.data._customData;
             const isPositive = params.data.value[1] > 0;
             const sign = isPositive ? '+' : '';
             return `{name|${params.name}}\n{sub|GMV} {gmv|${d.gmv.toFixed(1)}亿}\n{pct|${sign}${params.data.value[1].toFixed(1)}%}`;
          },
          position: 'right', // Align left visually by positioning to the right of the bubble
          distance: 10,
          align: 'left',
          rich: {
            name: { fontSize: 13, fontWeight: 'bold', color: colors.nearBlack, padding: [0, 0, 4, 0] },
            sub: { fontSize: 11, color: colors.oliveGray, padding: [0, 0, 4, 0] },
            gmv: { fontSize: 11, fontWeight: 'bold', color: colors.nearBlack, padding: [0, 0, 4, 0] },
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
    
    const definedMotivations: Record<string, string[]> = {
      '智性决策': ['科技平权', '信息平权', '秩序与掌控感', '生产力与效率', '舒适感'],
      '情绪补偿': ['多巴胺', '玄学叙事', '精致美学', '悦己主义', 'Gap', '懒人经济', '孤独焦虑', '创造探索'],
      '身份叙事': ['Lifestyle', '圈层共振', '社交货币', '小众DIY', '文化根脉']
    };

    // 1. 构建逻辑处理器: 编写 calculateLeverage() 函数
    const calculateLeverage = (gmv: number, efficiency_score: number) => {
      // 模拟 Social Mentions: 使用 efficiency_score 放大一个基数，使得平均杠杆率在 1.0 左右
      const social_mentions = efficiency_score * 800; 
      const leverage = social_mentions > 0 ? (gmv / social_mentions) : 1;
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
        let anchors: any = null; // Sections don't have direct anchors usually, but we keep it empty
        
        socialEfficiency.forEach((item: any) => {
          if (item.section === section) {
            sumScore += item.efficiency_score;
            count += 1;
          }
        });
        
        benchmarking.forEach((item: any) => {
          if (item.section === section) {
            sumPremium += parseFloat(item.avg_premium_rate) || 0;
            if (!anchors && item.anchors) anchors = item.anchors; // pick first available
          }
        });
        
        motivationDensity.forEach((item: any) => {
          if (item.section === section) {
            const itemTop3 = item.top_representatives || [];
            gmv += itemTop3.reduce((sum: number, b: any) => sum + b.value, 0);
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
        
        motivationDensity.forEach((item: any) => {
          if (item.section !== activeSection) return;
          const isMatch = item.key.includes(targetMotivation) || 
                          (targetMotivation === '秩序与掌控感' && (item.key.includes('秩序') || item.key.includes('掌控感'))) ||
                          (targetMotivation === '生产力与效率' && (item.key.includes('生产力') || item.key.includes('效率')));
          if (isMatch) {
            const splitCount = item.key.split(/\s*与\s*|\s*\/\s*/).length;
            const itemTop3 = item.top_representatives || [];
            gmv += (itemTop3.reduce((sum: number, b: any) => sum + b.value, 0) / splitCount);
          }
        });

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

    const sortedData = processedData.sort((a, b) => b.efficiency_score - a.efficiency_score);

    const getDiagnosis = (leverage: number, socialVolume: number, premium_rate: number) => {
      const isVictim = socialVolume > 500 && premium_rate < 0;
      let diagnosis = '';
      if (leverage > 1.2) diagnosis = '<b>[强转化型]</b> 用户心智成熟，搜索即购买。';
      else if (leverage < 0.8) diagnosis = '<b>[纯叙事型]</b> 社交热度远超实际转化，属品牌建设期。';
      else diagnosis = '<b>[均衡型]</b> 声量与转化处于健康水平。';
      
      if (isVictim) diagnosis = '<b>[价格战受害者]</b> 该动机下品牌正通过牺牲利润换取流量。建议减少参数对比，转向情感溢价叙事。';
      return diagnosis;
    };

    // ECharts Universal Transition Option
    if (matrixViewMode === 'bar') {
      return {
        backgroundColor: 'transparent',
        title: [
          { text: '社交效能复合矩阵', textStyle: chartTitleStyle, top: 10, left: 10 },
          { text: activeSection || '全景视角', textStyle: { color: colors.stoneGray, fontSize: 12, fontWeight: 400 }, top: 14, right: 180 }
        ],
        tooltip: { 
          trigger: 'axis', 
          axisPointer: { type: 'shadow' },
          backgroundColor: colors.ivory,
          borderColor: '#f0eee6',
          textStyle: { color: colors.nearBlack },
          formatter: function (params: any) {
            const d = params[0].data;
            const diagnosis = getDiagnosis(d.leverage, d.socialVolume, d.premium_rate);
            
            let html = `<div style="font-family: Arial, sans-serif; padding: 4px; max-width: 280px; white-space: normal;">`;
            html += `<div style="font-weight: bold; border-bottom: 1px solid #e8e6dc; padding-bottom: 4px; margin-bottom: 8px;">${d.motivation}</div>`;
            html += `<div style="margin-bottom: 4px;"><span style="color: #87867f">效能指数:</span> ${d.value.toFixed(1)}</div>`;
            html += `<div style="margin-bottom: 4px;"><span style="color: #87867f">杠杆百分比:</span> ${(d.leverage * 100).toFixed(0)}%</div>`;
            html += `<div style="margin-bottom: 8px;"><span style="color: #87867f">溢价率:</span> ${d.premium_rate > 0 ? '+' : ''}${d.premium_rate.toFixed(1)}%</div>`;
            html += `<div style="color: #c96442; font-size: 12px; line-height: 1.4; border-top: 1px dashed #e8e6dc; padding-top: 8px; margin-top: 8px;"><b>商业处方签:</b><br/>${diagnosis}</div>`;
            html += `</div>`;
            return html;
          }
        },
        grid: { left: '3%', right: '8%', bottom: '5%', top: '25%', containLabel: true },
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
            data: sortedData.map((d: any) => {
              // 溢价侵蚀度: 渐变色填充，深（高溢价）至浅（低溢价）
              let opacity = 1;
              if (d.premium_rate < 0) opacity = 0.4;
              else if (d.premium_rate < 20) opacity = 0.6;
              else if (d.premium_rate < 40) opacity = 0.8;
              else opacity = 1;
              
              const colorValue = d.premium_rate > 0 ? colors.terracotta : colors.stoneGray;
              return {
                value: d.efficiency_score,
                motivation: d.motivation,
                leverage: d.leverage,
                socialVolume: d.socialVolume,
                premium_rate: d.premium_rate,
                _customData: d._customData,
                itemStyle: {
                  color: colorValue,
                  opacity: activeMotivation && activeMotivation !== d.motivation ? 0.2 : opacity,
                  borderRadius: [0, 4, 4, 0]
                }
              };
            }),
            realtimeSort: true,
            label: { 
              show: true, 
              position: 'right', 
              color: colors.nearBlack, 
              fontFamily: 'Arial, sans-serif',
              formatter: (params: any) => {
                const d = params.data;
                const isVictim = d.socialVolume > 500 && d.premium_rate < 0;
                let icon = '';
                if (d.leverage > 1.2) icon = ' ↗';
                if (isVictim) icon = ' 🔥';
                return `${d.value.toFixed(1)}${icon}  (${(d.leverage * 100).toFixed(0)}%)`;
              }
            },
            barWidth: '60%'
          }
        ]
      };
    } else {
      // Scatter / Quadrant Mode
      const scatterData = sortedData.map((d: any) => {
        return {
          name: d.motivation,
          value: [d.socialVolume, d.premium_rate, d.efficiency_score],
          leverage: d.leverage,
          anchors: d.anchors,
          _customData: d._customData,
          itemStyle: {
            color: colors.terracotta,
            opacity: activeMotivation && activeMotivation !== d.motivation ? 0.3 : 0.8
          }
        };
      });

      // Prepare anchor lines data
      const lineData: any[] = [];
      const anchorPoints: any[] = [];
      
      scatterData.forEach((d) => {
        if (d.anchors && d.anchors.premium_leader && d.anchors.value_disruptor) {
          // Mock positions for anchors around the motivation center
          const pY = d.value[1] + 15; // Premium leader higher Y
          const pX = d.value[0] * 1.1;
          const vY = d.value[1] - 15; // Value disruptor lower Y
          const vX = d.value[0] * 0.9;
          
          lineData.push({
            coords: [[vX, vY], [pX, pY]],
            lineStyle: { type: 'dashed', color: colors.coral, width: 1, opacity: 0.6 }
          });
          
          anchorPoints.push({
            name: d.anchors.premium_leader,
            value: [pX, pY],
            itemStyle: { color: colors.terracotta },
            symbolSize: 8,
            label: { show: true, formatter: '{b}', position: 'top', color: colors.terracotta, fontSize: 10, fontWeight: 'bold' }
          });
          
          anchorPoints.push({
            name: d.anchors.value_disruptor,
            value: [vX, vY],
            itemStyle: { color: colors.oliveGray },
            symbolSize: 8,
            label: { show: true, formatter: '{b}', position: 'bottom', color: colors.oliveGray, fontSize: 10 }
          });
        }
      });

      return {
        backgroundColor: 'transparent',
        title: [
          { text: '社交效能复合矩阵', textStyle: chartTitleStyle, top: 10, left: 10 },
          { text: activeSection || '全景视角', textStyle: { color: colors.stoneGray, fontSize: 12, fontWeight: 400 }, top: 14, right: 180 }
        ],
        grid: { left: '10%', right: '10%', bottom: '10%', top: '25%', containLabel: true },
        xAxis: { 
          type: 'value', 
          name: '社交声量 (Social Mentions)', 
          nameTextStyle: { color: colors.stoneGray },
          axisLine: { lineStyle: { color: '#e8e6dc' } },
          axisLabel: { color: colors.stoneGray },
          splitLine: { show: false }
        },
        yAxis: { 
          type: 'value', 
          name: 'ROI (溢价率 %)', 
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
            if (params.seriesName === 'Anchors') return `<div style="padding: 4px;">${params.data.name}</div>`;
            
            const d = params.data;
            if (!d || !d.value) return '';

            const diagnosis = getDiagnosis(d.leverage, d.value[0], d.value[1]);
            
            let html = `<div style="font-family: Arial, sans-serif; padding: 4px; max-width: 280px; white-space: normal;">`;
            html += `<div style="font-weight: bold; border-bottom: 1px solid #e8e6dc; padding-bottom: 4px; margin-bottom: 8px;">${d.name}</div>`;
            html += `<div style="margin-bottom: 4px;"><span style="color: #87867f">社交声量:</span> ${d.value[0].toFixed(0)}</div>`;
            html += `<div style="margin-bottom: 4px;"><span style="color: #87867f">ROI 溢价:</span> ${d.value[1] > 0 ? '+' : ''}${d.value[1].toFixed(1)}%</div>`;
            html += `<div style="margin-bottom: 8px;"><span style="color: #87867f">杠杆百分比:</span> ${(d.leverage * 100).toFixed(0)}%</div>`;
            
            if (d.anchors) {
              html += `<div style="margin-top: 8px; font-size: 12px; color: #5e5d59;">溢价王: <span style="color: #c96442; font-weight: bold;">${d.anchors.premium_leader}</span></div>`;
              html += `<div style="font-size: 12px; color: #5e5d59;">平权王: <span style="color: #87867f; font-weight: bold;">${d.anchors.value_disruptor}</span></div>`;
            }

            html += `<div style="color: #c96442; font-size: 12px; line-height: 1.4; border-top: 1px dashed #e8e6dc; padding-top: 8px; margin-top: 8px;"><b>商业处方签:</b><br/>${diagnosis}</div>`;
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
              return Math.max(15, data[2] * 10); // scale by efficiency score
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
              lineStyle: { color: colors.stoneGray, type: 'dashed', opacity: 0.5 },
              data: [
                { type: 'average', name: 'Avg Y', valueIndex: 1 },
                { type: 'average', name: 'Avg X', valueIndex: 0 }
              ]
            },
            data: scatterData
          },
          {
            name: 'AnchorLines',
            type: 'lines',
            zlevel: 1,
            data: lineData
          },
          {
            name: 'Anchors',
            type: 'scatter',
            zlevel: 2,
            data: anchorPoints
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
      <div className="mb-10">
        <h2 className="text-[32px] leading-[1.10] font-serif font-medium text-near-black mb-3">Macro Insight Hub</h2>
        <p className="text-olive-gray font-sans text-lg">从宏观趋势下探消费实体的全景观测站。</p>
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
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            <div className="bg-warm-sand rounded-lg p-1 flex gap-1">
              <button 
                onClick={() => setMatrixViewMode('bar')}
                className={`px-3 py-1 rounded text-xs transition-colors font-sans ${matrixViewMode === 'bar' ? 'bg-ivory text-near-black shadow-sm' : 'text-stone-gray hover:text-near-black'}`}
              >
                动态能量柱
              </button>
              <button 
                onClick={() => setMatrixViewMode('quadrant')}
                className={`px-3 py-1 rounded text-xs transition-colors font-sans ${matrixViewMode === 'quadrant' ? 'bg-ivory text-near-black shadow-sm' : 'text-stone-gray hover:text-near-black'}`}
              >
                ROI 象限
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
