'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactECharts from 'echarts-for-react';
import { useStore } from '../store/useStore';
import { BrandModal } from './BrandModal';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type AuditJson = {
  stage: 'need_info' | 'audited';
  missing?: Array<'category' | 'value_prop' | 'pricing' | 'section'>;
  extracted?: {
    category?: string;
    value_prop?: string;
    pricing?: string;
  };
  section?: '智性决策' | '情绪补偿' | '身份叙事';
  competitor_a?: string;
  competitor_b?: string;
  scores?: {
    social_leverage?: number;
    growth_momentum?: number;
    premium_position?: number;
    narrative_depth?: number;
    moat_depth?: number;
  };
  diagnostic?: {
    edge?: string;
    gap?: string;
    strategy?: string;
  };
};

// Brand Badge Component for Smart Entity Recognition
const BrandBadge = ({ name, onClick }: { name: string, onClick: () => void }) => {
  const allBrands = useStore((state) => state.allBrands);
  const brand = allBrands.find(b => b.brand_name_zh === name || b.brand_name_en === name || b.brand_name === name);
  
  if (!brand) return <span className="font-medium text-near-black">{name}</span>;

  const sectionColorMap: Record<string, string> = {
    '智性决策': 'bg-focus-blue/10 text-focus-blue border-focus-blue/20', // Tech blue
    '情绪补偿': 'bg-coral/10 text-coral border-coral/20',                 // Healing orange/coral
    '身份叙事': 'bg-terracotta/10 text-terracotta border-terracotta/20'   // Identity terracotta
  };

  const badgeColor = sectionColorMap[brand.section] || 'bg-warm-sand text-near-black border-border-cream';

  return (
    <button 
      onClick={onClick}
      className={`inline-flex items-center px-1.5 py-0.5 mx-1 rounded-[6px] border text-[13px] font-medium transition-all hover:shadow-sm hover:-translate-y-0.5 ${badgeColor}`}
    >
      {name}
    </button>
  );
};

export const AISearchBar = () => {
  const [mode, setMode] = useState<'casual' | 'audit'>('casual');
  const [input, setInput] = useState('');
  const [casualMessages, setCasualMessages] = useState<Message[]>([]);
  const [auditMessages, setAuditMessages] = useState<Message[]>([]);
  const [auditState, setAuditState] = useState<AuditJson | null>(null);
  
  const messages = mode === 'casual' ? casualMessages : auditMessages;
  const setModeMessages = mode === 'casual' ? setCasualMessages : setAuditMessages;

  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBrandForModal, setSelectedBrandForModal] = useState<any | null>(null);
  
  const allBrands = useStore((state) => state.allBrands);
  const macroData = useStore((state) => state.macroData);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const typeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper to extract JSON from markdown stream
  const extractAuditJson = (content: string): { visible: string; audit?: AuditJson } => {
    if (!content) return { visible: content };
    
    // First try ```audit_json, then try ```json if the former is not found
    let startIndex = content.indexOf('```audit_json');
    let offset = 13;
    
    if (startIndex === -1) {
      const lastJsonIndex = content.lastIndexOf('```json');
      if (lastJsonIndex !== -1) {
         startIndex = lastJsonIndex;
         offset = 7;
      }
    }

    if (startIndex !== -1) {
      const visible = content.slice(0, startIndex).trimEnd();
      
      const endIndex = content.indexOf('```', startIndex + offset);
      let jsonText = '';
      if (endIndex !== -1) {
        jsonText = content.slice(startIndex + offset, endIndex).trim();
      } else {
        jsonText = content.slice(startIndex + offset).trim();
      }
      
      if (jsonText) {
        try {
          const parsed = JSON.parse(jsonText) as AuditJson;
          return { visible, audit: parsed };
        } catch {
          // Try to fix trailing commas or incomplete JSON at the end
          try {
             const fixedJson = jsonText.replace(/,\s*([}\]])/g, '$1');
             const parsed = JSON.parse(fixedJson) as AuditJson;
             return { visible, audit: parsed };
          } catch(e) {
             return { visible };
          }
        }
      }
      return { visible };
    }
    return { visible: content };
  };

  // Helper to find brand by name
  const findBrand = (name: string) => {
    return allBrands.find(b => 
      b.brand_name_zh === name || 
      b.brand_name_en === name || 
      b.brand_name === name
    );
  };

  // Preload the GIF image to prevent blinking when switching
  useEffect(() => {
    const img = new Image();
    img.src = '/assistant_thinking.gif';
  }, []);

  // Handle mode switch cleanup
  useEffect(() => {
    setInput('');
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setAuditState(null);
  }, [mode]);

  // Scroll to bottom when messages change, unless user manually scrolled up
  useEffect(() => {
    if (messagesEndRef.current && !isUserScrolling.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Check if user has scrolled up from the bottom
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    isUserScrolling.current = !isAtBottom;
  };

  const formatMessageWithBrands = (content: string) => {
    if (!content) return content;
    
    // Sort brands by length (longest first) to prevent partial matching 
    // (e.g., matching "Apple" inside "Apple Store")
    const sortedBrands = [...allBrands].sort((a, b) => b.brand_name_zh.length - a.brand_name_zh.length);
    
    // Create an array to hold the React elements
    const elements: React.ReactNode[] = [];
    let remainingText = content;
    let keyIndex = 0;

    // This is a simplified approach for React rendering without complex regex state management
    while (remainingText.length > 0) {
      let earliestMatchIndex = -1;
      let matchedBrand: any = null;

      // Find the earliest occurring brand in the remaining text
      for (const brand of sortedBrands) {
        const idx = remainingText.indexOf(brand.brand_name_zh);
        if (idx !== -1 && (earliestMatchIndex === -1 || idx < earliestMatchIndex)) {
          earliestMatchIndex = idx;
          matchedBrand = brand;
        }
      }

      if (matchedBrand && earliestMatchIndex !== -1) {
        // Add the text before the match
        if (earliestMatchIndex > 0) {
          elements.push(<span key={`text-${keyIndex++}`}>{remainingText.slice(0, earliestMatchIndex)}</span>);
        }
        
        // Add the brand badge
        elements.push(
          <BrandBadge 
            key={`badge-${keyIndex++}`} 
            name={matchedBrand.brand_name_zh} 
            onClick={() => setSelectedBrandForModal(matchedBrand)} 
          />
        );
        
        // Update remaining text
        remainingText = remainingText.slice(earliestMatchIndex + matchedBrand.brand_name_zh.length);
      } else {
        // No more brands found, add the rest of the text
        elements.push(<span key={`text-${keyIndex++}`}>{remainingText}</span>);
        break;
      }
    }

    return elements;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      
      const form = e.currentTarget.form;
      if (form) {
         form.requestSubmit();
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (mode === 'audit') setAuditState(null);
    
    const userMessage = input.trim();
    setInput('');
    setIsOpen(true);
    setIsLoading(true);

    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: 'user', content: userMessage }
    ];
    setModeMessages(newMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, mode }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error(response.statusText);

      // Create a placeholder for the assistant's message
      const assistantMessageId = (Date.now() + 1).toString();
      setModeMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let receivedText = '';
      let displayedLength = 0;
      let isDone = false;
      let isTypingStarted = false;

      typeIntervalRef.current = setInterval(() => {
        if (!isTypingStarted) {
          // Wait until we have enough buffer or stream is done
          if (receivedText.length >= 10 || isDone) {
            isTypingStarted = true;
          } else {
            return;
          }
        }
        
        if (displayedLength < receivedText.length) {
          const backlog = receivedText.length - displayedLength;
          // Smooth and dynamic typing speed
          const step = backlog > 80 ? 12 : backlog > 30 ? 6 : 2;
          displayedLength = Math.min(receivedText.length, displayedLength + step);
          
          setModeMessages(prev => {
            const newMsgs = [...prev];
            const idx = newMsgs.findIndex(m => m.id === assistantMessageId);
            if (idx !== -1) {
              const currentContent = receivedText.slice(0, displayedLength);
              if (mode === 'audit') {
                const { visible, audit } = extractAuditJson(currentContent);
                if (audit) setAuditState(audit);
                newMsgs[idx] = { ...newMsgs[idx], content: visible };
              } else {
                newMsgs[idx] = { ...newMsgs[idx], content: currentContent };
              }
            }
            return newMsgs;
          });
        } else if (isDone && displayedLength === receivedText.length) {
          if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
          
          // Final extraction pass
          if (mode === 'audit') {
            const { visible, audit } = extractAuditJson(receivedText);
            if (audit) setAuditState(audit);
            setModeMessages(prev => {
              const newMsgs = [...prev];
              const idx = newMsgs.findIndex(m => m.id === assistantMessageId);
              if (idx !== -1) {
                newMsgs[idx] = { ...newMsgs[idx], content: visible };
              }
              return newMsgs;
            });
          }
        }
      }, 30); // ~33fps smooth updating
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            isDone = true;
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                isDone = true;
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                const text = parsed.choices[0]?.delta?.content || '';
                if (text) {
                  receivedText += text;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error('Error fetching chat:', error);
      setModeMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: '抱歉老板，服务器开小差了，请稍后再试。' 
      }]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const auditCharts = React.useMemo(() => {
    if (mode !== 'audit') return null;
    if (!auditState || auditState.stage !== 'audited' || !auditState.section) return null;

    const colors = {
      terracotta: '#c96442',
      coral: '#d97757',
      oliveGray: '#5e5d59',
      stoneGray: '#87867f',
      nearBlack: '#141413',
      ivory: '#faf9f5',
      parchment: '#f5f4ed',
      borderCream: '#f0eee6',
      darkHorse: '#2C3E50', // dark slate for Competitor A
      giant: '#E67E22'      // orange/terracotta for Competitor B
    };

    const section = auditState.section?.trim();
    const sectionBrands = allBrands.filter(b => b.section === section);
    if (sectionBrands.length === 0) return null;

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    // Normalization bounds
    const maxPremium = Math.max(...sectionBrands.map(b => b.premium_rate || 0), 1);
    const minPremium = Math.min(...sectionBrands.map(b => b.premium_rate || 0), 0);
    const maxGrowth = Math.max(...sectionBrands.map(b => b.brand_growth || 0), 1);
    const minGrowth = Math.min(...sectionBrands.map(b => b.brand_growth || 0), 0);
    const maxGmv = Math.max(...sectionBrands.map(b => b.gmv_val || 0), 1);
    const minGmv = Math.min(...sectionBrands.map(b => b.gmv_val || 0), 0);

    const normalize = (v: number, min: number, max: number) => {
      if (!isFinite(v) || !isFinite(min) || !isFinite(max)) return 50;
      if (max <= min) return 50;
      return clamp(((v - min) / (max - min)) * 100, 0, 100);
    };

    const getBrandScores = (b: any) => {
      if (!b) return [0, 0, 0, 0, 0];
      const premium = b.premium_rate || 0;
      const growth = b.brand_growth || 0;
      const gmv = b.gmv_val || 0;
      
      const narrative = normalize(premium, minPremium, maxPremium);
      const momentum = normalize(growth, minGrowth, maxGrowth);
      const social = normalize(gmv, minGmv, maxGmv);
      const moat = clamp((narrative + momentum) / 2 + 10, 0, 100);
      const penetration = clamp(100 - narrative + 10, 0, 100);

      // Radar mapped to: social_leverage, growth_momentum, premium_position, narrative_depth, moat_depth
      return [social, momentum, narrative, penetration, moat];
    };

    // User concept scores
    const userScores = auditState.scores || {};
    const uSocial = clamp(userScores.social_leverage ?? 50, 0, 100);
    const uGrowth = clamp(userScores.growth_momentum ?? 50, 0, 100);
    const uPremium = clamp(userScores.premium_position ?? 50, 0, 100);
    const uNarrative = clamp(userScores.narrative_depth ?? 50, 0, 100);
    const uMoat = clamp(userScores.moat_depth ?? 50, 0, 100);
    const userData = [uSocial, uGrowth, uPremium, uNarrative, uMoat];

    // Competitors
    const compA = findBrand(auditState.competitor_a || '');
    const compB = findBrand(auditState.competitor_b || '');
    
    const compAData = getBrandScores(compA);
    const compBData = getBrandScores(compB);

    const radarOption = {
      backgroundColor: 'transparent',
      title: {
        text: '对标雷达',
        left: 10,
        top: 10,
        textStyle: { color: colors.nearBlack, fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: 18 }
      },
      legend: {
        bottom: 10,
        data: ['你的概念', `黑马: ${compA?.brand_name_zh || '未知'}`, `巨头: ${compB?.brand_name_zh || '未知'}`],
        textStyle: { color: colors.oliveGray, fontFamily: 'Arial, sans-serif' }
      },
      radar: {
        indicator: [
          { name: '社交效能', max: 100, min: 0 },
          { name: '增长动能', max: 100, min: 0 },
          { name: '溢价站位', max: 100, min: 0 },
          { name: '叙事厚度', max: 100, min: 0 },
          { name: '防御深度', max: 100, min: 0 }
        ],
        splitNumber: 4,
        axisName: { color: colors.oliveGray, fontSize: 12, fontFamily: 'Arial, sans-serif' },
        splitLine: { lineStyle: { color: colors.borderCream } },
        splitArea: { areaStyle: { color: ['rgba(250,249,245,0.45)', 'rgba(250,249,245,0.15)'] } },
        axisLine: { lineStyle: { color: colors.borderCream } }
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: userData,
              name: '你的概念',
              areaStyle: { color: 'rgba(217,119,87,0.4)' },
              lineStyle: { color: colors.coral, width: 2 },
              itemStyle: { color: colors.coral }
            },
            {
              value: compAData,
              name: `黑马: ${compA?.brand_name_zh || '未知'}`,
              areaStyle: { color: 'rgba(44,62,80,0.2)' },
              lineStyle: { color: colors.darkHorse, width: 2, type: 'dashed' },
              itemStyle: { color: colors.darkHorse }
            },
            {
              value: compBData,
              name: `巨头: ${compB?.brand_name_zh || '未知'}`,
              areaStyle: { color: 'rgba(230,126,34,0.2)' },
              lineStyle: { color: colors.giant, width: 2, type: 'dotted' },
              itemStyle: { color: colors.giant }
            }
          ]
        }
      ]
    };

    // Diagnostic Grid Table Data
    const tableData = [
      {
        name: compA?.brand_name_zh || '未知(黑马)',
        gmv: compA?.gmv_val ? `${compA.gmv_val.toFixed(1)}亿` : 'N/A',
        cagr: compA?.brand_growth ? `${compA.brand_growth.toFixed(1)}%` : 'N/A',
        premium: compA?.premium_rate ? `${compA.premium_rate.toFixed(1)}%` : 'N/A',
        brand: compA
      },
      {
        name: compB?.brand_name_zh || '未知(巨头)',
        gmv: compB?.gmv_val ? `${compB.gmv_val.toFixed(1)}亿` : 'N/A',
        cagr: compB?.brand_growth ? `${compB.brand_growth.toFixed(1)}%` : 'N/A',
        premium: compB?.premium_rate ? `${compB.premium_rate.toFixed(1)}%` : 'N/A',
        brand: compB
      }
    ];

    return {
      section,
      radarOption,
      tableData,
      diagnostic: auditState.diagnostic
    };
  }, [mode, auditState, allBrands, macroData]);

  // 动态打字机效果标题 (Typewriter effect for the title)
  const titleText = isLoading 
    ? (mode === 'audit' ? "竞争分析中..." : "容先贤想想...") 
    : "哪里不懂的问问先贤";
  const [displayedTitle, setDisplayedTitle] = useState("");
  
  useEffect(() => {
    setDisplayedTitle(""); // Reset when text changes
    let i = 0;
    const timer = setInterval(() => {
      if (i < titleText.length) {
        setDisplayedTitle(titleText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 60); // Typewriter speed (ms per character)
    
    return () => clearInterval(timer);
  }, [titleText]);

  return (
    <div className="w-full max-w-[1400px] h-[calc(100vh-60px)] flex flex-col md:flex-row mx-auto px-4 md:px-12 py-4 md:py-8 relative overflow-hidden">
      {/* 左侧/顶部 固定展示区 (Fixed Avatar Area) */}
      <div className={`flex flex-col items-center md:items-start justify-start pt-0 md:pt-4 shrink-0 w-full md:w-[360px] transition-all duration-500 ease-in-out md:pr-12 md:-ml-8 ${
        messages.length > 0 
          ? 'h-0 md:h-full opacity-0 md:opacity-100 overflow-hidden md:overflow-visible mb-0' 
          : 'h-auto md:h-full opacity-100 mb-6 md:mb-0'
      }`}>
        <div className="relative w-[180px] h-[180px] md:w-[280px] md:h-[280px] flex items-center justify-center bg-transparent mb-4 md:mb-8 shrink-0">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 flex bg-warm-sand/50 rounded-full p-1 border border-border-cream/80 backdrop-blur-sm shadow-sm z-10">
            {['casual', 'audit'].map((tab) => {
              const isActive = mode === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setMode(tab as 'casual' | 'audit')}
                  className={`relative px-5 py-1.5 rounded-full text-[14px] font-medium transition-colors z-10 flex items-center gap-1.5 ${
                    isActive ? 'text-near-black' : 'text-stone-gray hover:text-near-black'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="aiModePill"
                      className="absolute inset-0 bg-white rounded-full shadow-[0px_2px_8px_rgba(0,0,0,0.06)] border border-border-cream"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab === 'audit' && (
                      <svg className={`w-3.5 h-3.5 ${isActive ? 'text-coral' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {tab === 'casual' ? '闲聊模式' : '深度审计'}
                  </span>
                </button>
              );
            })}
          </div>
          <img
            src="/assistant_idle.png"
            alt="Idle"
            className={`absolute w-full h-full object-contain drop-shadow-md transition-opacity duration-500 ease-in-out ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          />
          <img
            src="/assistant_thinking.gif"
            alt="Thinking"
            className={`absolute w-full h-full object-contain drop-shadow-md transition-opacity duration-500 ease-in-out ${isLoading ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
        
        <motion.div 
          className="flex flex-col items-center md:items-start text-center md:text-left w-full shrink-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[32px] md:text-[48px] font-serif font-medium text-near-black leading-[1.15] tracking-tight relative">
            <span className="invisible whitespace-pre-wrap">{titleText.includes('容') || titleText.includes('竞争') ? titleText : "哪里不懂的\n问问先贤"}</span>
            <span className="absolute top-0 left-0 w-full text-center md:text-left whitespace-pre-wrap">
              {displayedTitle.replace('的问', '的\n问')}
              <span className="inline-block w-[3px] h-[36px] md:h-[48px] bg-coral animate-pulse align-middle ml-1 -mt-2"></span>
            </span>
          </h2>
        </motion.div>
      </div>

      {/* 竖向分割线 (Vertical Divider) - 仅在桌面端显示 */}
      <div className="hidden md:block w-[1px] h-[80%] my-auto bg-border-cream/80 shrink-0"></div>

      {/* 右侧/底部 消息与输入区 (Chat & Input Area) */}
      <div className="flex-1 flex flex-col w-full h-full max-h-[85vh] md:max-h-full bg-transparent relative overflow-hidden md:pl-12">
        {/* 消息流区域 (Message Stream Area) */}
        <div 
          className="flex-1 w-full overflow-y-auto no-scrollbar pb-4 md:pb-8 flex flex-col"
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-60">
              <div className="w-16 h-16 mb-4 rounded-full bg-warm-sand/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-stone-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-stone-gray font-sans text-[15px]">和他讨论下产品或新点子？</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((m, index) => {
                if (m.role === 'assistant' && m.content === '') return null; // Hide empty bubble

                return (
                  <motion.div 
                    key={m.id} 
                    className={`mb-6 last:mb-2 flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <div className={`inline-block text-[15px] leading-[1.75] tracking-wide ${
                      m.role === 'user' 
                        ? 'max-w-[90%] md:max-w-[85%] bg-near-black text-ivory px-5 md:px-6 py-3 md:py-4 rounded-[20px] rounded-tr-[4px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] font-sans' 
                        : 'w-full md:max-w-[90%] bg-transparent text-near-black px-0 md:px-2 py-2 md:py-4 font-sans'
                    }`}>
                      {m.role === 'user' ? (
                      m.content
                    ) : (
                      <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, children, ...props}) => {
                          if (typeof children === 'string') {
                            return <p className="mb-4 last:mb-0 text-near-black/80 leading-relaxed text-[15px]" {...props}>{formatMessageWithBrands(children)}</p>;
                          }
                          return <p className="mb-4 last:mb-0 text-near-black/80 leading-relaxed text-[15px]" {...props}>{children}</p>;
                        },
                        h1: ({node, ...props}) => <h1 className="text-[20px] font-serif font-bold text-near-black mb-4 mt-6 pb-2 border-b border-border-cream" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-[18px] font-serif font-bold text-near-black mb-3 mt-5" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-[16px] font-sans font-bold text-near-black mb-2 mt-4" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-none pl-0 mb-5 space-y-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-5 space-y-2 text-near-black/80" {...props} />,
                        li: ({node, children, ...props}) => {
                          const isString = typeof children === 'string';
                          const content = isString ? formatMessageWithBrands(children as string) : children;
                          return (
                            <li className="relative pl-5 text-near-black/80 leading-relaxed text-[15px] before:content-[''] before:absolute before:left-0 before:top-[10px] before:w-1.5 before:h-1.5 before:bg-coral/60 before:rounded-full" {...props}>
                              {content}
                            </li>
                          );
                        },
                        strong: ({node, ...props}) => <strong className="font-bold text-near-black" {...props} />,
                        a: ({node, ...props}) => <a className="text-coral font-medium hover:text-terracotta hover:underline underline-offset-4 decoration-coral/30 transition-colors" {...props} />,
                        code: ({node, inline, ...props}: any) => 
                          inline 
                            ? <code className="bg-warm-sand/80 px-1.5 py-0.5 rounded-[4px] text-[13px] font-mono text-coral/90 border border-border-cream/50" {...props} />
                            : <code className="block bg-near-black/5 text-charcoal-warm p-4 rounded-[8px] text-[13px] font-mono overflow-x-auto mb-5 border border-border-cream" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-coral/40 pl-4 py-1 my-5 text-stone-gray italic bg-warm-sand/20 rounded-r-[8px]" {...props} />
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Loading indicator for Audit Charts */}
                {mode === 'audit' && m.role === 'assistant' && index === messages.length - 1 && !auditCharts && (
                  <div className="w-full md:max-w-[90%] px-0 md:px-2 mt-4 flex items-center gap-3 text-stone-gray font-serif text-[15px] animate-pulse">
                    <svg className="w-5 h-5 text-coral animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    容先贤想想...
                  </div>
                )}

                {/* Audit Charts Injection */}
                {mode === 'audit' && m.role === 'assistant' && auditCharts && index === messages.length - 1 && (
                  <div className="w-full md:max-w-[90%] px-0 md:px-2 mt-2 space-y-4">
                    {/* 看板 A: 对标雷达 */}
                    <div className="bg-ivory/70 border border-border-cream rounded-[16px] overflow-hidden">
                      <ReactECharts option={auditCharts.radarOption as any} style={{ height: 400, width: '100%' }} />
                    </div>
                    
                    {/* 看板 B: 对比实体表 */}
                    <div className="bg-ivory/70 border border-border-cream rounded-[16px] overflow-hidden">
                      <div className="p-4 md:p-5 border-b border-border-cream bg-white/50">
                        <h3 className="text-[18px] font-serif font-medium text-near-black">对比实体表</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-warm-sand/30 text-[13px] text-stone-gray font-medium">
                              <th className="px-4 py-3 border-b border-border-cream">对比实体</th>
                              <th className="px-4 py-3 border-b border-border-cream">GMV (规模)</th>
                              <th className="px-4 py-3 border-b border-border-cream">CAGR (增速)</th>
                              <th className="px-4 py-3 border-b border-border-cream">溢价率</th>
                            </tr>
                          </thead>
                          <tbody className="text-[14px] text-near-black">
                            {auditCharts.tableData.map((row, i) => (
                              <tr key={i} className="hover:bg-warm-sand/10 transition-colors">
                                <td className="px-4 py-3 border-b border-border-cream font-medium">
                                  {row.brand ? (
                                    <button onClick={() => setSelectedBrandForModal(row.brand)} className="hover:text-coral hover:underline underline-offset-4 decoration-coral/30 transition-colors text-left">
                                      {row.name}
                                    </button>
                                  ) : (
                                    row.name
                                  )}
                                </td>
                                <td className="px-4 py-3 border-b border-border-cream text-olive-gray font-mono">{row.gmv}</td>
                                <td className="px-4 py-3 border-b border-border-cream text-olive-gray font-mono">{row.cagr}</td>
                                <td className="px-4 py-3 border-b border-border-cream text-olive-gray font-mono">{row.premium}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 第三部分：审计处方笺 */}
                    {auditCharts.diagnostic && (
                      <div className="bg-ivory/70 border border-border-cream rounded-[16px] p-5">
                        <h3 className="text-[18px] font-serif font-medium text-near-black mb-4">审计处方笺</h3>
                        <div className="space-y-3">
                          {auditCharts.diagnostic.edge && (
                            <div className="flex gap-3">
                              <div className="shrink-0 w-8 h-8 rounded-full bg-coral/10 text-coral flex items-center justify-center font-bold">
                                +
                              </div>
                              <div>
                                <div className="text-[14px] font-bold text-near-black mb-1">优势项 (Edge)</div>
                                <div className="text-[14px] text-olive-gray leading-relaxed">{auditCharts.diagnostic.edge}</div>
                              </div>
                            </div>
                          )}
                          {auditCharts.diagnostic.gap && (
                            <div className="flex gap-3">
                              <div className="shrink-0 w-8 h-8 rounded-full bg-stone-gray/10 text-stone-gray flex items-center justify-center font-bold">
                                -
                              </div>
                              <div>
                                <div className="text-[14px] font-bold text-near-black mb-1">补课项 (Gap)</div>
                                <div className="text-[14px] text-olive-gray leading-relaxed">{auditCharts.diagnostic.gap}</div>
                              </div>
                            </div>
                          )}
                          {auditCharts.diagnostic.strategy && (
                            <div className="flex gap-3">
                              <div className="shrink-0 w-8 h-8 rounded-full bg-focus-blue/10 text-focus-blue flex items-center justify-center font-bold">
                                ★
                              </div>
                              <div>
                                <div className="text-[14px] font-bold text-near-black mb-1">借鉴策略 (Strategy)</div>
                                <div className="text-[14px] text-olive-gray leading-relaxed">{auditCharts.diagnostic.strategy}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* 底部输入框区 (Bottom Input Area) */}
            <div className="pb-4 md:pb-6 pt-12 shrink-0">
              <motion.form 
                onSubmit={handleFormSubmit}
                className={`relative flex items-center bg-ivory/80 border rounded-[24px] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] transition-all overflow-hidden h-[64px] pl-6 pr-2 w-full max-w-[850px] mx-auto ${
                  isLoading ? 'border-border-cream opacity-80' : 'border-border-cream focus-within:shadow-[0px_0px_0px_1px_var(--color-focus-blue)] focus-within:border-focus-blue focus-within:bg-white'
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
          <input
            name="prompt"
            value={input || ''}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "AI 正在思考..." : "你有啥问题？"}
            className="flex-1 bg-transparent border-none outline-none text-near-black placeholder:text-stone-gray text-[16px] font-sans h-full"
            disabled={isLoading}
            autoComplete="off"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`ml-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              input.trim() && !isLoading ? 'bg-near-black text-ivory' : 'bg-warm-sand text-stone-gray'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </motion.form>
      </div>
      </div>

      {/* 品牌详情 Modal */}
      <AnimatePresence>
        {selectedBrandForModal && (
          <BrandModal brand={selectedBrandForModal} onClose={() => setSelectedBrandForModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
