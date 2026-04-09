import json
import os

# 定义【智性决策】板块下的5个子模块及各自的15个代表性品牌数据
data = [
    {
        "motivation": "科技平权",
        "section": "智性决策",
        "prescription": "击碎行业溢价，将高端技术下放至大众消费级市场，提供高性能参数平替",
        "market_context": {
            "category": "智能家电/新锐数码/新能源",
            "market_size": "泛智能硬件市场规模超万亿，国货平替渗透率达65%",
            "cagr": "15.5%",
            "capital_index": "5"
        },
        "brands_data": [
            {"name": "徕芬 (Laifen)", "sov": "全网提及超千万，稳居品类TOP1", "search": "大促节点搜索指数激增300%", "premium": "极低，主打百元级体验千元级性能", "prod": "徕芬高速吹风机SE", "sales": "月销30万+台", "gmv": "月销超1.5亿", "core": "高转速无刷电机，极致性价比", "topic": "#戴森平替", "views": "5亿次+", "sentiment": "85分（性价比认可）"},
            {"name": "追觅 (Dreame)", "sov": "扫地机器人品类前三", "search": "稳步上升，清洁电器搜索TOP2", "premium": "中等，通过技术下放抗衡戴森", "prod": "追觅X30扫地机器人", "sales": "月销5万+台", "gmv": "月销超2亿", "core": "仿生机械臂技术，极致清洁", "topic": "#追觅洗地机", "views": "8亿次+", "sentiment": "88分（清洁力认可）"},
            {"name": "石头科技 (Roborock)", "sov": "全网提及超800万", "search": "技术派消费者搜索极高", "premium": "中等，凭借算法壁垒定价", "prod": "石头P10 Pro", "sales": "月销4万+台", "gmv": "月销超1.5亿", "core": "RR mason算法，动态机械臂", "topic": "#石头扫地机器人", "views": "6亿次+", "sentiment": "90分（算法聪明）"},
            {"name": "小米 (Xiaomi)", "sov": "国民级声量，全网第一", "search": "常年霸榜数码/家电/汽车搜索", "premium": "极低，性价比代名词", "prod": "小米SU7 / 全屋智能", "sales": "SU7锁单超10万辆", "gmv": "月销超200亿（综合）", "core": "人车家全生态，价格屠夫", "topic": "#小米SU7", "views": "100亿次+", "sentiment": "85分（科技普惠）"},
            {"name": "漫步者 (Edifier)", "sov": "音频类目全网前三", "search": "学生党及入门音频首选", "premium": "极低", "prod": "漫步者Lolli Pro 3", "sales": "月销20万+件", "gmv": "月销超6000万", "core": "百元级主动降噪与Hi-Res音质", "topic": "#平价蓝牙耳机", "views": "3亿次+", "sentiment": "82分（学生党福音）"},
            {"name": "零跑 (Leapmotor)", "sov": "造车新势力提及量快速攀升", "search": "15万级新能源车热搜TOP3", "premium": "极低，主打半价体验", "prod": "零跑C10", "sales": "月销超1.5万辆", "gmv": "月销超20亿", "core": "四叶草中央集成架构，科技平权标杆", "topic": "#零跑C10", "views": "4亿次+", "sentiment": "86分（极致堆料）"},
            {"name": "极氪 (Zeekr)", "sov": "高端纯电全网声量前五", "search": "性能车/猎装车热搜TOP1", "premium": "中高，但对比保时捷等极具性价比", "prod": "极氪001", "sales": "月销破万辆", "gmv": "月销超30亿", "core": "极致操控与底盘素质", "topic": "#极氪001", "views": "15亿次+", "sentiment": "88分（操控标杆）"},
            {"name": "韶音 (Shokz)", "sov": "骨传导耳机绝对霸主", "search": "运动耳机品类搜索TOP1", "premium": "较高，掌握核心专利", "prod": "OpenRun Pro 2", "sales": "月销5万+件", "gmv": "月销超8000万", "core": "开放双耳设计，骨传导技术壁垒", "topic": "#韶音骨传导", "views": "5亿次+", "sentiment": "92分（运动必备）"},
            {"name": "影石 (Insta360)", "sov": "全景相机品类声量第一", "search": "运动相机/Vlog神器热搜TOP1", "premium": "中高，技术领先", "prod": "X4 全景相机", "sales": "月销3万+台", "gmv": "月销超1亿", "core": "隐形自拍杆，先拍摄后取景", "topic": "#insta360", "views": "20亿次+", "sentiment": "95分（滑雪/骑行神器）"},
            {"name": "大疆 (DJI)", "sov": "无人机全网声量断层第一", "search": "稳居消费级无人机/云台榜首", "premium": "高，技术壁垒极强", "prod": "Mini 4 Pro", "sales": "月销超5万台", "gmv": "月销超2亿", "core": "全向视觉避障，249g免注册", "topic": "#大疆航拍", "views": "50亿次+", "sentiment": "94分（画质与技术崇拜）"},
            {"name": "极米 (XGIMI)", "sov": "智能投影仪声量TOP1", "search": "家用投影仪常年霸榜", "premium": "中等", "prod": "极米Z7X", "sales": "月销4万+台", "gmv": "月销超1亿", "core": "轻薄设计，CCB电影色彩亮度", "topic": "#卧室投影仪", "views": "8亿次+", "sentiment": "85分（居家影院）"},
            {"name": "峰米 (Formovie)", "sov": "激光投影/电视声量前三", "search": "激光投影搜索热度快速上升", "premium": "中高，但对比传统电视性价比高", "prod": "峰米X5", "sales": "月销1.5万+台", "gmv": "月销超5000万", "core": "ALPD激光显示技术下放", "topic": "#峰米激光投影", "views": "2亿次+", "sentiment": "86分（高亮度体验）"},
            {"name": "零刻 (Beelink)", "sov": "迷你主机(Mini PC)破圈者", "search": "迷你主机搜索量TOP1", "premium": "极低", "prod": "SER8 迷你主机", "sales": "月销2万+台", "gmv": "月销超4000万", "core": "极致小巧，取代传统傻大黑粗办公机", "topic": "#迷你主机", "views": "3亿次+", "sentiment": "89分（桌面空间拯救者）"},
            {"name": "机械革命 (Mechrevo)", "sov": "游戏本贴吧/B站声量前三", "search": "平价游戏本/神车热搜", "premium": "极低，价格屠夫", "prod": "极光Pro", "sales": "月销3万+台", "gmv": "月销超1.5亿", "core": "满血显卡，越级配置", "topic": "#机械革命极光", "views": "4亿次+", "sentiment": "80分（上船/性价比神机）"},
            {"name": "绿联 (Ugreen)", "sov": "数码配件/NAS国民品牌", "search": "平替NAS与配件搜索TOP1", "premium": "低，主打实用平替", "prod": "绿联DX4600 NAS", "sales": "月销2万+台", "gmv": "月销超4000万", "core": "降低NAS使用门槛，极简易用", "topic": "#私有云", "views": "6亿次+", "sentiment": "84分（小白福音）"}
        ]
    },
    {
        "motivation": "信息平权",
        "section": "智性决策",
        "prescription": "打破知识与信息壁垒，通过AI工具与内容平台实现认知平权与效率提升",
        "market_context": {
            "category": "AI工具/泛知识内容/教育科技",
            "market_size": "知识付费及AIGC工具市场规模破千亿",
            "cagr": "28.4%",
            "capital_index": "5"
        },
        "brands_data": [
            {"name": "Kimi (月之暗面)", "sov": "国内大模型C端声量第一梯队", "search": "长文本处理/AI助手搜索TOP1", "premium": "免费/低门槛订阅", "prod": "Kimi智能助手", "sales": "月活用户破2000万", "gmv": "打赏与企业API服务快速增长", "core": "超长文本解析，无损上下文理解", "topic": "#Kimi使用教程", "views": "15亿次+", "sentiment": "92分（生产力颠覆）"},
            {"name": "豆包 (Doubao)", "sov": "全网下载量第一的AI应用", "search": "AI对话工具热搜霸榜", "premium": "免费", "prod": "豆包APP", "sales": "月活用户破3000万", "gmv": "背靠字节生态，暂不急于变现", "core": "拟人化语音交互，低门槛AI普及", "topic": "#豆包AI", "views": "20亿次+", "sentiment": "88分（好用且免费）"},
            {"name": "智谱清言 (Zhipu)", "sov": "国内学术与开发者群体声量极高", "search": "国产大模型基准搜索TOP3", "premium": "企业级收费/C端免费", "prod": "GLM-4 / 清言APP", "sales": "B端客户超数千家", "gmv": "B端营收破亿", "core": "全模态能力，图文理解双绝", "topic": "#智谱清言", "views": "5亿次+", "sentiment": "90分（国产之光）"},
            {"name": "哔哩哔哩 (Bilibili)", "sov": "中国最大的泛知识视频社区", "search": "学习/教程/科普搜索首选平台", "premium": "大会员定价亲民", "prod": "B站知识区", "sales": "日均活跃用户破亿", "gmv": "广告及增值服务超百亿", "core": "免费且高质量的UP主自制课程", "topic": "#B站学习", "views": "100亿次+", "sentiment": "95分（年轻人的大学）"},
            {"name": "得到 (Dedao)", "sov": "精英阶层知识付费声量TOP1", "search": "终身学习/大师课搜索核心", "premium": "高溢价（知识的尊贵感）", "prod": "得到APP/听书VIP", "sales": "累计用户超5000万", "gmv": "年营收数亿元", "core": "严格品控的浓缩知识胶囊", "topic": "#罗振宇跨年演讲", "views": "8亿次+", "sentiment": "85分（知识焦虑缓解）"},
            {"name": "小宇宙 (Xiaoyuzhou)", "sov": "中文播客绝对统治者", "search": "高质量音频节目搜索TOP1", "premium": "免费为主，部分单集付费", "prod": "小宇宙APP", "sales": "核心活跃听众超500万", "gmv": "商业赞助及付费节目增长迅猛", "core": "纯粹的收听体验，高信噪比交流", "topic": "#播客推荐", "views": "12亿次+", "sentiment": "96分（精神自留地）"},
            {"name": "微信读书 (WeChat Read)", "sov": "电子书阅读领域声量断层第一", "search": "免费读书/网文热搜", "premium": "极低（体验极佳的免费无限卡模式）", "prod": "微信读书APP", "sales": "注册用户超3亿", "gmv": "付费会员稳定贡献收入", "core": "基于微信社交关系的阅读激励，排版精美", "topic": "#微信读书书单", "views": "15亿次+", "sentiment": "98分（良心产品）"},
            {"name": "夸克 (Quark)", "sov": "学生及年轻职场人声量极高", "search": "扫描/网盘/AI解答搜索TOP1", "premium": "低，主推学生VIP", "prod": "夸克扫描王/网盘", "sales": "月活用户超千万", "gmv": "会员订阅收入稳健", "core": "极简极速，集百宝箱于一身", "topic": "#夸克学习神器", "views": "10亿次+", "sentiment": "88分（高效无广）"},
            {"name": "百度文库 (Baidu Wenku)", "sov": "办公/学习文档声量TOP1", "search": "PPT生成/范文搜索绝对霸主", "premium": "中等，通过AI功能推高VIP转化", "prod": "百度文库AI助手", "sales": "累计用户数亿", "gmv": "年会员收入破十亿量级", "core": "一键生成PPT与文档，依托庞大语料库", "topic": "#AI做PPT", "views": "8亿次+", "sentiment": "82分（打工人救星）"},
            {"name": "多邻国 (Duolingo)", "sov": "外语学习类应用声量全球第一", "search": "零基础学外语搜索首选", "premium": "免费/Super会员低门槛", "prod": "多邻国APP", "sales": "中国区日活百万级", "gmv": "订阅费及内购稳健增长", "core": "游戏化学习机制，消解学习痛苦", "topic": "#多邻国打卡", "views": "6亿次+", "sentiment": "92分（绿色魔鬼催学）"},
            {"name": "帆书 (FanDeng)", "sov": "下沉市场及熟龄人群声量极大", "search": "听书/读书会热搜", "premium": "中等", "prod": "帆书VIP", "sales": "注册用户超6000万", "gmv": "年营收超十亿", "core": "樊登个人IP背书，用大白话拆解经典", "topic": "#帆书推荐", "views": "7亿次+", "sentiment": "85分（实用主义）"},
            {"name": "知乎 (Zhihu)", "sov": "图文深度问答声量第一", "search": "硬核科普/盐言故事热搜", "premium": "中等", "prod": "盐选会员", "sales": "月活过亿", "gmv": "会员服务及广告为核心", "core": "专业人士聚集地，提供高价值信息增量", "topic": "#知乎神回复", "views": "20亿次+", "sentiment": "80分（分享刚编的故事/硬核干货）"},
            {"name": "喜马拉雅 (Ximalaya)", "sov": "长音频赛道声量巨头", "search": "有声书/广播剧热搜", "premium": "中等", "prod": "喜马拉雅VIP", "sales": "全端月活破2亿", "gmv": "营收数十亿", "core": "版权音频内容最全，通勤/助眠必备", "topic": "#喜马拉雅听书", "views": "15亿次+", "sentiment": "84分（陪伴感）"},
            {"name": "猿辅导 (Yuanfudao)", "sov": "教育科技及智能硬件声量TOP2", "search": "错题打印/学伴机热搜", "premium": "中高（硬件溢价）", "prod": "小猿学练机", "sales": "硬件销量破百万台", "gmv": "硬件销售额破10亿", "core": "墨水屏护眼+海量真题库", "topic": "#小猿学练机", "views": "5亿次+", "sentiment": "86分（护眼与专注）"},
            {"name": "网易有道 (Youdao)", "sov": "翻译/词典智能硬件声量TOP1", "search": "词典笔搜索霸榜", "premium": "中高", "prod": "有道词典笔X6 Pro", "sales": "词典笔累计销量数百万台", "gmv": "硬件营收数亿元", "core": "毫秒级扫译，AI大模型加持的口语教练", "topic": "#有道词典笔", "views": "4亿次+", "sentiment": "89分（提效神器）"}
        ]
    },
    {
        "motivation": "秩序与掌控感",
        "section": "智性决策",
        "prescription": "通过桌面美学、量化追踪与模块化设计，对抗外界不确定性，建立个人专属的秩序与掌控",
        "market_context": {
            "category": "桌面美学/智能穿戴/外设",
            "market_size": "桌面经济与智能穿戴市场规模近3000亿",
            "cagr": "12.8%",
            "capital_index": "4"
        },
        "brands_data": [
            {"name": "闪极 (Sharge)", "sov": "极客圈层声量极高", "search": "透明充电宝/赛博朋克外设热搜", "premium": "高（设计溢价）", "prod": "超级移动电源", "sales": "月销万件级", "gmv": "年销售额破亿", "core": "赛博透明设计，可视化电量与功率参数", "topic": "#桌面美学", "views": "10亿次+", "sentiment": "92分（极客浪漫/掌控感）"},
            {"name": "安克 (Anker)", "sov": "全球快充领域声量霸主", "search": "氮化镓/多口充电器搜索TOP1", "premium": "中高", "prod": "Anker Prime 充电基站", "sales": "全球累计用户过亿", "gmv": "年营收过百亿", "core": "极致的充电安全与多设备一站式供电", "topic": "#桌面充电站", "views": "8亿次+", "sentiment": "90分（安心可靠）"},
            {"name": "少数派 (sspai)", "sov": "数字生活家/效率控声量核心阵地", "search": "效率工具/PiPods热搜", "premium": "高（文化与圈层溢价）", "prod": "少数派联名周边及键盘", "sales": "垂直受众高频复购", "gmv": "电商年流水数千万", "core": "倡导高效率数字生活，输出秩序感价值观", "topic": "#少数派推荐", "views": "3亿次+", "sentiment": "95分（品味认证）"},
            {"name": "魅族PANDAER", "sov": "潮酷桌面配件声量前五", "search": "潮玩外设热搜", "premium": "中高", "prod": "PANDAER 机械键盘/充电器", "sales": "单品月销数千件", "gmv": "稳定破千万级", "core": "强烈的视觉涂装与生态秩序美学", "topic": "#PANDAER桌面", "views": "2亿次+", "sentiment": "88分（颜值正义）"},
            {"name": "怒喵 (Angry Miao)", "sov": "客制化键盘天花板，声量极高", "search": "客制化键盘热搜TOP1", "premium": "极高（奢侈品级溢价）", "prod": "CYBERBOARD 键盘", "sales": "单批次限量发售即秒空", "gmv": "单品发布销售额数千万", "core": "极致的做工、LED阵列定制与未来感设计", "topic": "#怒喵键盘", "views": "1.5亿次+", "sentiment": "85分（富哥玩具/顶级质感）"},
            {"name": "渴创 (Keychron)", "sov": "Mac/程序员圈层键盘声量第一", "search": "Mac机械键盘热搜TOP1", "premium": "中等", "prod": "Keychron Q系列/K系列", "sales": "月销数万把", "gmv": "年销售额破数亿", "core": "完美适配Mac系统，全键无冲，VIA改键", "topic": "#程序员键盘", "views": "4亿次+", "sentiment": "92分（生产力利器）"},
            {"name": "乐歌 (Loctek)", "sov": "升降桌领域声量绝对第一", "search": "人体工学/升降桌搜索TOP1", "premium": "中等（规模效应压低成本）", "prod": "乐歌E4升降桌", "sales": "月销过万张", "gmv": "年营收数十亿", "core": "一键升降，打破久坐焦虑，掌控工作姿态", "topic": "#乐歌升降桌", "views": "5亿次+", "sentiment": "89分（打工人续命）"},
            {"name": "明基 (BenQ)", "sov": "屏幕挂灯品类开创者及霸主", "search": "屏幕挂灯/护眼灯搜索TOP1", "premium": "高（专利光路设计溢价）", "prod": "ScreenBar Halo", "sales": "单品月销数千至上万件", "gmv": "年销售额过亿", "core": "非对称光路，不反光，营造专注光场", "topic": "#屏幕挂灯", "views": "6亿次+", "sentiment": "94分（沉浸感/护眼标杆）"},
            {"name": "几光 (EZVALO)", "sov": "桌面氛围照明声量前列", "search": "桌面氛围灯热搜", "premium": "中等", "prod": "几光雕刻家台灯/智能拾音灯", "sales": "月销数万件", "gmv": "年销售额破亿", "core": "无线化设计，模块化组合，重塑光影秩序", "topic": "#桌面氛围感", "views": "4亿次+", "sentiment": "87分（精致美学）"},
            {"name": "野作 (Yezuo)", "sov": "实木桌面收纳圈层名气大", "search": "实木显示器增高架/收纳热搜", "premium": "高（手工实木溢价）", "prod": "胡桃木显示器支架及收纳模块", "sales": "月销数千件", "gmv": "稳定千万级", "core": "利用实木质感与模块化收纳，解决桌面凌乱", "topic": "#桌面收纳", "views": "3亿次+", "sentiment": "90分（治愈强迫症）"},
            {"name": "文石 (BOOX)", "sov": "大尺寸墨水屏/办公本声量TOP1", "search": "护眼办公/墨水屏平板热搜", "premium": "中高", "prod": "BOOX Tab Ultra", "sales": "月销过万台", "gmv": "年营收数亿元", "core": "开放安卓系统结合墨水屏，掌控护眼与效率", "topic": "#墨水屏阅读", "views": "2.5亿次+", "sentiment": "88分（沉浸阅读/深度护眼）"},
            {"name": "华为运动健康 (Huawei Wearables)", "sov": "智能穿戴声量全国第一", "search": "智能手表/健康监测搜索霸榜", "premium": "中高（自研传感与生态溢价）", "prod": "HUAWEI WATCH GT4 / D系列", "sales": "出货量千万级", "gmv": "百亿级营收", "core": "精准的生命体征量化数据，将健康掌控在手腕", "topic": "#华为智能手表", "views": "30亿次+", "sentiment": "95分（量化自我/硬核健康）"},
            {"name": "佳明 (Garmin)", "sov": "专业户外与硬核运动腕表声量第一", "search": "铁三/马拉松手表搜索首选", "premium": "极高", "prod": "Fenix 7 / Epix系列", "sales": "全球出货量稳定", "gmv": "百亿级营收（全球）", "core": "极度硬核的数据追踪，GPS与身体电量精准量化", "topic": "#佳明手表", "views": "8亿次+", "sentiment": "96分（专业可靠/硬汉标配）"},
            {"name": "Keep", "sov": "运动健身APP及周边硬件声量第一", "search": "减脂/居家健身热搜", "premium": "中等", "prod": "Keep智能动感单车/体脂秤", "sales": "单车月销万台级", "gmv": "硬件及消费品年营收破10亿", "core": "内容+硬件协同，将燃脂过程可视化、数据化", "topic": "#居家健身", "views": "40亿次+", "sentiment": "85分（自律与掌控感）"},
            {"name": "群晖 (Synology)", "sov": "NAS私有云绝对王者", "search": "NAS/数据备份搜索TOP1", "premium": "高（买软件送硬件）", "prod": "DS923+ / DS224+", "sales": "国内出货量稳居前列", "gmv": "亿元级营收", "core": "DSM系统的无敌体验，将数字资产绝对掌控在自己手中", "topic": "#数据备份", "views": "5亿次+", "sentiment": "94分（数字资产安全感）"}
        ]
    },
    {
        "motivation": "生产力与效率",
        "section": "智性决策",
        "prescription": "利用先进工具重塑工作流，消灭冗余，实现个人与团队产出的指数级跃升",
        "market_context": {
            "category": "SaaS工具/协同办公软件",
            "market_size": "国内协同办公市场规模超300亿",
            "cagr": "18.2%",
            "capital_index": "4"
        },
        "brands_data": [
            {"name": "Notion", "sov": "All-in-one笔记软件全球声量神话", "search": "Notion模板/知识库热搜", "premium": "高（按人头订阅的高昂SaaS费）", "prod": "Notion AI / 个人及团队订阅", "sales": "全球千万级用户", "gmv": "全球ARR数亿美元", "core": "Block模块化设计，万物皆可数据库，终极自由度", "topic": "#Notion模板", "views": "8亿次+", "sentiment": "96分（效率神器/排版极度舒适）"},
            {"name": "飞书 (Feishu)", "sov": "先进团队协同工具声量第一", "search": "企业协同/飞书多维表格热搜", "premium": "中高（企业级收费）", "prod": "飞书商业版/多维表格", "sales": "DAU超千万", "gmv": "订阅收入持续高增", "core": "极致的信息流转效率，“像水一样流动”的协作体验", "topic": "#飞书多维表格", "views": "6亿次+", "sentiment": "92分（先进生产力代表）"},
            {"name": "钉钉 (DingTalk)", "sov": "国民级办公软件声量最高", "search": "打卡/OA审批热搜霸榜", "premium": "中等（专业版收费）", "prod": "钉钉专业版/专属版", "sales": "月活用户超2亿", "gmv": "ARR高速增长", "core": "强大的组织管理与下沉渗透力，AI助理重塑办公", "topic": "#钉钉AI", "views": "15亿次+", "sentiment": "80分（老板最爱/管理利器）"},
            {"name": "剪映 (CapCut)", "sov": "视频剪辑工具全网声量断层第一", "search": "视频剪辑/特效模板搜索首选", "premium": "中等（VIP特效订阅）", "prod": "剪映VIP", "sales": "月活过亿", "gmv": "国内及海外(CapCut)订阅费巨额", "core": "极低门槛，AI一键成片，彻底平权视频制作", "topic": "#剪映教程", "views": "100亿次+", "sentiment": "95分（自媒体起号必备）"},
            {"name": "幕布 (Mubu)", "sov": "极简大纲笔记声量前列", "search": "大纲笔记/一键脑图热搜", "premium": "低", "prod": "幕布高级版", "sales": "累计用户数千万", "gmv": "千万级营收", "core": "以树形结构组织逻辑，一键生成思维导图，极简高效", "topic": "#幕布笔记", "views": "2亿次+", "sentiment": "90分（逻辑梳理神器）"},
            {"name": "印象笔记 (Evernote)", "sov": "老牌笔记软件，仍保持高声量", "search": "知识管理/剪藏热搜", "premium": "中等", "prod": "印象笔记高级账户", "sales": "注册用户超千万", "gmv": "上亿级营收", "core": "强大的网页剪藏与跨平台同步能力，第二大脑", "topic": "#个人知识库", "views": "5亿次+", "sentiment": "82分（老牌经典，稍显臃肿）"},
            {"name": "石墨文档 (Shimo)", "sov": "云端文档协作先行者", "search": "多人协作/在线文档热搜", "premium": "中等", "prod": "石墨文档企业版", "sales": "累计注册用户数千万", "gmv": "企业级收入破亿", "core": "毫秒级实时同步，极简中国风UI，打破传统Office壁垒", "topic": "#在线协作", "views": "3亿次+", "sentiment": "88分（轻量高效）"},
            {"name": "腾讯文档 (Tencent Docs)", "sov": "背靠微信QQ生态声量极大", "search": "在线收集表/Excel热搜", "premium": "低（基础功能免费）", "prod": "腾讯文档超级会员", "sales": "月活破亿", "gmv": "增值服务收入过亿", "core": "无缝接入微信/QQ，信息收集与分发效率极高", "topic": "#腾讯文档教程", "views": "6亿次+", "sentiment": "86分（社交传播效率极高）"},
            {"name": "蓝湖 (Lanhu)", "sov": "产品UI研发协作声量第一", "search": "切图/UI协作热搜", "premium": "中高（按席位收费）", "prod": "蓝湖协作平台", "sales": "覆盖超数万家互联网团队", "gmv": "ARR破亿", "core": "无缝连接设计与开发，自动生成代码切图，终结沟通内耗", "topic": "#蓝湖协作", "views": "1.5亿次+", "sentiment": "94分（互联网产研标配）"},
            {"name": "墨刀 (Modao)", "sov": "在线原型设计声量领跑", "search": "原型设计/交互设计热搜", "premium": "中等", "prod": "墨刀企业版", "sales": "超百万产品经理使用", "gmv": "千万级营收", "core": "拖拽即用的组件库，快速验证产品逻辑与交互", "topic": "#墨刀原型", "views": "1亿次+", "sentiment": "89分（极速原型神器）"},
            {"name": "阿里云盘 (Aliyun Drive)", "sov": "不限速网盘声量第一", "search": "不限速下载/网盘资源热搜", "premium": "中等（容量与特权付费）", "prod": "阿里云盘SVIP", "sales": "注册用户破亿", "gmv": "会员订阅收入数亿", "core": "打破龟速下载魔咒，极速上传下载，提升文件流转效率", "topic": "#阿里云盘资源", "views": "15亿次+", "sentiment": "85分（拯救龟速）"},
            {"name": "滴答清单 (TickTick)", "sov": "任务管理(GTD)领域声量极高", "search": "时间管理/番茄钟热搜", "premium": "低", "prod": "滴答清单高级会员", "sales": "全球数千万用户", "gmv": "数千万级营收", "core": "日历视图、番茄专注与多端同步完美结合，治愈拖延症", "topic": "#滴答清单", "views": "4亿次+", "sentiment": "96分（时间管理大师）"},
            {"name": "Xmind", "sov": "思维导图软件全球声量巨头", "search": "思维导图/头脑风暴热搜", "premium": "中等", "prod": "Xmind Pro", "sales": "全球数千万用户", "gmv": "数亿营收", "core": "极致美观的导图主题，极速记录灵感与结构化思考", "topic": "#Xmind思维导图", "views": "7亿次+", "sentiment": "95分（梳理利器）"},
            {"name": "语雀 (Yuque)", "sov": "体系化知识库声量前列", "search": "知识库/团队沉淀热搜", "premium": "中等", "prod": "语雀空间", "sales": "百万级活跃用户", "gmv": "千万级营收", "core": "像写书一样写文档，目录树结构极佳，知识沉淀利器", "topic": "#语雀文档", "views": "2.5亿次+", "sentiment": "92分（排版优雅/知识沉淀）"},
            {"name": "腾讯会议 (Tencent Meeting)", "sov": "云视频会议声量绝对第一", "search": "视频会议/线上开会热搜霸榜", "premium": "中等", "prod": "腾讯会议商业版/企业版", "sales": "注册用户超3亿", "gmv": "企业级服务及硬件收入高增", "core": "全端打通，极低延迟抗弱网，彻底重塑远程沟通效率", "topic": "#腾讯会议", "views": "20亿次+", "sentiment": "90分（打工人开会必备）"}
        ]
    },
    {
        "motivation": "舒适感",
        "section": "智性决策",
        "prescription": "拒绝消费主义洗脑，基于人体工学与材料科技，为身体与日常居家做最理性的投资",
        "market_context": {
            "category": "人体工学/睡眠科技/科技服饰",
            "market_size": "睡眠经济与舒适服饰规模突破5000亿",
            "cagr": "11.5%",
            "capital_index": "4"
        },
        "brands_data": [
            {"name": "蕉内 (Bananain)", "sov": "基本款服饰全网声量前三", "search": "无感标签/凉皮防晒热搜", "premium": "中等", "prod": "凉皮防晒服/无感内裤", "sales": "爆款月销过10万件", "gmv": "年营收数十亿", "core": "重新设计基本款，用体感科技（无标签、凉感）解决穿着痛点", "topic": "#蕉内凉皮", "views": "15亿次+", "sentiment": "88分（舒适无感）"},
            {"name": "内外 (NEIWAI)", "sov": "女性贴身衣物声量第一梯队", "search": "无钢圈内衣/舒适家居服热搜", "premium": "中高", "prod": "云朵无钢圈内衣", "sales": "月销数万件", "gmv": "年营收超十亿", "core": "解放身体束缚，主打真实的舒适与悦己体验", "topic": "#内外内衣", "views": "8亿次+", "sentiment": "92分（柔软悦己）"},
            {"name": "翼眠 (Yimian)", "sov": "深睡枕头品类声量爆发", "search": "TPE网格枕/深睡枕热搜", "premium": "中高", "prod": "翼眠无压网格枕", "sales": "月销过万件", "gmv": "年营收破亿", "core": "航天级TPE材质，动态贴合释压，用科技解决失眠", "topic": "#翼眠深睡枕", "views": "4亿次+", "sentiment": "85分（拯救颈椎）"},
            {"name": "菠萝斑马 (Pineapple Zebra)", "sov": "健康睡眠与护脊赛道声量前列", "search": "护脊床垫/软管枕热搜", "premium": "中等", "prod": "空气纤维颈托枕", "sales": "月销万件级", "gmv": "年营收数亿元", "core": "仿生材料与分区护脊设计，带来理性的睡眠支撑", "topic": "#菠萝斑马", "views": "3亿次+", "sentiment": "89分（护颈好物）"},
            {"name": "蓝盒子 (Bluebox)", "sov": "盒装床垫品类声量第一", "search": "100天试睡/记忆棉床垫热搜", "premium": "中等", "prod": "Z1 记忆棉弹簧床垫", "sales": "月销过万张", "gmv": "年营收超5亿", "core": "三段式微孔支撑，提供100天免费试睡，彻底打破试错成本", "topic": "#蓝盒子床垫", "views": "6亿次+", "sentiment": "94分（服务极致/包裹感）"},
            {"name": "西昊 (Sihoo)", "sov": "人体工学椅声量TOP1", "search": "办公椅/护腰椅搜索霸榜", "premium": "中等", "prod": "西昊C300 / Doro S300", "sales": "月销数万把", "gmv": "年营收破15亿", "core": "多维度悬浮支撑与底盘科技，性价比最高的人体工学投资", "topic": "#西昊人体工学椅", "views": "10亿次+", "sentiment": "88分（久坐救星）"},
            {"name": "保友 (Ergonor)", "sov": "高端人体工学椅声量第一", "search": "金豪b/网布工学椅热搜", "premium": "高", "prod": "金豪b 2代", "sales": "月销万把级", "gmv": "年营收近10亿", "core": "顶尖进口网布与联动底盘，一步到位的高端腰背舒适", "topic": "#保友金豪b", "views": "5亿次+", "sentiment": "95分（一步到位）"},
            {"name": "亚朵星球 (Atour Planet)", "sov": "酒店同款床品声量断层第一", "search": "深睡记忆枕/亚朵同款热搜", "premium": "中等", "prod": "深睡记忆枕Pro", "sales": "累计爆卖数百万只", "gmv": "单品年营收数亿", "core": "将酒店级优质睡眠体验复刻至家庭，高慢回弹释压", "topic": "#亚朵深睡枕", "views": "12亿次+", "sentiment": "90分（沾枕即睡）"},
            {"name": "斯凯奇 (Skechers)", "sov": "舒适健步鞋声量绝对霸主", "search": "一脚蹬/老人鞋热搜", "premium": "中等", "prod": "Slip-ins 闪穿鞋 / 健步鞋", "sales": "月销数十万双", "gmv": "中国区营收过百亿", "core": "极致软底与Slip-ins免弯腰穿脱科技，提供无需磨合的舒适", "topic": "#斯凯奇一脚蹬", "views": "20亿次+", "sentiment": "94分（踩屎感/孝心神鞋）"},
            {"name": "匹克 (Peak)", "sov": "国产运动缓震科技声量前列", "search": "态极拖鞋/自适应缓震热搜", "premium": "低", "prod": "态极系列拖鞋/跑鞋", "sales": "累计爆卖上千万双", "gmv": "态极系列年营收数十亿", "core": "P4U智能高分子材料，慢走软弹，快跑支撑，物理级舒适", "topic": "#匹克态极", "views": "8亿次+", "sentiment": "92分（国货黑科技）"},
            {"name": "优衣库 (Uniqlo)", "sov": "科技面料基础款声量无敌", "search": "HEATTECH/AIRism热搜霸榜", "premium": "低", "prod": "AIRism凉感内衣 / 摇粒绒", "sales": "爆款单品月销百万件", "gmv": "中国区营收数百亿", "core": "以材料科技（吸湿发热、透气凉感）重新定义四季穿着舒适", "topic": "#优衣库穿搭", "views": "50亿次+", "sentiment": "90分（衣柜基石）"},
            {"name": "全棉时代 (Purcotton)", "sov": "纯棉生活用品声量TOP1", "search": "纯棉柔巾/婴儿棉品热搜", "premium": "中高（相比化纤材质）", "prod": "100%全棉柔巾", "sales": "月销过百万包", "gmv": "年营收近40亿", "core": "全棉水刺无纺布技术，带来最天然、安全的亲肤舒适", "topic": "#全棉时代", "views": "7亿次+", "sentiment": "96分（母婴级安心）"},
            {"name": "躺岛 (Tangdao)", "sov": "睡眠环境氛围营造声量前列", "search": "猫肚皮枕/助眠眼罩热搜", "premium": "中等", "prod": "猫肚皮枕", "sales": "月销数千件", "gmv": "年营收数千万", "core": "极度柔软的触感，结合情绪价值，提供治愈级睡眠体验", "topic": "#躺岛猫肚皮枕", "views": "2.5亿次+", "sentiment": "92分（rua猫手感）"},
            {"name": "绘睡 (HuiShui)", "sov": "科技助眠品牌后起之秀", "search": "温控被/智能助眠热搜", "premium": "中高", "prod": "PCM相变控温被", "sales": "月销数千件", "gmv": "营收千万级", "core": "运用宇航服PCM控温材料，动态调节被窝微气候", "topic": "#绘睡控温被", "views": "1.5亿次+", "sentiment": "88分（黑科技控温）"},
            {"name": "添可 (Tineco)", "sov": "智能洗地机声量绝对霸主", "search": "洗地机/家务神器热搜", "premium": "高", "prod": "芙万系列洗地机", "sales": "月销数万台", "gmv": "年营收大几十亿", "core": "活水清洁与恒压绞干技术，彻底解放双手，带来家务减负的终极舒适", "topic": "#添可洗地机", "views": "25亿次+", "sentiment": "90分（提升幸福感神器）"}
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
output_file = "rational_decision_rag.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(rag_json_output, f, ensure_ascii=False, indent=2)

print(f"Data generation complete! Saved to {output_file}")
