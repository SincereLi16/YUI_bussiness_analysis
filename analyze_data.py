import json
import re
from collections import defaultdict
from itertools import combinations
import statistics

def extract_premium_rates(text):
    if not text:
        return []
    matches = re.findall(r'(-?\d+(?:\.\d+)?)%', text)
    return [float(m) for m in matches]

def parse_number(text):
    if not text:
        return 0
    total = 0
    matches = re.finditer(r'(\d+(?:\.\d+)?)\s*([亿万wW千万]?)', text)
    for m in matches:
        num_str = m.group(1)
        unit = m.group(2)
        val = float(num_str)
        if unit == '亿':
            val *= 100000000
        elif unit in ('万', 'w', 'W'):
            val *= 10000
        elif unit == '千万':
            val *= 10000000
        elif unit == '千':
            val *= 1000
        total += val
    if total == 0:
        if '数十亿' in text:
            total += 2000000000
        elif '数亿' in text:
            total += 200000000
        elif '百万' in text:
            total += 1000000
    return total

def analyze_data():
    with open('merged_consumer_data_rag.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    total_brands_scanned = 0
    motivation_counts = defaultdict(int)
    
    # Store brand stats per motivation
    # key: motivation, value: list of dicts with brand info
    motivation_brands = defaultdict(list)
    
    # Store topic stats per motivation
    # key: motivation, value: list of dicts with topic info
    motivation_topics = defaultdict(list)

    # Store cross logic pairs
    cross_motivation_pairs = defaultdict(int)
    # Store brands that bridge the pairs
    cross_motivation_brands = defaultdict(list)

    # Variables for C. Social Equity Efficiency
    motivation_sov = defaultdict(float)
    motivation_gmv = defaultdict(float)
    
    # Variables for mapping motivation to section
    motivation_sections = {}

    for item in data:
        section_name = item.get('section', '未知')
        section_motivation = item.get('motivation', '未知')
        
        if section_motivation and section_motivation != '未知':
            motivation_sections[section_motivation] = section_name
            
        brands = item.get('brands', [])
        for brand in brands:
            total_brands_scanned += 1
            
            brand_name = brand.get('brand_name', 'Unknown')
            
            brand_motives = set(brand.get('cross_motivations', []))
            if section_motivation and section_motivation != '未知':
                brand_motives.add(section_motivation)
                
            for m in brand_motives:
                if m not in motivation_sections:
                    motivation_sections[m] = section_name
                motivation_counts[m] += 1
            
            if len(brand_motives) > 1:
                pairs = combinations(sorted(brand_motives), 2)
                for p in pairs:
                    cross_motivation_pairs[p] += 1
                    cross_motivation_brands[p].append(brand_name)
            
            # Premium
            prem_text = brand.get('premium_rate', '')
            rates = extract_premium_rates(prem_text)
            avg_rate = sum(rates) / len(rates) if rates else 0
            
            # SOV and GMV
            sov_text = brand.get('brand_sov', '')
            brand_total_sov = parse_number(sov_text)
            
            topics = brand.get('topics', [])
            for t in topics:
                topic_views = parse_number(t.get('views', ''))
                brand_total_sov += topic_views
                for m in brand_motives:
                    motivation_topics[m].append({
                        "topic_name": t.get('topic_name', ''),
                        "views": topic_views
                    })
            
            brand_total_gmv = 0
            products = brand.get('products', [])
            core_product = "N/A"
            if products:
                core_product = products[0].get('product_name', 'N/A')
            
            for prod in products:
                brand_total_gmv += parse_number(prod.get('gmv', ''))
            
            for m in brand_motives:
                motivation_sov[m] += brand_total_sov
                motivation_gmv[m] += brand_total_gmv
                
                motivation_brands[m].append({
                    "brand": brand_name,
                    "product": core_product,
                    "avg_rate": avg_rate,
                    "gmv": brand_total_gmv,
                    "sov": brand_total_sov,
                    "has_rates": bool(rates),
                    "data_source": section_name # Used as data_source as per requirement
                })

    # Format motivation density
    motivation_density = []
    for m, count in sorted(motivation_counts.items(), key=lambda x: x[1], reverse=True):
        pct = (count / total_brands_scanned) * 100
        
        # Get top 3 brands by GMV (fallback to SOV if GMV is 0)
        brands_in_m = motivation_brands[m]
        # Sort by GMV descending, then SOV descending
        sorted_brands = sorted(brands_in_m, key=lambda x: (x["gmv"], x["sov"]), reverse=True)
        top_3 = sorted_brands[:3]
        
        top_reps = []
        for b in top_3:
            if b['gmv'] > 0:
                value = round(b['gmv'] / 100000000, 1)
                metric = "GMV(亿)"
            else:
                value = round(b['sov'] / 10000, 1)
                metric = "声量(万)"
                
            top_reps.append({
                "brand": b["brand"],
                "product": b["product"],
                "value": value,
                "metric": metric,
                "data_source": b["data_source"]
            })

        motivation_density.append({
            "key": m,
            "section": motivation_sections.get(m, "未知"),
            "brand_count": count,
            "percentage": f"{pct:.1f}%",
            "top_representatives": top_reps
        })

    # Format premium benchmarking
    premium_benchmarking = []
    for m, brands in motivation_brands.items():
        valid_brands = [b for b in brands if b["has_rates"]]
        if not valid_brands: continue
        
        avg_rate_all = sum(b["avg_rate"] for b in valid_brands) / len(valid_brands)
        sign = "+" if avg_rate_all > 0 else ""
        
        # Premium leader
        leader = max(valid_brands, key=lambda x: x["avg_rate"])
        # Value disruptor
        disruptor = min(valid_brands, key=lambda x: x["avg_rate"])
        
        premium_benchmarking.append({
            "motivation": m,
            "section": motivation_sections.get(m, "未知"),
            "avg_premium_rate": f"{sign}{avg_rate_all:.1f}%",
            "anchors": {
                "premium_leader": leader["brand"],
                "value_disruptor": disruptor["brand"]
            }
        })
    premium_benchmarking.sort(key=lambda x: float(x["avg_premium_rate"].strip('%+')), reverse=True)

    # Format social efficiency
    social_efficiency = []
    for m in motivation_sov.keys():
        sov = motivation_sov[m]
        gmv = motivation_gmv[m]
        if gmv > 0:
            efficiency_score = sov / gmv
        else:
            efficiency_score = 0
            
        # Top 2 topics
        topics = motivation_topics[m]
        # Sort topics by views descending, and remove duplicates
        unique_topics = {}
        for t in topics:
            t_name = t["topic_name"]
            if t_name not in unique_topics or t["views"] > unique_topics[t_name]:
                unique_topics[t_name] = t["views"]
        
        sorted_topics = sorted(unique_topics.items(), key=lambda x: x[1], reverse=True)
        hot_topics = [t[0] for t in sorted_topics[:2]]
        
        social_efficiency.append({
            "motivation": m,
            "section": motivation_sections.get(m, "未知"),
            "efficiency_score": round(efficiency_score, 2),
            "hot_topics": hot_topics
        })
    social_efficiency.sort(key=lambda x: x["efficiency_score"], reverse=True)

    # Format cross logic matrix
    sorted_pairs = sorted(cross_motivation_pairs.items(), key=lambda x: x[1], reverse=True)
    cross_logic_matrix = []
    for i, (pair, count) in enumerate(sorted_pairs[:5]):
        strength = "极强" if i == 0 else "强" if i < 3 else "中"
        
        # Get 1-2 representative brands
        brands_for_pair = list(set(cross_motivation_brands[pair]))
        bridge_brands = brands_for_pair[:2]
        
        cross_logic_matrix.append({
            "logic_pair": list(pair),
            "correlation": strength,
            "bridge_brands": bridge_brands
        })

    output = {
        "summary_metadata": {
            "total_brands_scanned": total_brands_scanned,
            "analysis_date": "2026-04-09",
            "version": "V5.2",
            "data_reliability": "基于原始 JSON 字段提取, V5.2 前端对齐版"
        },
        "motivation_density": motivation_density,
        "premium_benchmarking": premium_benchmarking,
        "social_efficiency": social_efficiency,
        "cross_logic_matrix": cross_logic_matrix
    }

    with open('analysis_summary.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    analyze_data()
