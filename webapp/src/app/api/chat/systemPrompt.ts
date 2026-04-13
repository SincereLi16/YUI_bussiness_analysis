import fs from 'fs';
import path from 'path';

// Define the logic rules for the dashboard
const dashboardLogic = `
### 数据看板分析逻辑与规则 (Dashboard Logic Rules)

1. **动机板块与字典约束 (Motivation Sections)**:
   - 智性决策: 科技平权, 信息平权, 秩序与掌控感, 生产力与效率, 舒适感
   - 情绪补偿: 多巴胺, 玄学叙事, 精致美学, 悦己主义, Gap, 懒人经济, 孤独焦虑, 创造探索
   - 身份叙事: Lifestyle, 圈层共振, 社交货币, 小众DIY, 文化根脉

2. **溢价率 (Premium Rate)**:
   - 定义：代表品牌产品相对于赛道平均水平的溢价情况。正数表示高溢价（消费者愿意为品牌价值多付钱），负数表示性价比或价格战。

3. **社交效能杠杆 (Conversion Leverage)**:
   - 公式：杠杆率 = (GMV / Social_Mentions) * 100%
   - 含义：衡量品牌将社交媒体声量转化为实际商业收入的能力。
   - [强转化型] 杠杆率 >= 1000%：用户心智成熟，搜索即购买，无需过度营销。
   - [均衡型] 300% <= 杠杆率 < 1000%：声量与转化处于健康水平。
   - [苦力型] 杠杆率 < 300%：社交热度远超实际转化，属于品牌建设期，转化效率低。
   - [价格战受害者] 特例：若声量极高且溢价率为负，说明品牌在牺牲利润换取流量。

4. **四大商业生态象限 (Ecological Quadrant Matrix)**:
   - X轴 = 社交声量，Y轴 = 溢价率
   - [名利双收]：高声量 + 高溢价（右上象限）
   - [闷声发财]：低声量 + 高溢价（左上象限）
   - [内卷之王]：高声量 + 低溢价（右下象限）
   - [长尾试错]：低声量 + 低溢价（左下象限）
`;

// Define the persona for the AI
const persona = `
### 你的身份与性格 (Your Persona)

你是“合韵达产品经理”，一个精通数据的懂哥。
- **语言风格**：极度简洁、大白话、像在微信聊天。千万不要有AI味（GPT登味），不要用“首先、其次、总之”这种八股文，也不要列一大堆废话。能一句话说清楚的绝不说两句。
- **态度**：称呼对方为“好兄弟”。喜欢一针见血地点出数据背后的真相，遇到好玩的数据或者槽点，直接用一两句冷笑话吐槽。
- **排版要求**：必须用 Markdown，但不允许过度排版。只在核心数据或关键结论上加粗。如果回答包含列表，每项不要超过20个字。
- **核心原则**：Say less, mean more. 像个活生生的人一样去对话。

### 闲聊模式规则（很重要）
- 你不是审计官：不要用“生存评级/判词/处方笺/雷达图/工单”那套流程。
- 不要把用户当作在填表：不要强制追问“赛道/卖点/定价”三要素；真不清楚只问 1 个最关键的问题。
- 不输出 audit_json，也不要出现 competitor_a/competitor_b 这些字段名。
`;

const auditPersona = `
### 你的身份：首席产品审计官 (CPO Persona)
你依然是那位“合韵达产品经理”，叫用户“好兄弟”。
但在审计模式下，你的逻辑极度毒辣，严禁幻觉，必须基于 RAG JSON 里的数据说话。

### 审计规则（别把过程写出来）
- 输入要素只看 3 个：赛道/品类、核心卖点、目标定价。缺哪个就直接追问，别输出审计结论。
- Section 不是必填：你先自己判断（智性决策/情绪补偿/身份叙事）。只有你判断不出来时，才让用户三选一。
- 自动对标逻辑：你会收到一个精简的 context JSON（包含 target_section、market_stats、benchmarks、shadow_brands）。
  - competitor_a (黑马): 优先从 shadow_brands 里挑最贴近用户卖点的。
  - competitor_b (巨头): 直接用 benchmarks 里的 Titan。
- 雷达图维度评估：你需要将用户的产品概念映射到 0-100 的分值，这五个轴向必须是：
  - social_leverage (社交效能): 转化率指标，你的产品是否自带流量？
  - growth_momentum (增长动能): 赛道增速，起飞速度如何？
  - premium_position (溢价站位): 价格天花板，基于你的品牌故事和视觉，能否支撑比别人更高的价格？
  - narrative_depth (叙事厚度): 情感/美学溢价，讲故事的能力。
  - moat_depth (防御深度): 技术/壁垒，你的核心卖点是否容易被巨头快速抄袭？
- **严禁把你的“推理步骤/阶段标题/思考过程”写给用户看。**（绝对禁止出现“第一阶段”、“第二阶段”等字眼）
- **严禁完全按部就班地把结构化思考内容展示出来**（拆解放到 audit_json 里就行，给用户的文字要自然凝练的对话）。

### 输出规范与排版结构（必须更凝练、口语化）
**第一部分：审计判词与赛道扫描**
1. **死活判决书**：必须在最前面！结构为 [生存评级] + [一句话现状] + [入场建议]。
   - 生存评级规范：
     - 🟢 推荐入场 (Star)：逻辑完美自洽，赛道有裂缝。
     - 🟡 谨慎尝试 (Challenger)：卖点硬但对手更硬，需侧翼切入。
     - 🔴 极度危险 (Red Ocean)：逻辑自相矛盾或被巨头完全封死。
   - 示例：“【生存评级：🟡 谨慎尝试】兄弟，你这是想在 1500 元档靠‘光影’硬撼【Marshall】的‘品牌图腾’。逻辑能通，但生存率只有 45%，因为你还没给出一个让用户放弃‘摇滚情怀’转投‘落日氛围’的绝对理由。”
2. **引出核心对标雷达图**：必须包含这句：“兄弟，我帮你拉出了【Competitor_A】和【Competitor_B】的数据做了个深度对标，你看这张雷达图...”
3. **赛道画像 (存量与增量扫描)**：用 RAG 里的硬数据定义“战场的厚度”。
   - 引用该 Section 的 Total GMV 和 Avg. CAGR。
   - 定性分析：若增速 > 30% 称“高速增长的肥肉”；若增速 < 5% 且巨头占有率高称“增长停滞的泥潭”。
4. **逻辑校验 (矛盾拆解)**：扫描核心卖点与定价的匹配度。判定是“成本逻辑崩塌”还是“叙事溢价虚标”。

**第二部分：核心看板 (组件渲染区)**
- 不在文本中输出，通过生成正确的 audit_json，由前端图表组件负责渲染。

**第三部分：拆开细看与审计处方笺**
1. **拆开细看**：结合你打出的 scores，用简短的话解释那 5 个维度（社交效能、增长动能、溢价站位、叙事厚度、防御深度）的分数依据。
2. **处方笺**：
   - 亮点识别 (Edge)：在哪一维度能赢过巨头。
   - 风险预警 (Risk)：列出 1-2 个必踩的坑。
   - 借鉴策略 (Strategy)：推荐 1 个具体品牌借鉴设计，推荐 1 个切入角度/生态位。

### 约束规范 (Constraints)
- 严禁“AI 腔”：禁止使用“综上所述”、“我们可以看到”。要用“说真的”、“有一说一”、“你看这张图”。
- 数据颗粒度：所有提到的品牌必须带上 RAG 里的 2025 年度数据。
- 引用透明性：在输出结论时，必须带来源（例：“根据我库里【花再】2025 年 110% 的增速来看...”）。

### 输出约束：必须附带 audit_json 工单
你的回复由两部分组成：
1) 前半段：符合上述规范的 Markdown 文本。
2) 最末尾：追加一个 \`\`\`audit_json\`\`\` 代码块，里面是严格 JSON（不允许注释、不允许尾逗号、不允许额外文本）。

audit_json schema：
\`\`\`audit_json
{
  "stage": "need_info" | "audited",
  "missing": ["category" | "value_prop" | "pricing" | "section"],
  "extracted": { "category": "…", "value_prop": "…", "pricing": "…" },
  "section": "智性决策" | "情绪补偿" | "身份叙事",
  "competitor_a": "黑马品牌名",
  "competitor_b": "巨头品牌名",
  "scores": {
    "social_leverage": 0,
    "growth_momentum": 0,
    "premium_position": 0,
    "narrative_depth": 0,
    "moat_depth": 0
  },
  "diagnostic": {
    "edge": "亮点识别：你的产品在哪个维度超出了标杆",
    "gap": "风险预警：你比标杆弱在哪里必踩的坑",
    "strategy": "借鉴策略：推荐品牌或切入角度"
  }
}
\`\`\`
scores 取 0-100 的整数。
stage=audited 时：所有字段必须给出。competitor_a 与 competitor_b 必须使用库里品牌的 brand_name_zh 原样输出。
`;

type RagTopic = {
  topic_name?: string;
  views?: string;
  sentiment_score?: string;
};

type RagProduct = {
  product_name?: string;
  core_value?: string;
};

type RagBrand = {
  brand_name?: string;
  brand_name_zh?: string;
  brand_name_en?: string;
  brand_gmv?: string;
  brand_cagr?: string;
  core_product?: string;
  premium_rate?: unknown;
  products?: RagProduct[];
  topics?: RagTopic[];
  brand_sov?: string;
  search_index?: string;
  cross_motivations?: string[];
  loyalty?: number;
  data_source?: string;
  [key: string]: unknown;
};

type RagSection = {
  motivation?: string;
  section?: string;
  prescription?: string;
  market_context?: {
    category?: string;
    market_size?: string;
    cagr?: string;
    capital_index?: string;
    [key: string]: unknown;
  };
  brands?: RagBrand[];
  [key: string]: unknown;
};

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function extractKeywords(userMessage: string): string[] {
  const raw = userMessage
    .replace(/[\u200b\u200c\u200d\uFEFF]/g, '')
    .split(/[\s,，。.!！?？;；:+＋/\\|\-—_()（）\[\]{}"'“”‘’]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const stop = new Set([
    '我',
    '你',
    '他',
    '她',
    '它',
    '我们',
    '你们',
    '他们',
    '这个',
    '那个',
    '一个',
    '一下',
    '怎么',
    '为什么',
    '是不是',
    '可以',
    '能不能',
    '帮我',
    '想要',
    '主打',
    '定价',
    '价格',
    '产品',
    '品牌',
    '赛道',
    '品类',
    '问题',
    '数据',
    '分析',
  ]);

  const uniq: string[] = [];
  const seen = new Set<string>();

  for (const token of raw) {
    const t = token.toLowerCase();
    if (!t) continue;
    if (stop.has(token) || stop.has(t)) continue;
    if (/^\d+(\.\d+)?$/.test(t)) continue;
    if (t.length > 32) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    uniq.push(token);
  }

  return uniq.slice(0, 12);
}

function scoreByKeywords(text: string, keywords: string[], weight: number): number {
  if (!text) return 0;
  let score = 0;
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    if (!k) continue;
    if (lower.includes(k)) score += weight;
  }
  return score;
}

function scoreBrand(brand: RagBrand, section: RagSection, keywords: string[]): number {
  let score = 0;
  score += scoreByKeywords(normalizeText(brand?.brand_name_zh), keywords, 60);
  score += scoreByKeywords(normalizeText(brand?.brand_name_en), keywords, 45);
  score += scoreByKeywords(normalizeText(brand?.brand_name), keywords, 45);
  score += scoreByKeywords(normalizeText(brand?.core_product), keywords, 25);

  if (Array.isArray(brand?.products)) {
    for (const p of brand.products) {
      score += scoreByKeywords(normalizeText(p?.product_name), keywords, 18);
      score += scoreByKeywords(normalizeText(p?.core_value), keywords, 10);
    }
  }

  if (Array.isArray(brand?.topics)) {
    for (const t of brand.topics) {
      score += scoreByKeywords(normalizeText(t?.topic_name), keywords, 8);
    }
  }

  score += scoreByKeywords(normalizeText(section?.section), keywords, 20);
  score += scoreByKeywords(normalizeText(section?.motivation), keywords, 18);
  score += scoreByKeywords(normalizeText(section?.prescription), keywords, 10);
  score += scoreByKeywords(normalizeText(section?.market_context?.category), keywords, 14);
  return score;
}

function parseFirstNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const s = normalizeText(value);
  const match = s.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function parsePercent(value: unknown): number | null {
  const n = parseFirstNumber(value);
  if (n === null) return null;
  return n;
}

function parseGmvYi(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const s = normalizeText(value);
  const n = parseFirstNumber(s);
  if (n === null) return null;
  if (s.includes('亿')) return n;
  if (s.includes('万')) return n / 10000;
  if (s.includes('千')) return n / 100000;
  return n;
}

function formatYi(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '';
  if (value >= 100) return `${Math.round(value)}亿`;
  if (value >= 10) return `${value.toFixed(1)}亿`;
  return `${value.toFixed(2)}亿`;
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '';
  if (Math.abs(value) >= 10) return `${value.toFixed(1)}%`;
  return `${value.toFixed(2)}%`;
}

function premiumLevel(value: unknown): '高' | '中' | '低' | '负' | '' {
  const n = parsePercent(value);
  if (n === null) return '';
  if (n < 0) return '负';
  if (n >= 30) return '高';
  if (n >= 10) return '中';
  return '低';
}

function pickTargetSection(sections: RagSection[], keywords: string[]) {
  let bestScore = -1;
  let bestIndex = 0;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sScore =
      scoreByKeywords(normalizeText(section?.market_context?.category), keywords, 60) +
      scoreByKeywords(normalizeText(section?.section), keywords, 45) +
      scoreByKeywords(normalizeText(section?.motivation), keywords, 35);
    if (sScore > bestScore) {
      bestScore = sScore;
      bestIndex = i;
    }
  }
  return { section: sections[bestIndex], score: bestScore };
}

function buildInjectedContext(rawData: string, mode: 'casual' | 'audit', userMessage: string): string {
  const parsed: unknown = JSON.parse(rawData);
  if (!Array.isArray(parsed)) return JSON.stringify({ context_meta: {}, benchmarks: [], shadow_brands: [] });
  const sections = parsed as RagSection[];
  const keywords = extractKeywords(userMessage);
  const { section: targetSection } = pickTargetSection(sections, keywords);
  const brands: RagBrand[] = Array.isArray(targetSection?.brands) ? (targetSection.brands as RagBrand[]) : [];

  const gmvYiList = brands.map(b => parseGmvYi(b.brand_gmv)).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const cagrList = brands.map(b => parsePercent(b.brand_cagr)).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  const totalGmvYi = gmvYiList.length ? gmvYiList.reduce((a, b) => a + b, 0) : null;
  const avgCagr = cagrList.length ? cagrList.reduce((a, b) => a + b, 0) / cagrList.length : null;

  const titan = brands
    .map(b => ({ brand: b, gmvYi: parseGmvYi(b.brand_gmv) ?? -Infinity }))
    .sort((a, b) => (b.gmvYi ?? -Infinity) - (a.gmvYi ?? -Infinity))[0]?.brand;

  const rocket = brands
    .map(b => ({ brand: b, cagr: parsePercent(b.brand_cagr) ?? -Infinity }))
    .sort((a, b) => (b.cagr ?? -Infinity) - (a.cagr ?? -Infinity))[0]?.brand;

  const shadowLimit = mode === 'audit' ? 20 : 6;

  const scoredShadow = brands
    .map(b => {
      let score = 0;
      score += scoreByKeywords(normalizeText(b.brand_name_zh), keywords, 80);
      score += scoreByKeywords(normalizeText(b.brand_name_en), keywords, 60);
      score += scoreByKeywords(normalizeText(b.core_product), keywords, 35);
      if (Array.isArray(b.products)) {
        for (const p of b.products) {
          score += scoreByKeywords(normalizeText(p.product_name), keywords, 20);
          score += scoreByKeywords(normalizeText(p.core_value), keywords, 12);
        }
      }
      if (Array.isArray(b.topics)) {
        for (const t of b.topics) {
          score += scoreByKeywords(normalizeText(t.topic_name), keywords, 10);
        }
      }
      if (Array.isArray(b.cross_motivations)) {
        for (const m of b.cross_motivations) {
          score += scoreByKeywords(normalizeText(m), keywords, 50);
        }
      }
      return { brand: b, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const titanName = titan?.brand_name_zh || titan?.brand_name || '';
  const rocketName = rocket?.brand_name_zh || rocket?.brand_name || '';

  const shadowBrands = scoredShadow
    .filter(x => {
      const name = x.brand.brand_name_zh || x.brand.brand_name || '';
      return name && name !== titanName && name !== rocketName;
    })
    .slice(0, shadowLimit)
    .map(x => {
      const logic =
        x.brand.core_product ||
        (Array.isArray(x.brand.products) ? x.brand.products[0]?.core_value : undefined) ||
        (Array.isArray(x.brand.products) ? x.brand.products[0]?.product_name : undefined) ||
        '';
      return {
        name: x.brand.brand_name_zh || x.brand.brand_name || '',
        premium_rate: premiumLevel(x.brand.premium_rate) || normalizeText(x.brand.premium_rate),
        logic,
      };
    });

  const titanBenchmark = titan
    ? {
        name: titan.brand_name_zh || titan.brand_name || '',
        role: 'Titan',
        gmv: titan.brand_gmv || '',
        premium: premiumLevel(titan.premium_rate) || normalizeText(titan.premium_rate),
      }
    : null;

  const rocketBenchmark = rocket
    ? {
        name: rocket.brand_name_zh || rocket.brand_name || '',
        role: 'Rocket',
        cagr: rocket.brand_cagr || '',
        motivation: Array.isArray(rocket.cross_motivations) ? rocket.cross_motivations[0] || '' : '',
      }
    : null;

  let benchmarks: Array<Record<string, unknown>> = [];
  if (mode === 'audit') {
    if (titanBenchmark && rocketBenchmark && titanBenchmark.name && titanBenchmark.name === rocketBenchmark.name) {
      benchmarks = [
        {
          name: titanBenchmark.name,
          role: 'Titan/Rocket',
          gmv: titanBenchmark.gmv,
          premium: titanBenchmark.premium,
          cagr: rocketBenchmark.cagr,
          motivation: rocketBenchmark.motivation,
        },
      ];
    } else {
      benchmarks = [titanBenchmark, rocketBenchmark].filter(Boolean) as Array<Record<string, unknown>>;
    }
  }

  const context =
    mode === 'audit'
      ? {
          context_meta: {
            target_section: targetSection?.market_context?.category || targetSection?.section || targetSection?.motivation || '',
            market_stats: {
              total_gmv: formatYi(totalGmvYi),
              avg_cagr: formatPercent(avgCagr),
            },
          },
          benchmarks,
          shadow_brands: shadowBrands,
        }
      : {
          context_meta: {
            target_section: targetSection?.market_context?.category || targetSection?.section || targetSection?.motivation || '',
          },
          shadow_brands: shadowBrands,
        };

  const json = JSON.stringify(context);
  const maxChars = mode === 'audit' ? 60_000 : 18_000;
  if (json.length <= maxChars) return json;

  const smaller = {
    ...context,
    shadow_brands: shadowBrands.slice(0, Math.max(3, Math.floor(shadowBrands.length / 2))),
  };
  const json2 = JSON.stringify(smaller);
  if (json2.length <= maxChars) return json2;
  const metaOnly = 'benchmarks' in context
    ? { context_meta: context.context_meta, benchmarks, shadow_brands: [] }
    : { context_meta: context.context_meta, shadow_brands: [] };
  return JSON.stringify(metaOnly);
}

function projectBrandForMode(brand: RagBrand, mode: 'casual' | 'audit') {
  const base = {
    brand_name_zh: brand.brand_name_zh,
    brand_name_en: brand.brand_name_en,
    brand_gmv: brand.brand_gmv,
    brand_cagr: brand.brand_cagr,
    core_product: brand.core_product,
    premium_rate: brand.premium_rate,
    products: brand.products,
    topics: brand.topics,
  };

  if (mode === 'audit') {
    return {
      ...base,
      brand_name: brand.brand_name,
      brand_sov: brand.brand_sov,
      search_index: brand.search_index,
      cross_motivations: brand.cross_motivations,
      loyalty: brand.loyalty,
      data_source: brand.data_source,
    };
  }

  return base;
}

function projectSectionForMode(section: RagSection, brands: ReturnType<typeof projectBrandForMode>[], mode: 'casual' | 'audit') {
  const base = {
    section: section?.section,
    motivation: section?.motivation,
    market_context: section?.market_context,
    brands,
  };
  if (mode === 'audit') return { ...base, prescription: section?.prescription };
  return base;
}

function buildLightRag(rawData: string, mode: 'casual' | 'audit', userMessage: string): string {
  const trimmedMessage = userMessage?.trim() || '';
  if (!trimmedMessage) {
    return JSON.stringify({ context_meta: {}, benchmarks: [], shadow_brands: [] });
  }
  return buildInjectedContext(rawData, mode, trimmedMessage);
}

export function getSystemPrompt(mode: 'casual' | 'audit' = 'casual', userMessage: string = ''): string {
  try {
    // Read the RAG data from the JSON file
    const ragDataPath = path.join(process.cwd(), 'src', 'data', 'merged_consumer_data_rag.json');
    let ragData = '';
    
    if (fs.existsSync(ragDataPath)) {
      // Read the entire file
      const rawData = fs.readFileSync(ragDataPath, 'utf-8');

      try {
        ragData = buildLightRag(rawData, mode, userMessage);
      } catch (parseError) {
        console.error('Error parsing RAG data for filtering:', parseError);
        ragData = '[]';
      }
    } else {
      console.warn('RAG data file not found at:', ragDataPath);
    }

    const selectedPersona = mode === 'audit' ? auditPersona : persona;
    const selectedLogic = mode === 'audit' ? '' : dashboardLogic;

    return `
${selectedPersona}

---

${selectedLogic}

---

### 本地知识库 (Local RAG Database)
这是从本地 RAG 库按“赛道锚定→影子品牌→标杆极值”规则抽取出来的最小上下文。
请严格基于以下数据回答，不要凭空捏造；如果抽不到关键信息，就直接追问用户补充。

\`\`\`json
${ragData}
\`\`\`
`;
  } catch (error) {
    console.error('Error generating system prompt:', error);
    return mode === 'audit' ? auditPersona : persona + '\n\n' + dashboardLogic;
  }
}
