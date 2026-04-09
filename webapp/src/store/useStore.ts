import { create } from 'zustand';
import { Brand } from '../types';
import { getBrands, getAnalysisSummary } from '../data/loader';

const allBrands = getBrands();
const analysisSummary = getAnalysisSummary();

interface AppState {
  // Global Data
  allBrands: Brand[];
  filteredBrands: Brand[];
  analysisSummary: any;
  
  // UI State
  activeSection: string | null;
  activeMotivation: string | null;
  
  // Actions
  setActiveSection: (section: string | null) => void;
  setActiveMotivation: (motivation: string | null) => void;
}

// 核心过滤逻辑：基于板块和动机过滤品牌
const filterBrands = (section: string | null, motivation: string | null): Brand[] => {
  let filtered = [...allBrands];

  // 1. 板块过滤
  if (section) {
    filtered = filtered.filter(b => b.section === section);
  }
  
  // 2. 动机过滤 (支持模糊匹配，应对拆分后的动机)
  if (motivation) {
    filtered = filtered.filter(b => 
      b.motivation.includes(motivation) || 
      b.cross_motivations?.some(m => m.includes(motivation))
    );
  }

  return filtered;
};

export const useStore = create<AppState>((set) => ({
  allBrands,
  filteredBrands: allBrands,
  analysisSummary,
  
  activeSection: null,
  activeMotivation: null,

  setActiveSection: (section: string | null) => {
    set((state) => ({
      activeSection: section,
      filteredBrands: filterBrands(section, state.activeMotivation)
    }));
  },

  setActiveMotivation: (motivation: string | null) => {
    set((state) => ({
      activeMotivation: motivation,
      filteredBrands: filterBrands(state.activeSection, motivation)
    }));
  }
}));
