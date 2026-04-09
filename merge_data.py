import json
import re

# 待合并的三个文件
files = [
    "rational_decision_rag.json", 
    "emotional_offset_rag.json", 
    "identity_narrative_rag.json"
]

merged_data = []
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        merged_data.extend(json.load(file))

# 规范化品牌名称，用于精确匹配查重
def normalize_name(name):
    name = name.lower()
    # 移除括号内的英文或备注
    name = re.sub(r'\(.*?\)|（.*?）', '', name)
    # 取斜杠前的第一个名称
    name = name.split('/')[0]
    name = name.replace('bananain', '')
    return name.strip()

seen_brands = {}  # norm_name -> (brand_dict, parent_motivation)
final_data = []
merge_logs = []

for section in merged_data:
    new_section = {
        "motivation": section["motivation"],
        "section": section["section"],
        "prescription": section["prescription"],
        "market_context": section["market_context"],
        "brands": []
    }
    
    for brand in section["brands"]:
        raw_name = brand["brand_name"]
        norm_name = normalize_name(raw_name)
        
        # 仅使用精确匹配，防止错误合并（例如 On 匹配到 Notion，A-Soul 匹配到 Soul）
        matched_key = None
        if norm_name in seen_brands:
            matched_key = norm_name
        
        if matched_key:
            existing_brand, orig_mot = seen_brands[matched_key]
            merge_logs.append(f"合并重复品牌: '{raw_name}' ({section['motivation']}) -> 归入 -> '{existing_brand['brand_name']}' ({orig_mot})")
            
            # 合并产品信息（去重）
            existing_product_names = [normalize_name(p["product_name"]) for p in existing_brand["products"]]
            for p in brand["products"]:
                p_norm = normalize_name(p["product_name"])
                if p_norm not in existing_product_names and p_norm:
                    existing_brand["products"].append(p)
                    existing_product_names.append(p_norm)
            
            # 合并话题信息（去重）
            existing_topic_names = [normalize_name(t["topic_name"]) for t in existing_brand["topics"]]
            for t in brand["topics"]:
                t_norm = normalize_name(t["topic_name"])
                if t_norm not in existing_topic_names and t_norm:
                    existing_brand["topics"].append(t)
                    existing_topic_names.append(t_norm)
            
            # 记录该品牌横跨的多个二级标题（板块/心理动机）
            if "cross_motivations" not in existing_brand:
                existing_brand["cross_motivations"] = [orig_mot]
            if section["motivation"] not in existing_brand["cross_motivations"]:
                existing_brand["cross_motivations"].append(section["motivation"])
                
            # 由于已合并，不再在当前 motivation 下重复添加该品牌（保留在首次出现的 motivation 下）
        else:
            # 这是一个新品牌
            brand["cross_motivations"] = [section["motivation"]]
            seen_brands[norm_name] = (brand, section["motivation"])
            new_section["brands"].append(brand)
            
    final_data.append(new_section)

# 保存最终合并后的 JSON
output_file = "merged_consumer_data_rag.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"Merge complete! Generated {output_file} with {len(final_data)} motivation sections.")
print(f"Total unique brands after deduplication: {len(seen_brands)}")
print("\nMerge Details:")
for log in merge_logs:
    print(" - " + log)