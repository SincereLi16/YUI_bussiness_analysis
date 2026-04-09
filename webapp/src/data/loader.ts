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

export const getBrands = (): Brand[] => {
  const brands: Brand[] = [];
  
  mergedData.forEach((category: any) => {
    const motivation = category.motivation;
    const section = category.section;
    const prescription = category.prescription || '';
    
    if (category.brands && Array.isArray(category.brands)) {
      category.brands.forEach((b: any, index: number) => {
        // Calculate total GMV for the brand's products
        const totalGmv = (b.products || []).reduce((acc: number, p: any) => {
          return acc + extractGmv(p.gmv);
        }, 0);
        
        // Find core product name (first product or fallback)
        const coreProduct = b.products && b.products.length > 0 
          ? b.products[0].product_name 
          : 'N/A';

        brands.push({
          id: `${motivation}-${b.brand_name}-${index}`,
          brand_name: b.brand_name,
          core_product: coreProduct,
          gmv_val: totalGmv,
          premium_rate: extractPremiumRate(b.premium_rate),
          section: section,
          motivation: motivation,
          prescription: prescription,
          topics: b.topics || [],
          cross_motivations: b.cross_motivations || []
        });
      });
    }
  });
  
  return brands;
};

export const getAnalysisSummary = (): AnalysisSummary => {
  return analysisData as unknown as AnalysisSummary;
};
