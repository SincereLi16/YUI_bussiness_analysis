import json
import os

# 定义【身份叙事】板块下的4个子模块（Lifestyle/户外叙事、圈层共振/亚文化、社交货币/身份标签、文化根脉/国潮觉醒）及各自的代表性品牌数据
data = [
    {
        "motivation": "Lifestyle 与 户外叙事",
        "section": "身份叙事",
        "prescription": "将专业户外装备日常化，用山系穿搭向外界宣告一种向往自然、健康且有品位的精英生活方式",
        "market_context": {
            "category": "户外运动/运动服饰/露营",
            "market_size": "泛户外生活方式市场规模突破3000亿",
            "cagr": "15.2%",
            "capital_index": "5"
        },
        "brands_data": [
            {"name": "萨洛蒙 (Salomon)", "sov": "山系穿搭(Gorpcore)绝对核心声量", "search": "Salomon XT-6/新中产三件套热搜", "premium": "高（溢价率极高，二级市场炒卖）", "prod": "XT-6 越野跑鞋", "sales": "热门配色一鞋难求", "gmv": "中国区营收高速破10亿", "core": "专业户外越野基因与机能风设计的完美融合，从大山走向城市CBD", "topic": "#新中产三件套", "views": "15亿次+", "sentiment": "92分（潮流标杆/难买）"},
            {"name": "始祖鸟 (Arc'teryx)", "sov": "高端户外冲锋衣声量天花板", "search": "始祖鸟硬壳/中年人三件套热搜", "premium": "极高（对标奢侈品）", "prod": "Alpha SV/Beta LT冲锋衣", "sales": "核心款常年断货需配货", "gmv": "中国区营收数十亿", "core": "极致的防水透气科技面料与“鸟标”，成功塑造为金融圈/互联网高管的统一制服", "topic": "#始祖鸟穿搭", "views": "30亿次+", "sentiment": "95分（身份象征/中年男人顶级浪漫）"},
            {"name": "迪卡侬 (Decathlon)", "sov": "大众户外运动声量基石", "search": "平替始祖鸟/穷鬼乐园热搜", "premium": "极低", "prod": "抓绒衣/平价冲锋衣", "sales": "月销数十万件", "gmv": "百亿级", "core": "户外圈的优衣库，提供门槛极低的“户外体验券”，也是高级老炮的低调选择", "topic": "#迪卡侬神仙单品", "views": "20亿次+", "sentiment": "88分（良心企业/真香）"},
            {"name": "Patagonia (巴塔哥尼亚)", "sov": "环保/硬核户外圈层声量极高", "search": "环保冲锋衣/巴塔哥尼亚热搜", "premium": "高", "prod": "Retro-X 抓绒衣/Torrentshell", "sales": "稳步增长", "gmv": "数亿级", "core": "“不要买这件夹克”的极致环保叙事，硅谷大佬最爱的“反消费主义”身份标签", "topic": "#Patagonia环保", "views": "5亿次+", "sentiment": "94分（老钱风/极致环保）"},
            {"name": "Snow Peak (雪诺必克)", "sov": "高端精致露营(Glamping)开创者", "search": "露营天幕/钛杯热搜", "premium": "高（露营界的爱马仕）", "prod": "钛金属杯/帐篷", "sales": "露营季爆发", "gmv": "过亿营收", "core": "将野外生存升华为极其考究的审美体验，买的不仅是装备更是“户外美学”品味", "topic": "#精致露营", "views": "8亿次+", "sentiment": "90分（颜值即正义/露营天花板）"},
            {"name": "Brompton (小布)", "sov": "高端折叠自行车声量第一", "search": "小布自行车/城市骑行热搜", "premium": "高（纯手工/极度保值）", "prod": "经典C Line/T Line折叠车", "sales": "配额制发售", "gmv": "数亿级", "core": "无与伦比的折叠结构与英伦血统，中产阶级最爱的“城市4+2”短途出行社交名片", "topic": "#城市骑行", "views": "10亿次+", "sentiment": "96分（最保值理财产品/格调）"},
            {"name": "HOKA ONE ONE", "sov": "厚底跑鞋/通勤跑鞋声量前列", "search": "HOKA克利夫顿/通勤鞋热搜", "premium": "中高", "prod": "Clifton 9/Bondi 8", "sales": "月销数万双", "gmv": "数十亿级", "core": "夸张的厚底提供极佳缓震，不仅是马拉松跑者挚爱，更成为城市通勤族的站立救星", "topic": "#通勤穿搭", "views": "12亿次+", "sentiment": "89分（踩屎感/显高）"},
            {"name": "牧高笛 (Mobi Garden)", "sov": "大众露营装备声量第一", "search": "露营推车/入门帐篷热搜", "premium": "中等", "prod": "冷山系列帐篷/营地车", "sales": "月销十万件级", "gmv": "年营收破十亿", "core": "极致性价比，让年轻人低成本开启“周末逃离城市”的生活方式初体验", "topic": "#新手露营装备", "views": "6亿次+", "sentiment": "85分（性价比之王/闭眼入）"},
            {"name": "索尼微单 (Sony Alpha)", "sov": "影像记录生活方式声量霸主", "search": "索尼A7C2/Vlog相机热搜", "premium": "高", "prod": "A7M4 / A7C2", "sales": "全画幅微单市占率第一", "gmv": "百亿级", "core": "顶级的对焦与画质，成为无数博主与摄影爱好者记录与分享“高质量生活”的必备工具", "topic": "#索尼微单", "views": "25亿次+", "sentiment": "92分（生产力/毒法师）"},
            {"name": "Stanley (史丹利)", "sov": "水杯界社交货币新贵", "search": "巨无霸吸管杯/户外水壶热搜", "premium": "中高", "prod": "Quencher 巨无霸吸管杯", "sales": "爆火出圈，代购狂热", "gmv": "单品营收数十亿", "core": "原本是硬核户外保温壶，成功转型为北美及国内女孩出街必备的“补水+时尚”配饰", "topic": "#Stanley水杯", "views": "15亿次+", "sentiment": "88分（多巴胺色彩/实用）"},
            {"name": "Burton (伯顿)", "sov": "单板滑雪服饰/文化图腾", "search": "单板滑雪/AK系列热搜", "premium": "高", "prod": "AK系列滑雪服", "sales": "雪季一衣难求", "gmv": "数亿级", "core": "单板滑雪运动的开创者与布道者，穿上AK即意味着进入硬核滑雪圈层", "topic": "#单板滑雪", "views": "8亿次+", "sentiment": "94分（雪圈顶流/信仰）"},
            {"name": "On (昂跑)", "sov": "中产跑步新贵声量爆发", "search": "昂跑Cloud/费德勒热搜", "premium": "高", "prod": "Cloudmonster / Cloudsurfer", "sales": "翻倍增长", "gmv": "数十亿营收", "core": "极具辨识度的镂空云模块鞋底设计，接棒始祖鸟成为“新中产三件套”跑鞋代表", "topic": "#新中产跑鞋", "views": "5亿次+", "sentiment": "90分（脚感奇特/精英感）"},
            {"name": "Lowe Alpine / 骆驼", "sov": "泛户外服饰声量大盘", "search": "骆驼冲锋衣/平价冲锋衣热搜", "premium": "低", "prod": "三合一冲锋衣", "sales": "双十一销量破百万件", "gmv": "数十亿级", "core": "打爆下沉市场，让冲锋衣彻底取代羽绒服成为大学男生和外卖小哥的“国民冬季制服”", "topic": "#男大学生穿搭", "views": "10亿次+", "sentiment": "80分（全员撞衫/防风保暖）"}
        ]
    },
    {
        "motivation": "圈层共振 与 小众DIY",
        "section": "身份叙事",
        "prescription": "通过黑话、极高的参与门槛或深度定制，筛选同类，形成强烈的“圈内人”归属感与排他性",
        "market_context": {
            "category": "潮玩/同人文化/客制化/小众爱好",
            "market_size": "Z世代圈层消费及泛二次元市场超2000亿",
            "cagr": "19.8%",
            "capital_index": "4"
        },
        "brands_data": [
            {"name": "谷子/痛包文化 (Goods)", "sov": "二次元圈层实体消费绝对核心", "search": "吃谷/吧唧/痛包热搜", "premium": "极高（二级市场“海景房”价格）", "prod": "徽章(吧唧)/立牌/色纸/痛包", "sales": "单次漫展/线下谷店扫货千万级", "gmv": "百亿级", "core": "购买带有IP角色的周边并密集展示（痛包），向外界高调宣示“我推”（最爱角色）的厨力与身份", "topic": "#吃谷日常", "views": "40亿次+", "sentiment": "90分（为爱发电/狂热）"},
            {"name": "万代 (Bandai) / 胶佬", "sov": "拼装模型(高达)圈层统治者", "search": "高达模型/拼装/喷涂热搜", "premium": "中等（部分PB限定溢价极高）", "prod": "MG/RG/PG系列高达模型", "sales": "年出货量千万盒级", "gmv": "数十亿营收", "core": "极高的动手门槛（剪钳、打磨、渗线、喷涂），拼装过程本身即是修心与圈层认证", "topic": "#胶佬的日常", "views": "25亿次+", "sentiment": "95分（男人的浪漫/耐心）"},
            {"name": "键圈 (客制化机械键盘)", "sov": "极客与桌搭圈层高门槛消费", "search": "客制化轴体/套件打字音热搜", "premium": "高", "prod": "铝坨坨套件/麻将音轴体/GMK键帽", "sales": "团购制，发货周期长达数月", "gmv": "十亿级市场", "core": "拒绝量产，从PCB、定位板到每一颗轴体的润滑都亲力亲为，追求极致手感与专属声音", "topic": "#客制化键盘", "views": "15亿次+", "sentiment": "88分（退烧/HIFI音）"},
            {"name": "汉服/JK/Lolita (三坑)", "sov": "亚文化服饰声量三巨头", "search": "马面裙/萌款JK热搜", "premium": "中高（绝版溢价）", "prod": "织造司马面裙/各种柄图JK", "sales": "爆款月销过万", "gmv": "百亿级市场", "core": "拥有严格的版型考究与圈内规矩（穿山甲、山正之争），穿上即代表认同该圈层的审美体系", "topic": "#三坑少女", "views": "50亿次+", "sentiment": "85分（文化自信/可爱）"},
            {"name": "Molly / DIMOO (改娃圈)", "sov": "潮玩高阶玩法", "search": "盲盒改娃/重涂热搜", "premium": "高（手作师傅加工费极高）", "prod": "泡泡玛特盲盒+树脂土/喷漆改造", "sales": "改娃接单排队至半年后", "gmv": "千万级灰产", "core": "不满足于量产盲盒，通过重塑面部、服饰打造全世界独一无二的专属娃，极致的小众DIY", "topic": "#盲盒改娃", "views": "8亿次+", "sentiment": "92分（神仙太太/独一无二）"},
            {"name": "大漆/非遗手作", "sov": "国风小众手工圈层爆发", "search": "漂漆扇/大漆珠串热搜", "premium": "高", "prod": "非遗大漆体验课/漂漆扇", "sales": "周末体验课爆满", "gmv": "过亿级", "core": "万物皆可大漆，不可预测的纹理产生强烈的孤品感，兼具东方美学与动手乐趣", "topic": "#非遗大漆", "views": "6亿次+", "sentiment": "96分（东方色彩/惊艳）"},
            {"name": "手帐圈 (Hobonichi / MT)", "sov": "纸笔书写圈层的终极仪式感", "search": "手帐排版/胶带拼贴热搜", "premium": "高（进口文具溢价）", "prod": "Hobo一日一页/特种纸胶带", "sales": "双十一/年底大促爆发", "gmv": "数十亿市场", "core": "将日常记录升华为繁复的排版艺术，手帐本是展现个人审美与生活态度的终极画布", "topic": "#手帐排版", "views": "12亿次+", "sentiment": "89分（治愈/热爱生活）"},
            {"name": "棉花娃娃", "sov": "粉圈与同人文化衍生巨头", "search": "买警/换骨架/娃衣热搜", "premium": "中高", "prod": "20cm无属性/有属性棉花娃娃", "sales": "众筹模式", "gmv": "十亿级", "core": "从饭圈衍生而出，通过为娃娃购买海量“娃衣”、梳理发型（rua娃），投射母爱与养成感", "topic": "#棉花娃娃", "views": "20亿次+", "sentiment": "86分（女鹅/可爱）"},
            {"name": "剧本杀/跑团", "sov": "线下沉浸式圈层社交", "search": "剧本杀情感本/硬核推理热搜", "premium": "中等", "prod": "线下剧本杀体验门票", "sales": "周末社交主流选择", "gmv": "百亿级", "core": "四个小时的极致角色扮演，在不同的剧本中体验他人的人生，形成极强的“同车”情感羁绊", "topic": "#剧本杀推荐", "views": "18亿次+", "sentiment": "90分（水龙头/烧脑）"},
            {"name": "B站 (Bilibili 鬼畜/玩梗)", "sov": "年轻人亚文化策源地", "search": "全明星鬼畜/二创热搜", "premium": "免费", "prod": "UP主二创视频", "sales": "弹幕量/投币量惊人", "gmv": "流量变现", "core": "只有懂这个梗（如“鸡汤来咯”、“退钱”），你才是自己人，弹幕是最高的社交货币", "topic": "#B站神级二创", "views": "100亿次+", "sentiment": "85分（离谱/造梗机器）"},
            {"name": "复古微单 (富士/理光)", "sov": "胶片模拟与复古摄影圈", "search": "富士直出/CCD滤镜热搜", "premium": "高（全线溢价一机难求）", "prod": "富士X100VI / 理光GR3", "sales": "溢价几千仍需抢购", "gmv": "数十亿营收", "core": "拒绝复杂的后期，利用自带胶片模拟滤镜直出，营造一种松弛、复古的老法师身份", "topic": "#富士胶片模拟", "views": "30亿次+", "sentiment": "94分（氛围感/理财产品）"},
            {"name": "骑行圈 (闪电/梅花)", "sov": "硬核公路车圈层", "search": "破风架/碳刀热搜", "premium": "极高", "prod": "Specialized(闪电) Tarmac", "sales": "万元起步上不封顶", "gmv": "数十亿", "core": "除了腿力，装备更是财力与审美的体现，穿锁鞋骑公路车是城市新中产的高级社交名片", "topic": "#公路车", "views": "15亿次+", "sentiment": "92分（拉爆/帅就完了）"}
        ]
    },
    {
        "motivation": "社交货币 与 优越感",
        "section": "身份叙事",
        "prescription": "消费作为一种社交媒介，用高辨识度或稀缺性的商品在朋友圈/小红书换取点赞，构建“我过得很好”的优越人设",
        "market_context": {
            "category": "奢侈品/高端餐饮/潮流单品",
            "market_size": "泛社交货币与轻奢消费超万亿",
            "cagr": "10.5%",
            "capital_index": "4"
        },
        "brands_data": [
            {"name": "茅台 (Moutai)", "sov": "中国社交货币的绝对天花板", "search": "飞天茅台/原箱热搜霸榜", "premium": "极高（一瓶难求）", "prod": "53度飞天茅台", "sales": "全年满负荷生产仍供不应求", "gmv": "年营收破1500亿", "core": "已经脱离了饮品属性，成为政商社交、求人办事、展示实力的终极硬通货与金融产品", "topic": "#飞天茅台抢购", "views": "50亿次+", "sentiment": "90分（硬通货/尊贵）"},
            {"name": "苹果 (Apple - iPhone/Mac)", "sov": "科技圈的底层社交货币", "search": "iPhone 15 Pro/苹果生态热搜", "premium": "高", "prod": "iPhone / MacBook Pro", "sales": "大中华区出货量千万级", "gmv": "大中华区营收数千亿", "core": "无缝打通的生态与极简设计，星巴克气氛组与都市白领标配，代表了先进生产力与品位", "topic": "#苹果全家桶", "views": "100亿次+", "sentiment": "85分（流畅/闭环生态）"},
            {"name": "戴森 (Dyson)", "sov": "家电界的高级社交名片", "search": "戴森吹风机/吸尘器热搜", "premium": "高", "prod": "Supersonic 吹风机", "sales": "被平替冲击但高端盘稳固", "gmv": "百亿级", "core": "凭借工业设计与黑科技，将吹头发、搞卫生这种庸俗家务，升华为极具中产优越感的仪式", "topic": "#戴森黑科技", "views": "20亿次+", "sentiment": "88分（轻奢/贵是我的缺点）"},
            {"name": "LV / Chanel / Hermes", "sov": "奢侈品老钱风三巨头", "search": "香奈儿涨价/爱马仕配货热搜", "premium": "极高", "prod": "经典款包袋", "sales": "越涨价越买", "gmv": "中国区营收超千亿", "core": "最简单粗暴的财力证明，阶级跨越的视觉符号，女性朋友圈最高赞的源泉", "topic": "#人生第一个香奈儿", "views": "40亿次+", "sentiment": "82分（保值/炫耀）"},
            {"name": "Supreme", "sov": "街头潮流社交货币鼻祖", "search": "Supreme联名/Box Logo热搜", "premium": "高", "prod": "Box Logo 卫衣/板砖/万物", "sales": "发售即抢空", "gmv": "数十亿", "core": "万物皆可印红底白字Logo，代表叛逆、街头与“我很酷”的青年亚文化态度", "topic": "#Supreme穿搭", "views": "15亿次+", "sentiment": "80分（万物皆可联名/潮人标配）"},
            {"name": "lululemon (Align裤)", "sov": "运动圈的社交名片", "search": "Lululemon OOTD热搜", "premium": "高", "prod": "Align 瑜伽裤", "sales": "女性运动赛道统治级", "gmv": "百亿级", "core": "不仅仅是瑜伽裤，它是通往飞盘、普拉提、高端健身房等新中产社交圈的入场券", "topic": "#Lululemon女孩", "views": "25亿次+", "sentiment": "92分（自律/翘臀）"},
            {"name": "拉夫劳伦 (Ralph Lauren)", "sov": "老钱风/常春藤风声量核心", "search": "拉夫劳伦麻花毛衣/老钱风热搜", "premium": "高", "prod": "绞花针织衫/Polo衫", "sales": "复古回潮销量大涨", "gmv": "数十亿", "core": "不显山露水，用低调的小马标和高质感面料，营造出一种不用努力就很有钱的Old Money气质", "topic": "#老钱风穿搭", "views": "12亿次+", "sentiment": "90分（松弛感/高级）"},
            {"name": "黑珍珠/米其林餐厅", "sov": "高端餐饮打卡文化", "search": "上海黑珍珠/Fine Dining热搜", "premium": "高", "prod": "高端主厨定制套餐(Omakase)", "sales": "节日需提前一月预定", "gmv": "单店营收极高", "core": "吃什么不重要，环境出片、摆盘精致、主厨讲故事，这顿饭的终极意义在于发朋友圈定位", "topic": "#FineDining", "views": "8亿次+", "sentiment": "85分（仪式感/贵价打卡）"},
            {"name": "乐高 (LEGO)", "sov": "玩具界的硬通货", "search": "乐高保时捷/法拉利/街景热搜", "premium": "高", "prod": "机械组超跑/大型街景", "sales": "成人玩家贡献巨大", "gmv": "中国区营收破百亿", "core": "送给大人的昂贵积木，拼搭完成后的巨大成品摆在客厅，是绝佳的品味展示与破冰话题", "topic": "#乐高机械组", "views": "30亿次+", "sentiment": "95分（童心未泯/镇宅之宝）"},
            {"name": "理想汽车 (Li Auto)", "sov": "奶爸群体社交货币", "search": "理想L9/冰箱彩电大沙发热搜", "premium": "中高", "prod": "理想L系列SUV", "sales": "月销破5万辆", "gmv": "千亿营收规模", "core": "精准切中“顾家好男人”人设，买理想等于向亲戚朋友宣告：我事业有成且极度爱老婆孩子", "topic": "#理想L9", "views": "40亿次+", "sentiment": "88分（移动的家/奶爸神车）"},
            {"name": "SK-II / 海蓝之谜 (La Mer)", "sov": "贵妇护肤品社交名片", "search": "神仙水/海蓝之谜面霜热搜", "premium": "极高", "prod": "神仙水 / 奇迹面霜", "sales": "大促常年霸榜", "gmv": "百亿级", "core": "梳妆台上的C位，高昂的价格本身就是效用的一部分，提供一种“我值得最好”的心理暗示", "topic": "#贵妇护肤", "views": "20亿次+", "sentiment": "90分（抗老/金钱的味道）"}
        ]
    },
    {
        "motivation": "文化根脉 与 国潮觉醒",
        "section": "身份叙事",
        "prescription": "在逆全球化背景下，通过消费本土传统文化元素，寻找民族认同，重塑文化自信与东方审美",
        "market_context": {
            "category": "国潮服饰/非遗文创/中式茶饮",
            "market_size": "新国潮消费经济规模突破万亿",
            "cagr": "16.5%",
            "capital_index": "4"
        },
        "brands_data": [
            {"name": "马面裙 (织造司/十三余等)", "sov": "国风服饰破圈绝对顶流", "search": "马面裙日常穿搭/非遗热搜", "premium": "中等", "prod": "各类织金/妆花马面裙", "sales": "单品月销数十万条", "gmv": "百亿级赛道", "core": "从汉服圈彻底走向日常通勤，穿马面裙去卢浮宫/大英博物馆打卡，成为最硬核的文化输出与自信", "topic": "#马面裙日常穿搭", "views": "50亿次+", "sentiment": "96分（端庄大气/文化自信）"},
            {"name": "安踏 / 李宁 (国产品牌)", "sov": "运动国潮化先锋", "search": "李宁悟道/安踏KT系列热搜", "premium": "中等（高端线冲击溢价）", "prod": "中国李宁系列/安踏国旗款", "sales": "营收全面超越部分国际大牌", "gmv": "数百亿营收", "core": "新疆棉事件后全面承接民族情绪，用过硬的技术（䨻/氮科技）结合中国元素，重塑国产运动骄傲", "topic": "#支持国货", "views": "60亿次+", "sentiment": "90分（国货之光/崛起）"},
            {"name": "茶颜悦色 (CHALI)", "sov": "新中式茶饮先行者", "search": "茶颜悦色幽兰拿铁热搜", "premium": "中等", "prod": "幽兰拿铁/声声乌龙", "sales": "门店排队神话", "gmv": "数十亿", "core": "用折扇、名画、诗词包装奶茶，将东方古典美学彻底融入年轻人的日常高频消费", "topic": "#茶颜悦色", "views": "25亿次+", "sentiment": "92分（国风茶饮/长沙名片）"},
            {"name": "黑神话：悟空 (游科)", "sov": "中国首款3A大作，文化现象级", "search": "黑神话悟空通关/文化输出热搜", "premium": "中等（买断制标准定价）", "prod": "《黑神话：悟空》", "sales": "发售即破千万套", "gmv": "单月数十亿营收", "core": "用世界级的工业水准讲述最纯正的中国神话，承载了全村人（中国玩家）对文化输出的终极渴望", "topic": "#黑神话悟空", "views": "200亿次+", "sentiment": "98分（天命人/热血沸腾）"},
            {"name": "观夏 / 闻献", "sov": "东方香学高端叙事", "search": "东方植物香/观夏桂花热搜", "premium": "高", "prod": "昆仑煮雪/颐和金桂", "sales": "常年断货", "gmv": "数亿级", "core": "用中国人的集体嗅觉记忆（桂花、松柏）对抗西方沙龙香的统治，重塑东方嗅觉审美的高级感", "topic": "#东方香水", "views": "10亿次+", "sentiment": "94分（高级感/中式意境）"},
            {"name": "故宫文创 / 博物院周边", "sov": "官方文化大IP", "search": "故宫日历/文创雪糕热搜", "premium": "中等", "prod": "故宫口红/千里江山图周边", "sales": "节假日爆卖", "gmv": "十亿级", "core": "让高高在上的文物“活起来”、“萌起来”，将六百年的厚重历史转化为桌面的小确幸", "topic": "#故宫文创", "views": "15亿次+", "sentiment": "95分（国之重器/萌）"},
            {"name": "花西子 (Florasis)", "sov": "东方彩妆代名词", "search": "花西子同心锁口红/雕花热搜", "premium": "中等", "prod": "同心锁口红/百鸟朝凤彩妆盘", "sales": "曾霸榜彩妆TOP1", "gmv": "数十亿", "core": "将微雕工艺与苗族/傣族非遗元素融入彩妆，极尽东方雕花之美", "topic": "#东方彩妆", "views": "20亿次+", "sentiment": "85分（雕花绝美/争议后复苏）"},
            {"name": "白象 (Baixiang)", "sov": "国民良心企业叙事", "search": "白象汤好喝/良心国货热搜", "premium": "极低", "prod": "汤好喝老母鸡汤面", "sales": "野性消费大爆发", "gmv": "近百亿", "core": "拒绝外资收购、招收残疾人，通过道德高地与扎实的产品，引发网友的“野性消费”式报恩", "topic": "#白象方便面", "views": "30亿次+", "sentiment": "96分（国货之光/良心企业）"},
            {"name": "比亚迪 / 华为 (汽车)", "sov": "中国智造汽车工业崛起", "search": "比亚迪仰望/华为问界热搜", "premium": "高", "prod": "仰望U8 / 问界M9", "sales": "高端车型月销过万", "gmv": "数千亿级", "core": "打破BBA的技术封锁与品牌光环，开中国的高端车、用鸿蒙智驾成为最具底气的民族自豪感体现", "topic": "#中国智造", "views": "100亿次+", "sentiment": "94分（遥遥领先/争气）"},
            {"name": "十三余", "sov": "少女汉服龙头", "search": "小豆蔻儿/十三余汉服热搜", "premium": "中等", "prod": "王者荣耀/各种IP联名汉服", "sales": "爆款单品上万件", "gmv": "数亿级", "core": "将传统形制进行现代化、少女化改良，降低汉服穿着门槛，让国风成为日常穿搭选项", "topic": "#汉服日常化", "views": "12亿次+", "sentiment": "90分（仙气飘飘/少女心）"},
            {"name": "蜜雪冰城", "sov": "下沉市场的国民雪王", "search": "雪王主题曲/蜜雪冰城热搜", "premium": "极低", "prod": "柠檬水/冰淇淋", "sales": "一年卖出几十亿杯", "gmv": "破两百亿", "core": "“你不嫌我穷，我不嫌你土”，凭借无敌的性价比与洗脑主题曲，成为最具烟火气的国民图腾", "topic": "#雪王出街", "views": "50亿次+", "sentiment": "92分（国民饮料/街溜子）"}
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
output_file = "identity_narrative_rag.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(rag_json_output, f, ensure_ascii=False, indent=2)

print(f"Identity Narrative Data generation complete! Saved to {output_file}")
