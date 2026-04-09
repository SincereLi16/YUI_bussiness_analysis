import React from 'react';
import { MacroInsightHub } from '../components/MacroInsightHub';
import { EntityMatrix } from '../components/EntityMatrix';

export default function Home() {
  return (
    <div className="flex w-screen h-screen overflow-hidden bg-parchment text-near-black font-sans">
      {/* 宏观洞察层 (Macro Insight Hub) - 40% Width on Left */}
      <aside className="w-[40%] h-full bg-ivory shadow-[1px_0_0_0_var(--color-border-warm)] z-10 relative">
        <MacroInsightHub />
      </aside>
      
      {/* 微观实体层 (Entity Matrix) - 60% Width on Right */}
      <main className="w-[60%] h-full relative z-0 bg-parchment">
        <EntityMatrix />
      </main>
    </div>
  );
}
