import { Brand, AnalysisSummary } from '../types';
import analysisData from './analysis_summary.json';
import mergedData from './merged_consumer_data_rag.json';
import explanationsData from './brand_explanations.json';

// Extract number from strings like "21.5 亿元"
const extractGmv = (gmvStr: string): number => {
  if (!gmvStr) return 0;
  const match = gmvStr.match(/([0-9.]+)\s*亿/);
  return match ? parseFloat(match[1]) : 0;
};

// Extract premium rate from strings like "-65% (...)"
const extractPremiumRate = (rateStr: string): number => {
  if (!rateStr) return 0;
  const match = rateStr.match(/(-?\d+(?:\.\d+)?)%/);
  return match ? parseFloat(match[1]) : 0;
};

// Extract CAGR from strings like "15.5% [数据来源: IDC]"
const extractCagr = (cagrStr: string): number => {
  if (!cagrStr) return 0;
  const match = cagrStr.match(/(-?[0-9.]+)%/);
  return match ? parseFloat(match[1]) : 0;
};

export const getBrands = (): Brand[] => {
  const brands: Brand[] = [];
  
  mergedData.forEach((category: any) => {
    const motivation = category.motivation;
    const section = category.section;
    const prescription = category.prescription || '';
    const marketContext = category.market_context || {};
    
    // Default to 0 if not found, parse capital index (e.g. "5" -> 5)
    const cagrStr = marketContext.cagr || '';
    const cagrVal = extractCagr(cagrStr);
    const capitalIndex = parseInt(marketContext.capital_index) || 0;
    
    if (category.brands && Array.isArray(category.brands)) {
      category.brands.forEach((b: any, index: number) => {
        const id = `${motivation}-${b.brand_name}-${index}`;
        // Use pre-generated explanation if available, otherwise fallback to prescription
        let explanation = (explanationsData as Record<string, string>)[id];
        // 去掉所有中文双引号和英文双引号
        if (explanation) {
          explanation = explanation.replace(/["“”]/g, '');
        }
        const displayPrescription = explanation || prescription;

        // Extract total GMV from the new string field or fallback
        const totalGmv = extractGmv(b.brand_gmv) || b.products?.reduce((sum: number, p: any) => sum + (p.gmv || 0), 0) || 0;
        const brandGrowth = b.brand_cagr ? extractCagr(b.brand_cagr) : 0;
        
        // Find core product name (first product or fallback)
        const coreProduct = b.products?.[0]?.product_name || '综合产品';

        // Extract ZH and EN names directly from JSON fields (populated by data cleaning script)
        let brandNameZh = b.brand_name_zh || b.brand_name;
        let brandNameEn = b.brand_name_en || '';
        let originalBrandName = b.brand_name;

        // Apply renaming rule
        const renameMap: Record<string, string> = {
          "少年工程": "TE",
          "M": "M Stand",
          "Manner Coffee": "manner",
          "manner coffee": "manner",
          "HOKA ONE ONE": "Hoka",
          "Hoka one one": "Hoka",
          "Meizu PANDAER": "潘达尔",
          "魅族Pandaer": "潘达尔",
          "透明音箱": "Transparent"
        };

        if (renameMap[brandNameZh]) brandNameZh = renameMap[brandNameZh];
        if (renameMap[brandNameEn]) brandNameEn = renameMap[brandNameEn];
        if (renameMap[originalBrandName]) originalBrandName = renameMap[originalBrandName];

        brands.push({
          id: id,
          brand_name: originalBrandName,
          brand_name_zh: brandNameZh,
          brand_name_en: brandNameEn,
          core_product: coreProduct,
          gmv_val: totalGmv,
          premium_rate: extractPremiumRate(b.premium_rate),
          section: section,
          motivation: motivation,
          prescription: displayPrescription,
          topics: b.topics || [],
          cross_motivations: b.cross_motivations || [],
          cagr_val: cagrVal,
          cagr_str: cagrStr,
          brand_gmv: b.brand_gmv || '',
          brand_cagr: b.brand_cagr || '',
          data_source: b.data_source || '',
          capital_index: capitalIndex,
          brand_sov: b.brand_sov || 'N/A',
          search_index: b.search_index || 'N/A',
          brand_growth: brandGrowth,
          loyalty: b.loyalty || 75,
          null_reason: b.null_reason
        });
      });
    }
  });
  
  // --- Role Calculation (V4.0 Simplified Logic) ---
  if (brands.length > 0) {
    brands.forEach(b => {
      const gmv = b.gmv_val;
      const premium = b.premium_rate;

      // Ensure b.brand_growth is correctly extracted from brand_cagr
      const cagrExtracted = extractCagr(b.brand_cagr || '');
      b.brand_growth = cagrExtracted;
      const actualGrowth = cagrExtracted;

      if (gmv > 20) {
        b.role = '巨头';
      } else if (actualGrowth >= 20) {
        b.role = '黑马';
      } else if (premium < 0) {
        b.role = '卷王';
      } else {
        b.role = 'NPC';
      }
    });
  }
  
  return brands;
};

export const getAnalysisSummary = (): AnalysisSummary => {
  return analysisData as unknown as AnalysisSummary;
};

export interface MacroData {
  motivation: string;
  section: string;
  market_size: string;
  market_size_val: number;
  cagr: string;
  cagr_val: number;
  capital_index: number;
}

export const getMacroData = (): MacroData[] => {
  const macros: MacroData[] = [];
  mergedData.forEach((category: any) => {
    const marketContext = category.market_context || {};
    
    // Parse numeric sizes from something like "2730 亿元 (2025E)"
    let sizeVal = 0;
    const sizeMatch = (marketContext.market_size || '').match(/([0-9,.]+)/);
    if (sizeMatch) {
      sizeVal = parseFloat(sizeMatch[1].replace(/,/g, ''));
    }
    
    macros.push({
      motivation: category.motivation,
      section: category.section,
      market_size: marketContext.market_size || 'N/A',
      market_size_val: sizeVal,
      cagr: marketContext.cagr || 'N/A',
      cagr_val: extractCagr(marketContext.cagr),
      capital_index: parseInt(marketContext.capital_index) || 0
    });
  });
  return macros;
};
