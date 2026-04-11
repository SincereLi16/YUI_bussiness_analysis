'use client';

import React, { useState } from 'react';
import { MacroInsightHub } from '../components/MacroInsightHub';
import { EntityMatrix } from '../components/EntityMatrix';
import { AISearchBar } from '../components/AISearchBar';

export default function Home() {
  const [activeView, setActiveView] = useState<'dashboard' | 'ai'>('dashboard');

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-parchment text-near-black font-sans relative">
      {/* Global Top Navigation */}
      <nav className="h-[60px] bg-ivory border-b border-border-cream flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="YUI Logo" className="w-8 h-8 object-contain" />
          <span className="font-serif text-[18px] font-bold tracking-wide text-near-black">YUI 商业分析版图</span>
        </div>
        <div className="flex bg-warm-sand/50 rounded-lg p-1">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`px-4 py-1.5 rounded-md text-[14px] font-medium transition-all ${
              activeView === 'dashboard' 
                ? 'bg-ivory text-near-black shadow-sm' 
                : 'text-stone-gray hover:text-near-black'
            }`}
          >
            数据看板
          </button>
          <button 
            onClick={() => setActiveView('ai')}
            className={`px-4 py-1.5 rounded-md text-[14px] font-medium transition-all flex items-center gap-2 ${
              activeView === 'ai' 
                ? 'bg-ivory text-near-black shadow-sm' 
                : 'text-stone-gray hover:text-near-black'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-terracotta"></span>
            </span>
            问问先贤
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* View 1: Data Dashboard */}
        <div 
          className={`absolute inset-0 flex transition-opacity duration-500 ${
            activeView === 'dashboard' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* 宏观洞察层 (Macro Insight Hub) - 40% Width on Left */}
          <aside className="w-[40%] h-full bg-ivory border-r border-border-cream relative">
            <MacroInsightHub />
          </aside>
          
          {/* 微观实体层 (Entity Matrix) - 60% Width on Right */}
          <main className="w-[60%] h-full relative bg-parchment">
            <EntityMatrix />
          </main>
        </div>

        {/* View 2: AI Search Interface */}
        <div 
          className={`absolute inset-0 bg-parchment transition-opacity duration-500 flex flex-col items-center pt-[10vh] ${
            activeView === 'ai' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {activeView === 'ai' && <AISearchBar />}
        </div>
      </div>
    </div>
  );
}
