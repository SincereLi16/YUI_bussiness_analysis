const fs = require('fs');

const csvPath = 'd:\\桌面\\Youth Consumer\\brands_data.csv';
const newCsvPath = 'd:\\桌面\\Youth Consumer\\brands_data_deduped.csv'; // Write to a new file to avoid EBUSY

const lines = fs.readFileSync(csvPath, 'utf8').split('\n');
const header = lines[0];
const brandMap = new Map();
const duplicates = [];

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle potential commas inside quotes if any, simple split for now
    // Expected: 品牌名称,2025年度 GMV/营收 (亿),2025年度 CAGR (%),数据来源
    const parts = line.split(',');
    if (parts.length < 4) continue;
    
    let brandName = parts[0].trim();
    // Clean up trailing spaces or weird chars from brand names
    brandName = brandName.replace(/\s+/g, ' '); 
    
    // We will use the base name (before spaces or parens) as the strict unique key for deduplication
    // e.g. "霸王茶姬" and "霸王茶姬 (Chagee)" should be caught.
    const baseNameMatch = brandName.match(/^([^\s(（]+)/);
    const baseName = baseNameMatch ? baseNameMatch[1].toLowerCase() : brandName.toLowerCase();

    if (brandMap.has(baseName)) {
        duplicates.push(`Duplicate found: [${brandName}] conflicts with existing [${brandMap.get(baseName).name}]`);
        // We will keep the latest one (or the one with the higher GMV just as a safe heuristic, but overwriting is simpler)
        // Let's keep the one that appears LAST in the CSV (overwrites)
    }
    
    brandMap.set(baseName, {
        name: brandName,
        gmv: parts[1].trim(),
        cagr: parts[2].trim(),
        source: parts[3].trim()
    });
}

// Rewrite the deduplicated CSV back to the same file
let newCsvContent = header + '\n';
for (let [key, val] of brandMap.entries()) {
    newCsvContent += `${val.name},${val.gmv},${val.cagr},${val.source}\n`;
}

fs.writeFileSync(newCsvPath, newCsvContent, 'utf8');

console.log(`\n--- Deduplication Report ---`);
console.log(`Original lines processed: ${lines.length - 1}`);
console.log(`Unique brands kept: ${brandMap.size}`);
if (duplicates.length > 0) {
    console.log(`\nFound ${duplicates.length} duplicates (kept the last occurrence):`);
    duplicates.forEach(d => console.log(d));
} else {
    console.log(`No duplicates found!`);
}
