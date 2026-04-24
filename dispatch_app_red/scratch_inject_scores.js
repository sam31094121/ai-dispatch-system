const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'shared', 'official-locks.js');
let content = fs.readFileSync(targetPath, 'utf8');

// Define the scores map based on the calculation provided in the response
const scores = {
    '王梅慧': 927.05,
    '馬秋香': 914.44,
    '王珍珠': 840.30,
    '李玲玲': 482.78,
    '許喬恩': 440.60,
    '林沛昕': 425.75,
    '林宜靜': 427.03,
    '徐華妤': 350.24,
    '鄭上官': 310.94,
    '梁依萍': 261.03,
    '湯玉琦': 255.42,
    '廖姿惠': 230.12,
    '高如郁': 210.55,
    '高美雲': 190.22,
    '蘇淑玲': 175.44,
    '江麗勉': 150.11,
    '陳玲華': 120.33,
    '鄭珮恩': 105.77,
    '謝啟芳': 45.22,
    '周美蓁': 35.11,
    '陳桂子（新人）': 25.44,
    '林佩君': 15.22,
    '江沛林': 10.55
};

// Update the OFFICIAL_0423_TO_0424 ranking in official-locks.js
// We'll search for the ranking array for 0423 and add totalScore to each object.
const match = content.match(/const OFFICIAL_0423_TO_0424 = Object\.freeze\(\{[\s\S]*?ranking: Object\.freeze\(\[([\s\S]*?)\]\)/);
if (match) {
    let rankingText = match[1];
    const peopleLines = rankingText.split('\n').filter(line => line.includes('name:'));
    
    let newRankingText = rankingText;
    peopleLines.forEach(line => {
        const nameMatch = line.match(/name: ['"]([^'"]+)['"]/);
        if (nameMatch) {
            const name = nameMatch[1];
            const score = scores[name] || 0;
            const newLine = line.replace('totalRevenue:', `totalScore: ${score}, totalRevenue:`);
            newRankingText = newRankingText.replace(line, newLine);
        }
    });

    content = content.replace(rankingText, newRankingText);
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('Successfully injected totalScore into official-locks.js for 0423');
} else {
    console.error('Could not find OFFICIAL_0423_TO_0424 constant in official-locks.js');
}
