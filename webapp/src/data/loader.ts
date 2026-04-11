import { Brand, AnalysisSummary } from '../types';
import analysisData from './analysis_summary.json';
import mergedData from './merged_consumer_data_rag.json';

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
        // Extract from new schema fields
        const totalGmv = b.brand_gmv ? extractGmv(b.brand_gmv) : 0;
        const brandGrowth = b.brand_cagr ? extractCagr(b.brand_cagr) : 0;
        
        // Find core product name (first product or fallback)
        const coreProduct = b.products && b.products.length > 0 
          ? b.products[0].product_name 
          : 'N/A';

        // Extract ZH and EN names directly from JSON fields (populated by data cleaning script)
        let brandNameZh = b.brand_name_zh || b.brand_name;
        let brandNameEn = b.brand_name_en || '';

        brands.push({
          id: `${motivation}-${b.brand_name}-${index}`,
          brand_name: b.brand_name,
          brand_name_zh: brandNameZh,
          brand_name_en: brandNameEn,
          core_product: coreProduct,
          gmv_val: totalGmv,
          premium_rate: extractPremiumRate(b.premium_rate),
          section: section,
          motivation: motivation,
          prescription: prescription,
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
    // Extract valid GMVs (greater than 0, ignoring nulls)
    const validGmvs = brands.map(b => b.gmv_val).filter(g => g > 0).sort((a, b) => b - a);
    
    // Top 20% GMV Threshold
    const top20Index = Math.max(0, Math.floor(validGmvs.length * 0.2) - 1);
    const top20GmvThreshold = validGmvs.length > 0 ? validGmvs[top20Index] : Infinity;

    brands.forEach(b => {
      const gmv = b.gmv_val;
      const growth = b.brand_growth; // Note: Ensure brand_growth is parsed correctly below
      const premium = b.premium_rate;

      // Ensure b.brand_growth is correctly extracted from brand_cagr
      const cagrExtracted = extractCagr(b.brand_cagr || '');
      b.brand_growth = cagrExtracted;
      const actualGrowth = cagrExtracted;

      if (gmv >= top20GmvThreshold && gmv > 0) {
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
