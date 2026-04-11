export interface Brand {
  id: string;
  brand_name: string; // usually "中文名 (EnglishName)"
  brand_name_zh: string; // extracted Chinese name
  brand_name_en: string; // extracted English name
  core_product: string;
  gmv_val: number;
  premium_rate: number;
  section: string;
  motivation: string;
  prescription: string;
  topics: { topic_name: string; views: string; sentiment_score: string }[];
  cross_motivations: string[];
  
  // Analytics Fields
  cagr_val: number;
  cagr_str: string;
  brand_gmv: string;
  brand_cagr: string;
  data_source?: string;
  capital_index: number;
  brand_sov: string;
  search_index: string;
  
  // New Enhanced Fields
  brand_growth: number;
  loyalty: number;
  null_reason?: string;
  role?: '巨头' | '黑马' | '卷王' | 'NPC';
}

export interface MotivationDensity {
  key: string;
  section: string;
  brand_count: number;
  percentage: string;
  top_representatives: {
    brand: string;
    product: string;
    value: number;
    metric: string;
    data_source: string;
  }[];
}

export interface SocialEfficiency {
  motivation: string;
  section: string;
  efficiency_score: number;
  hot_topics: string[];
}

export interface PremiumBenchmarking {
  motivation: string;
  section: string;
  avg_premium_rate: string;
  anchors: {
    premium_leader: string;
    value_disruptor: string;
  };
}

export interface AnalysisSummary {
  summary_metadata: any;
  motivation_density: MotivationDensity[];
  premium_benchmarking: PremiumBenchmarking[];
  social_efficiency: SocialEfficiency[];
}
