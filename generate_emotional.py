import json
import os

# 定义【情绪补偿】板块下的5个子模块（孤独焦虑、玄学叙事、多巴胺/悦己主义、精致美学、懒人经济/Gap）及各自的代表性品牌数据
data = [
    {
        "motivation": "孤独焦虑",
        "section": "情绪补偿",
        "prescription": "赛博时代的低压陪伴，通过拟人化、去功能化或宠物经济提供无条件的接纳与治愈",
        "market_context": {
            "category": "潮玩/陪伴型玩偶/宠物经济",
            "market_size": "陪伴经济（含宠物与精神消费）市场规模破5000亿",
            "cagr": "16.8%",
            "capital_index": "5"
        },
        "brands_data": [
            {"name": "Jellycat", "sov": "毛绒玩具全网声量绝对顶流", "search": "情人节/七夕搜索激增，常年霸榜", "premium": "高，热门款溢价超20%", "prod": "巴塞罗那熊/水煮蛋挂件", "sales": "单品月销万件级，常断货", "gmv": "2024中国区销售额超8.3亿", "core": "万物皆可毛绒绒，提供情绪价值与解压陪伴", "topic": "#Jellycat戒断", "views": "10亿次+", "sentiment": "95分（狂热种草/治愈）"},
            {"name": "泡泡玛特 (POP MART)", "sov": "潮玩赛道声量第一", "search": "盲盒/潮玩热搜霸榜", "premium": "高，二级市场炒作溢价", "prod": "LABUBU 搪胶盲盒", "sales": "单系列发售即售罄超20万件", "gmv": "年营收破百亿", "core": "IP驱动的盲盒经济，购买瞬间的多巴胺与陪伴感", "topic": "#LABUBU", "views": "30亿次+", "sentiment": "90分（上头/端盒）"},
            {"name": "线条小狗 (Maltese)", "sov": "表情包IP实体化声量前列", "search": "线条小狗周边热搜", "premium": "中等", "prod": "线条小狗毛绒公仔/文创", "sales": "月销过万件", "gmv": "年销售额破亿", "core": "以极简、蠢萌的形象提供低门槛的情感共鸣", "topic": "#线条小狗", "views": "8亿次+", "sentiment": "92分（蠢萌治愈）"},
            {"name": "Loopy (赞萌露比)", "sov": "打工人嘴替IP，全网爆火", "search": "Loopy表情包/玩偶热搜", "premium": "中等", "prod": "Loopy 官方毛绒玩偶", "sales": "月销数万件", "gmv": "联名及周边销售额数亿", "core": "阴阳怪气与可爱反差萌，完美代入职场人精神状态", "topic": "#女明星Loopy", "views": "15亿次+", "sentiment": "88分（打工人共鸣）"},
            {"name": "网易云音乐 (NetEase Cloud Music)", "sov": "音乐流媒体中社区属性/情绪共鸣最强", "search": "网易云年度报告热搜", "premium": "低（黑胶VIP）", "prod": "网易云音乐黑胶VIP", "sales": "付费用户近4000万", "gmv": "年营收数十亿", "core": "“网抑云”乐评文化，深夜孤独患者的数字收容所", "topic": "#网易云乐评", "views": "20亿次+", "sentiment": "85分（emo/治愈）"},
            {"name": "pidan (彼蛋)", "sov": "高端宠物用品声量TOP1", "search": "雪屋猫砂盆/豆腐猫砂热搜", "premium": "高（设计与品牌溢价）", "prod": "pidan混合猫砂/雪屋", "sales": "月销数十万包", "gmv": "年营收超数亿", "core": "极简美学设计，提升养宠体验，服务于年轻人的终极陪伴（猫）", "topic": "#pidan猫砂", "views": "5亿次+", "sentiment": "90分（铲屎官必备/颜值高）"},
            {"name": "未卡 (VETRESKA)", "sov": "宠物生活方式品牌声量前列", "search": "仙人掌猫爬架热搜", "premium": "中高", "prod": "仙人掌猫爬架/西瓜猫厕所", "sales": "月销数千件", "gmv": "年销售额过亿", "core": "将宠物用品做成家居艺术品，满足主人的视觉享受与情感投射", "topic": "#仙人掌猫爬架", "views": "3亿次+", "sentiment": "88分（出片神器）"},
            {"name": "小红书 (Xiaohongshu)", "sov": "生活方式社区全网声量极高", "search": "搭子/找树洞热搜", "premium": "免费平台（通过电商变现）", "prod": "小红书APP", "sales": "月活破3亿", "gmv": "电商交易额快速增长", "core": "去中心化的“找搭子”文化与互助社区，对抗都市原子化孤独", "topic": "#找搭子", "views": "50亿次+", "sentiment": "90分（互助/种草）"},
            {"name": "米哈游 (miHoYo)", "sov": "二次元游戏声量全球顶流", "search": "原神/星穹铁道热搜霸榜", "premium": "极高（抽卡氪金）", "prod": "《原神》/《崩坏：星穹铁道》", "sales": "全球活跃玩家数千万", "gmv": "年营收超数百亿", "core": "塑造极具魅力的纸片人角色，提供深度的虚拟情感羁绊与养成感", "topic": "#原神", "views": "100亿次+", "sentiment": "85分（纸片人老公/老婆）"},
            {"name": "恋与制作人 (叠纸游戏)", "sov": "乙女向游戏声量霸主", "search": "恋与深空/李泽言热搜", "premium": "极高（为爱买单）", "prod": "《恋与深空》月卡/抽卡", "sales": "核心付费玩家超百万", "gmv": "单月流水数亿元", "core": "沉浸式恋爱体验，填补现实恋爱空缺，提供满分情绪价值", "topic": "#恋与深空", "views": "25亿次+", "sentiment": "94分（沉浸恋爱/陪伴）"},
            {"name": "Soul", "sov": "陌生人社交声量第一", "search": "Soul匹配/树洞热搜", "premium": "中等（增值服务收费）", "prod": "Soul APP 星币", "sales": "月活近3000万", "gmv": "年营收数十亿", "core": "灵魂社交，不看脸的语音与兴趣匹配，解决深夜倾诉欲", "topic": "#Soul星球", "views": "15亿次+", "sentiment": "82分（树洞/倾诉）"},
            {"name": "星巴克 (Starbucks)", "sov": "线下空间情绪补偿（第三空间）", "search": "星巴克气氛组/带电脑去星巴克热搜", "premium": "中高", "prod": "星巴克咖啡饮品", "sales": "中国区日均数百万杯", "gmv": "中国区营收超百亿", "core": "提供一个脱离家庭和公司的“第三空间”，适合一个人独处或轻社交", "topic": "#星巴克气氛组", "views": "8亿次+", "sentiment": "86分（氛围感/逃离感）"},
            {"name": "猫咖/撸宠体验馆", "sov": "线下体验型消费声量攀升", "search": "周末去哪撸猫热搜", "premium": "中等（按小时计费）", "prod": "撸宠门票/套餐", "sales": "周末节假日爆满", "gmv": "分散的本地生活服务", "core": "无需承担养宠责任，花钱购买短期的毛茸茸陪伴与治愈", "topic": "#撸猫治愈", "views": "6亿次+", "sentiment": "95分（解压/回血）"},
            {"name": "小冰 (Xiaoice)", "sov": "AI虚拟人类情感陪伴先行者", "search": "AI男友/女友热搜", "premium": "免费/部分增值", "prod": "小冰岛/AI克隆人", "sales": "用户交互破百亿次", "gmv": "ToB及ToC增值服务", "core": "永不失联、永远倾听的AI情感陪伴者", "topic": "#AI男友", "views": "4亿次+", "sentiment": "80分（新奇/填补空虚）"}
        ]
    },
    {
        "motivation": "玄学叙事",
        "section": "情绪补偿",
        "prescription": "在充满不确定性的世界中，利用东方香学、水晶、寺庙手串等构建心理仪式感与好运期许",
        "market_context": {
            "category": "香氛香薰/饰品/文创",
            "market_size": "泛玄学与心理疗愈市场规模超百亿",
            "cagr": "21.4%",
            "capital_index": "4"
        },
        "brands_data": [
            {"name": "观夏 (To Summer)", "sov": "东方植物香顶级声量", "search": "观夏颐和金桂/香薰热搜", "premium": "高，塑造奢侈品级稀缺感", "prod": "颐和金桂/昆仑煮雪香薰", "sales": "限量发售常秒空", "gmv": "年营收数亿", "core": "利用东方古典美学与香学，为居家空间构建特定场域的心理仪式感", "topic": "#观夏香薰", "views": "5亿次+", "sentiment": "92分（东方意境/宁静）"},
            {"name": "闻献 (DOCUMENTS)", "sov": "高端国潮香水代表", "search": "闻献香水/禅酷美学热搜", "premium": "极高（对标国际沙龙香）", "prod": "闻献浓香水系列", "sales": "单品数千至上万", "gmv": "单店坪效极高", "core": "主打“禅酷”风格，用极其浓郁的东方香料营造深沉的精神庇护所", "topic": "#闻献香水", "views": "3亿次+", "sentiment": "88分（高级感/清冷）"},
            {"name": "雍和宫/灵隐寺手串", "sov": "寺庙文创绝对顶流", "search": "雍和宫香灰琉璃/求财手串热搜霸榜", "premium": "中高（排队代购费极高）", "prod": "香灰琉璃手串/十八籽", "sales": "单日流通量惊人", "gmv": "寺庙文创营收巨额", "core": "年轻人在上班和上进之间选择了上香，将好运期许具象化为手串", "topic": "#雍和宫手串", "views": "25亿次+", "sentiment": "96分（心诚则灵/转运）"},
            {"name": "野兽派 (BULLKELION / 旗下香氛)", "sov": "生活方式与香氛声量极高", "search": "野兽派香水/送礼热搜", "premium": "高", "prod": "桂花乌龙/橘子海香薰", "sales": "月销数万件", "gmv": "年营收数十亿", "core": "极具画面感的命名与包装，为送礼与自用提供浪漫主义叙事", "topic": "#野兽派香氛", "views": "8亿次+", "sentiment": "89分（浪漫/仪式感）"},
            {"name": "AWW 水晶/天然石", "sov": "水晶疗愈圈层小众出圈", "search": "招财水晶/水晶手链热搜", "premium": "高", "prod": "草莓晶/紫水晶手链", "sales": "月销数千至万件", "gmv": "稳步增长", "core": "赋予不同晶石特定功效（招桃花、防小人），提供能量磁场的心理解药", "topic": "#水晶疗愈", "views": "6亿次+", "sentiment": "85分（磁场玄学/心安）"},
            {"name": "同道大叔", "sov": "星座文化IP第一人", "search": "星座运势/水逆热搜", "premium": "中等", "prod": "星座周边/盲盒", "sales": "周边月销过万", "gmv": "IP授权及电商破亿", "core": "用星座运势解释生活的不顺（水逆），提供抱团取暖的情绪出口", "topic": "#同道大叔星座", "views": "15亿次+", "sentiment": "84分（准到离谱/吐槽）"},
            {"name": "测测 (Cece)", "sov": "心理测试与塔罗声量TOP1", "search": "MBTI测试/星盘热搜", "premium": "中等（咨询付费）", "prod": "测测APP/达人咨询", "sales": "百万级月活", "gmv": "咨询抽成及增值服务过亿", "core": "结合MBTI、塔罗与心理学，为年轻人的迷茫提供解读与指引", "topic": "#测测星盘", "views": "10亿次+", "sentiment": "86分（找寻自我/解惑）"},
            {"name": "左其铂/各类塔罗博主", "sov": "泛玄学博主商业化", "search": "大众占卜/塔罗牌热搜", "premium": "高（私占收费高昂）", "prod": "线上占卜服务/转运好物", "sales": "高复购", "gmv": "头部博主年入千万", "core": "提供高互动性的大众占卜，给予情感迷茫期确定的心理暗示", "topic": "#大众占卜", "views": "20亿次+", "sentiment": "82分（领取好运）"},
            {"name": "冰希黎 (Boitown)", "sov": "平价香水声量前三", "search": "流沙金香水/平价香水热搜", "premium": "低", "prod": "幻彩鎏金香水", "sales": "月销数万瓶", "gmv": "年销售额破亿", "core": "高颜值流沙质地，以极低门槛让大众体验香水带来的情绪愉悦", "topic": "#冰希黎流沙香水", "views": "4亿次+", "sentiment": "80分（少女心/平价入坑）"},
            {"name": "Bananain蕉内 (红色保暖内衣)", "sov": "本命年红品类声量第一", "search": "本命年红内衣热搜", "premium": "中等", "prod": "红色星期六套装", "sales": "年底爆卖数十万套", "gmv": "单季销售额破亿", "core": "用现代设计重塑传统本命年辟邪习俗，消解土味，保留好运叙事", "topic": "#蕉内红内衣", "views": "3亿次+", "sentiment": "90分（辟邪转运/不土气）"},
            {"name": "网易严选 (黑凤梨)", "sov": "搞怪玄学周边", "search": "转运袜/锦鲤周边热搜", "premium": "中等", "prod": "锦鲤红袜/逢考必过文具", "sales": "考试季/新年爆发", "gmv": "千万级", "core": "借用互联网谐音梗（锦鲤、鸭梨山大），做轻量化的转运情绪消费", "topic": "#锦鲤转运", "views": "5亿次+", "sentiment": "85分（讨彩头）"},
            {"name": "故宫文创", "sov": "传统文化IP声量极高", "search": "故宫日历/御守热搜", "premium": "中等", "prod": "故宫御守/脊兽盲盒", "sales": "月销数万件", "gmv": "年营收数亿", "core": "皇家福气背书，兼具文化厚重感与祈福功能", "topic": "#故宫御守", "views": "8亿次+", "sentiment": "94分（国潮/祈福）"},
            {"name": "气味图书馆 (Scent Library)", "sov": "怀旧情怀香氛第一品牌", "search": "凉白开香水热搜", "premium": "中等", "prod": "凉白开/大白兔联名香水", "sales": "累计销量数百万瓶", "gmv": "年销售额数亿", "core": "提取中国人的集体国民记忆（凉白开、大白兔），通过嗅觉唤醒童年无忧无虑的情绪", "topic": "#凉白开香水", "views": "6亿次+", "sentiment": "88分（情怀杀/国民记忆）"}
        ]
    },
    {
        "motivation": "多巴胺与悦己主义",
        "section": "情绪补偿",
        "prescription": "用高饱和度色彩、强烈的味觉刺激与即时反馈，换取瞬间的快乐爆发与自我犒赏",
        "market_context": {
            "category": "新茶饮/彩妆/甜品烘焙",
            "market_size": "新茶饮及悦己消费市场超4000亿",
            "cagr": "14.5%",
            "capital_index": "4"
        },
        "brands_data": [
            {"name": "霸王茶姬 (CHAGEE)", "sov": "新茶饮全网声量顶流", "search": "伯牙绝弦/奶茶免单热搜霸榜", "premium": "中等", "prod": "伯牙绝弦", "sales": "单品年销过亿杯", "gmv": "年营收破百亿", "core": "国风包装与极强社交货币属性，一杯奶茶换取半天的好心情", "topic": "#霸王茶姬免单", "views": "30亿次+", "sentiment": "92分（国风/快乐水）"},
            {"name": "瑞幸咖啡 (Starbucks)", "sov": "咖啡续命声量第一", "search": "瑞幸9.9/生椰拿铁热搜", "premium": "极低（9.9元常态化）", "prod": "生椰拿铁/酱香拿铁", "sales": "生椰拿铁累计破7亿杯", "gmv": "年营收破200亿", "core": "极致的低门槛与高频联名（茅台、猫和老鼠），打工人的日常多巴胺源泉", "topic": "#瑞幸9.9", "views": "50亿次+", "sentiment": "95分（续命/平价快乐）"},
            {"name": "花知晓 (Flower Knows)", "sov": "少女心彩妆声量第一", "search": "花知晓马卡龙/独角兽热搜", "premium": "中等", "prod": "马卡龙系列/天鹅芭蕾", "sales": "爆款月销过10万件", "gmv": "年营收破10亿", "core": "极尽繁复华丽的洛可可包装，即使不化妆买来看着也是极大的视觉愉悦", "topic": "#花知晓少女心", "views": "15亿次+", "sentiment": "90分（颜控必入/梦幻）"},
            {"name": "好利来 (Holiland)", "sov": "烘焙界联名狂魔", "search": "好利来半熟芝士/联名热搜", "premium": "中高", "prod": "半熟芝士/各类IP联名蛋糕", "sales": "门店及线上大排长龙", "gmv": "年营收数十亿", "core": "通过与哈利波特、芭比等高频联名，将高热量甜品转化为精神上的极致自我犒赏", "topic": "#好利来联名", "views": "12亿次+", "sentiment": "94分（神仙联名/好吃）"},
            {"name": "乐事 (Lay's)", "sov": "休闲零食声量霸主", "search": "乐事薯片新口味热搜", "premium": "低", "prod": "原切薯片", "sales": "日销海量", "gmv": "百亿级", "core": "最纯粹的碳水与钠带来的多巴胺爆发，宅家看剧标配", "topic": "#周末宅家吃什么", "views": "20亿次+", "sentiment": "88分（快乐源泉/罪恶感）"},
            {"name": "完美日记 (Perfect Diary)", "sov": "国货彩妆领军者", "search": "完美日记口红/动物眼影盘热搜", "premium": "低", "prod": "动物眼影盘/仿生膜口红", "sales": "月销数十万件", "gmv": "年营收数十亿", "core": "高频推新与极低试错成本，买口红成为最廉价的悦己消费", "topic": "#平价彩妆", "views": "18亿次+", "sentiment": "85分（高性价比/国货）"},
            {"name": "野兽派 (花艺业务)", "sov": "高端鲜花送礼声量TOP1", "search": "野兽派鲜花/情人节热搜", "premium": "极高", "prod": "枪炮玫瑰/永生花盒", "sales": "节日爆单", "gmv": "营收数亿", "core": "无用但绝美的浪漫，为特殊日子提供最高浓度的仪式感与多巴胺", "topic": "#情人节礼物", "views": "10亿次+", "sentiment": "86分（浪漫至死不渝）"},
            {"name": "名创优品 (MINISO)", "sov": "平价百货声量王", "search": "名创优品盲盒/联名热搜", "premium": "极低", "prod": "各类IP联名公仔/百货", "sales": "门店日均客流庞大", "gmv": "年营收过百亿", "core": "十元店模式下的IP狂欢（三丽鸥、迪士尼），实现毫无压力的“全都要”悦己自由", "topic": "#名创优品好物", "views": "15亿次+", "sentiment": "90分（平价天堂/好逛）"},
            {"name": "ColorKey (色彩地带)", "sov": "唇釉赛道声量极高", "search": "丝绒唇釉/镜面水光热搜", "premium": "极低", "prod": "空气唇釉", "sales": "月销数十万支", "gmv": "年营收破十亿", "core": "以极其低廉的价格提供极高色彩饱和度的妆效反馈", "topic": "#学生党口红", "views": "8亿次+", "sentiment": "84分（平价战斗机）"},
            {"name": "Lululemon", "sov": "运动悦己服饰声量天花板", "search": "Lululemon瑜伽裤热搜", "premium": "高", "prod": "Align 瑜伽裤", "sales": "单品月销数万条", "gmv": "中国区营收近百亿", "core": "穿上即翘臀的视觉反馈与极致裸感，倡导运动即悦己的生活哲学", "topic": "#Lululemon穿搭", "views": "25亿次+", "sentiment": "92分（修身/中产标配）"},
            {"name": "Bolsa/Chuu (女装)", "sov": "多巴胺穿搭声量极高", "search": "多巴胺穿搭/辣妹装热搜", "premium": "中等", "prod": "高饱和度短上衣/百褶裙", "sales": "月销数万件", "gmv": "数亿级", "core": "高明度色彩与大胆剪裁，直接通过着装向外界宣告快乐与自信", "topic": "#多巴胺穿搭", "views": "30亿次+", "sentiment": "88分（显白/辣妹）"},
            {"name": "橘朵 (Judydoll)", "sov": "单色眼影/腮红赛道霸主", "search": "橘朵腮红/单色眼影热搜", "premium": "极低", "prod": "单色腮红/眼影", "sales": "月销破百万件", "gmv": "年营收破十亿", "core": "几十块钱买来的色彩实验，妆容变换带来的即时心情提振", "topic": "#橘朵女孩", "views": "12亿次+", "sentiment": "85分（玩色/便宜）"},
            {"name": "OATLY (噢麦力)", "sov": "燕麦奶赛道声量第一", "search": "燕麦拿铁/健康轻食热搜", "premium": "中高", "prod": "咖啡大师燕麦奶", "sales": "B端及C端销量庞大", "gmv": "中国区营收十亿级", "core": "提供无负担（乳糖不耐友好、植物基）的甜美反馈，悦己的同时消解健康焦虑", "topic": "#燕麦奶拿铁", "views": "6亿次+", "sentiment": "90分（健康好喝/环保）"}
        ]
    },
    {
        "motivation": "懒人经济与Gap心态",
        "section": "情绪补偿",
        "prescription": "花钱买时间，通过预制化与高度集成化的产品，换取彻底躺平与放空的 Gap 时光",
        "market_context": {
            "category": "智能家电/预制食品/上门服务",
            "market_size": "懒人经济市场规模超2000亿",
            "cagr": "18.5%",
            "capital_index": "4"
        },
        "brands_data": [
            {"name": "叮咚买菜 (预制菜业务)", "sov": "生鲜及快手菜声量极高", "search": "叮咚快手菜/预制菜热搜", "premium": "中等", "prod": "拳击虾/酸菜鱼半成品", "sales": "预制菜订单占比超20%", "gmv": "预制菜年营收数十亿", "core": "免洗免切，微波即食，彻底拯救不想做饭又想吃好的下班时间", "topic": "#下班吃什么", "views": "8亿次+", "sentiment": "85分（方便快捷/省事）"},
            {"name": "空刻意面 (AIRMETER)", "sov": "速食意面赛道绝对第一", "search": "空刻意面/星级意面热搜", "premium": "中高（相比传统泡面）", "prod": "经典番茄肉酱意面", "sales": "累计卖出超亿盒", "gmv": "年营收破10亿", "core": "将复杂的西餐工序高度标准化（15分钟出锅），提供带有一丝精致感的偷懒", "topic": "#空刻意面", "views": "5亿次+", "sentiment": "90分（懒人西餐/好吃）"},
            {"name": "美团/饿了么 (跑腿代购)", "sov": "即时配送声量顶流", "search": "美团跑腿/代排队热搜", "premium": "高（服务费）", "prod": "万物皆可送/代买服务", "sales": "日均千万单级", "gmv": "本地生活核心业务", "core": "极致的花钱买时间，将一切不想跑腿的琐事外包", "topic": "#万能的跑腿小哥", "views": "10亿次+", "sentiment": "92分（救急/彻底躺平）"},
            {"name": "追觅 (洗地机)", "sov": "清洁电器解放双手代表", "search": "追觅洗地机/自动上下水热搜", "premium": "高", "prod": "H30 Pro 洗地机", "sales": "月销万台级", "gmv": "年营收数十亿", "core": "不仅能扫拖，还能自清洁烘干，彻底终结家务内耗", "topic": "#解放双手家电", "views": "15亿次+", "sentiment": "88分（早买早享受）"},
            {"name": "自嗨锅", "sov": "自热食品开创者之一", "search": "自嗨锅自热火锅热搜", "premium": "中等", "prod": "麻辣牛肉自热火锅", "sales": "月销数十万盒", "gmv": "年营收数亿", "core": "连热水都不用烧，倒瓶冷水就能吃上热火锅的极致懒惰", "topic": "#深夜食堂自热锅", "views": "6亿次+", "sentiment": "84分（夜宵救星）"},
            {"name": "云鲸 (TINECO)", "sov": "扫拖机器人声量前列", "search": "云鲸J4/不洗拖把热搜", "premium": "高", "prod": "云鲸J4", "sales": "月销数万台", "gmv": "年营收破十亿", "core": "主打基站全能，不脏手不费力，把周末时间留给沙发", "topic": "#光脚自由", "views": "8亿次+", "sentiment": "90分（懒人福音）"},
            {"name": "王小卤", "sov": "虎皮凤爪赛道绝对霸主", "search": "王小卤追剧零食热搜", "premium": "中高", "prod": "虎皮凤爪", "sales": "连续多年全国销量第一", "gmv": "年营收破十亿", "core": "一嗦脱骨的极致软烂，完美适配躺在沙发上边吃边看剧的Gap状态", "topic": "#追剧必备零食", "views": "10亿次+", "sentiment": "94分（一嗦脱骨/停不下来）"},
            {"name": "好欢螺", "sov": "螺蛳粉声量第一", "search": "好欢螺加臭加辣热搜", "premium": "中等", "prod": "经典原味螺蛳粉", "sales": "月销数百万袋", "gmv": "年营收数十亿", "core": "重口味刺激与极简烹饪的结合，年轻人周末宅家堕落标配", "topic": "#螺蛳粉自由", "views": "20亿次+", "sentiment": "95分（又臭又香/上头）"},
            {"name": "天鹅到家", "sov": "家政保洁上门服务头部", "search": "上门保洁/大扫除热搜", "premium": "中高", "prod": "日常保洁套餐", "sales": "订单量节假日激增", "gmv": "年营收数亿", "core": "周末绝不搞卫生，花几百块买四个小时的清净与干净", "topic": "#上门保洁", "views": "3亿次+", "sentiment": "86分（花钱买清净）"},
            {"name": "小熊电器 (Bear)", "sov": "迷你懒人家电声量TOP1", "search": "小熊养生壶/煮蛋器热搜", "premium": "低", "prod": "全自动养生壶/电炖锅", "sales": "月销数十万台", "gmv": "年营收近40亿", "core": "按个键就不用管的傻瓜式操作，单身青年的极简糊弄学", "topic": "#独居好物", "views": "7亿次+", "sentiment": "85分（小巧不占地/方便）"},
            {"name": "东方甄选 (免洗烘焙)", "sov": "直播间懒人食品声量高", "search": "空气炸锅美食/烤肠热搜", "premium": "中等", "prod": "原切烤肠/蛋挞皮", "sales": "直播间单场爆卖上万单", "gmv": "食品生鲜年营收数十亿", "core": "空气炸锅扔进去即可，0厨艺门槛，零失败率", "topic": "#空气炸锅美食", "views": "15亿次+", "sentiment": "90分（手残党救星）"},
            {"name": "三顿半 (SATURNBIRD)", "sov": "精品速溶咖啡声量第一", "search": "超即溶咖啡/三顿半热搜", "premium": "中高（相比雀巢）", "prod": "超即溶黑咖啡（数字系列）", "sales": "双十一常年霸榜", "gmv": "年营收数亿", "core": "冷水/牛奶三秒即溶，无需咖啡机与手冲手艺的懒人精品咖啡", "topic": "#三秒即溶", "views": "8亿次+", "sentiment": "92分（方便好喝/包装好看）"},
            {"name": "林氏木业 (沙发类)", "sov": "懒人沙发/家居声量极高", "search": "懒人沙发/云朵沙发热搜", "premium": "中等", "prod": "大白熊懒人沙发", "sales": "月销过万件", "gmv": "家居品类破百亿", "core": "提供一个完全没有骨架支撑、让人彻底瘫软陷进去的物理空间", "topic": "#周末躺平", "views": "5亿次+", "sentiment": "88分（包裹感/不想起）"}
        ]
    }
]

# 组装为 RAG-JSON Schema 格式
rag_json_output = []

for section_data in data:
    brands_list = []
    for b in section_data["brands_data"]:
        brands_list.append({
            "brand_name": b["name"],
            "brand_sov": b["sov"],
            "search_index": b["search"],
            "premium_rate": b["premium"],
            "products": [
                {
                    "product_name": b["prod"],
                    "sales_volume": b["sales"],
                    "gmv": b["gmv"],
                    "core_value": b["core"]
                }
            ],
            "topics": [
                {
                    "topic_name": b["topic"],
                    "views": b["views"],
                    "sentiment_score": b["sentiment"]
                }
            ]
        })
        
    rag_json_output.append({
        "motivation": section_data["motivation"],
        "section": section_data["section"],
        "prescription": section_data["prescription"],
        "market_context": section_data["market_context"],
        "brands": brands_list
    })

# 保存为 JSON 文件
output_file = "emotional_offset_rag.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(rag_json_output, f, ensure_ascii=False, indent=2)

print(f"Emotional Offset Data generation complete! Saved to {output_file}")
