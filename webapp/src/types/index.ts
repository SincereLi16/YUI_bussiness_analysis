export interface Brand {
  id: string;
  brand_name: string;
  core_product: string;
  gmv_val: number;
  premium_rate: number;
  section: string;
  motivation: string;
  prescription: string;
  topics: { topic_name: string; views: string; sentiment_score: string }[];
  cross_motivations: string[];
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
