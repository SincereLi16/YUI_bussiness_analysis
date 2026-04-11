import { create } from 'zustand';
import { Brand } from '../types';
import { getBrands, getAnalysisSummary, getMacroData, MacroData } from '../data/loader';

const allBrands = getBrands();
const analysisSummary = getAnalysisSummary();
const macroDataList = getMacroData();

interface SortConfig {
  key: 'gmv_val' | 'brand_growth' | 'premium_rate' | 'default';
  direction: 'asc' | 'desc';
}

interface AppState {
  // Global Data
  allBrands: Brand[];
  filteredBrands: Brand[];
  analysisSummary: any;
  macroData: MacroData[];
  
  // UI State
  activeSection: string | null;
  activeMotivation: string | null;
  activeRole: string | null;
  searchQuery: string;
  sortConfig: SortConfig;
  
  // Actions
  setActiveSection: (section: string | null) => void;
  setActiveMotivation: (motivation: string | null) => void;
  setActiveRole: (role: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortConfig: (config: SortConfig) => void;
}

// 核心过滤逻辑：基于板块和动机过滤品牌
const filterBrands = (
  section: string | null, 
  motivation: string | null, 
  role: string | null,
  searchQuery: string, 
  sortConfig: SortConfig
): Brand[] => {
  let filtered = [...allBrands];

  // 1. 板块过滤 (考虑到主标签或副标签对应的板块)
  if (section) {
    const definedMotivations: Record<string, string[]> = {
      '智性决策': ['科技平权', '信息平权', '秩序与掌控感', '生产力与效率', '舒适感'],
      '情绪补偿': ['多巴胺', '玄学叙事', '精致美学', '悦己主义', 'Gap', '懒人经济', '孤独焦虑', '创造探索'],
      '身份叙事': ['Lifestyle', '圈层共振', '社交货币', '小众DIY', '文化根脉']
    };
    const targetMotivations = definedMotivations[section] || [];
    
    filtered = filtered.filter(b => {
      const isPrimaryInSection = b.section === section;
      const isCrossInSection = b.cross_motivations?.some(m => targetMotivations.includes(m));
      return isPrimaryInSection || isCrossInSection;
    });
  }
  
  // 2. 动机过滤 (支持模糊匹配，应对拆分后的动机，包括副标签)
  if (motivation) {
    filtered = filtered.filter(b => 
      b.motivation.includes(motivation) || 
      b.cross_motivations?.some(m => m.includes(motivation))
    );
  }

  // 3. 商业地位 (Role) 过滤
  if (role) {
    filtered = filtered.filter(b => b.role === role);
  }

  // 4. 搜索过滤
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(b => 
      b.brand_name_zh.toLowerCase().includes(query) || 
      b.brand_name_en.toLowerCase().includes(query) ||
      b.brand_name.toLowerCase().includes(query)
    );
  }

  // 5. 排序引擎
  if (sortConfig.key !== 'default') {
    filtered.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof Brand];
      let valB: any = b[sortConfig.key as keyof Brand];

      valA = Number(valA) || 0;
      valB = Number(valB) || 0;

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return filtered;
};

export const useStore = create<AppState>((set) => ({
  allBrands,
  filteredBrands: allBrands,
  analysisSummary,
  macroData: macroDataList,
  
  activeSection: null,
  activeMotivation: null,
  activeRole: null,
  searchQuery: '',
  sortConfig: { key: 'default', direction: 'desc' },

  setActiveSection: (section: string | null) => {
    set((state) => {
      // 当板块切换时，清空当前激活的动机，避免冲突
      const newMotivation = null;
      return {
        activeSection: section,
        activeMotivation: newMotivation,
        filteredBrands: filterBrands(section, newMotivation, state.activeRole, state.searchQuery, state.sortConfig)
      };
    });
  },

  setActiveMotivation: (motivation: string | null) => {
    set((state) => ({
      activeMotivation: motivation,
      filteredBrands: filterBrands(state.activeSection, motivation, state.activeRole, state.searchQuery, state.sortConfig)
    }));
  },

  setActiveRole: (role: string | null) => {
    set((state) => ({
      activeRole: role,
      filteredBrands: filterBrands(state.activeSection, state.activeMotivation, role, state.searchQuery, state.sortConfig)
    }));
  },

  setSearchQuery: (query: string) => {
    set((state) => ({
      searchQuery: query,
      filteredBrands: filterBrands(state.activeSection, state.activeMotivation, state.activeRole, query, state.sortConfig)
    }));
  },

  setSortConfig: (config: SortConfig) => {
    set((state) => ({
      sortConfig: config,
      filteredBrands: filterBrands(state.activeSection, state.activeMotivation, state.activeRole, state.searchQuery, config)
    }));
  }
}));
