'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../store/useStore';
import { BrandModal } from './BrandModal';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBrandForModal, setSelectedBrandForModal] = useState<any | null>(null);
  
  const allBrands = useStore((state) => state.allBrands);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const typeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Preload the GIF image to prevent blinking when switching
  useEffect(() => {
    const img = new Image();
    img.src = '/assistant_thinking.gif';
  }, []);

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
    
    const userMessage = input.trim();
    setInput('');
    setIsOpen(true);
    setIsLoading(true);

    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: 'user', content: userMessage }
    ];
    setMessages(newMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error(response.statusText);

      // Create a placeholder for the assistant's message
      const assistantMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

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
          
          setMessages(prev => {
            const newMsgs = [...prev];
            const idx = newMsgs.findIndex(m => m.id === assistantMessageId);
            if (idx !== -1) {
              newMsgs[idx] = {
                ...newMsgs[idx],
                content: receivedText.slice(0, displayedLength)
              };
            }
            return newMsgs;
          });
        } else if (isDone && displayedLength === receivedText.length) {
          if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
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
    } catch (error) {
      console.error('Error fetching chat:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: '抱歉老板，服务器开小差了，请稍后再试。' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 动态打字机效果标题 (Typewriter effect for the title)
  const titleText = isLoading ? "容先贤想想..." : "哪里不懂的问问先贤";
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
    <div className="w-full max-w-[1400px] h-[calc(100vh-60px)] flex flex-col md:flex-row mx-auto px-4 md:px-12 py-4 md:py-8 relative">
      {/* 左侧/顶部 固定展示区 (Fixed Avatar Area) */}
      <div className={`flex flex-col items-center md:items-start justify-start pt-0 md:pt-4 shrink-0 w-full md:w-[360px] transition-all duration-500 ease-in-out md:pr-12 md:-ml-8 ${
        messages.length > 0 
          ? 'h-0 md:h-full opacity-0 md:opacity-100 overflow-hidden md:overflow-visible mb-0' 
          : 'h-auto md:h-full opacity-100 mb-6 md:mb-0'
      }`}>
        <div className="relative w-[180px] h-[180px] md:w-[280px] md:h-[280px] flex items-center justify-center bg-transparent mb-4 md:mb-8">
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
          className="flex flex-col items-center md:items-start text-center md:text-left w-full h-[120px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[32px] md:text-[48px] font-serif font-medium text-near-black leading-[1.15] tracking-tight relative">
            <span className="invisible whitespace-pre-wrap">{titleText.includes('容') ? "容先贤想想..." : "哪里不懂的\n问问先贤"}</span>
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
          className="flex-1 w-full overflow-y-auto no-scrollbar py-4 md:py-8 flex flex-col"
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
                    className={`mb-6 last:mb-2 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
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
                            return <p className="mb-5 last:mb-0 text-olive-gray" {...props}>{formatMessageWithBrands(children)}</p>;
                          }
                          return <p className="mb-5 last:mb-0 text-olive-gray" {...props}>{children}</p>;
                        },
                        h1: ({node, ...props}) => <h1 className="text-[22px] font-serif font-bold text-near-black mb-4 mt-8 pb-2 border-b border-border-cream" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-[18px] font-serif font-bold text-near-black mb-3 mt-6" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-[16px] font-sans font-bold text-near-black mb-2 mt-4" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-5 space-y-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-5 space-y-2" {...props} />,
                        li: ({node, children, ...props}) => {
                          if (typeof children === 'string') {
                             return <li className="text-olive-gray pl-1" {...props}>{formatMessageWithBrands(children)}</li>;
                          }
                          return <li className="text-olive-gray pl-1" {...props}>{children}</li>;
                        },
                        strong: ({node, ...props}) => <strong className="font-bold text-near-black" {...props} />,
                        a: ({node, ...props}) => <a className="text-coral hover:text-terracotta hover:underline underline-offset-4 decoration-coral/30 transition-colors" {...props} />,
                        code: ({node, inline, ...props}: any) => 
                          inline 
                            ? <code className="bg-warm-sand/50 px-1.5 py-0.5 rounded-[4px] text-[13px] font-mono text-charcoal-warm border border-border-cream" {...props} />
                            : <code className="block bg-near-black/5 text-charcoal-warm p-4 rounded-[8px] text-[13px] font-mono overflow-x-auto mb-5 border border-border-cream" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-coral/40 pl-4 py-1 my-5 text-stone-gray italic bg-warm-sand/20 rounded-r-[8px]" {...props} />
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
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
