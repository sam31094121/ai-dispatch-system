const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'shared', 'official-locks.js');
let content = fs.readFileSync(targetPath, 'utf8');

// Ensure the repair function also correctly maps the score
// We'll update the repairOfficial0423Snapshot function to ensure weightedScore is explicitly assigned
if (content.includes('repairOfficial0423Snapshot')) {
    content = content.replace(
        'previousRank: item.rank,',
        'previousRank: item.rank, 正式權重分數: item.totalScore || 0,'
    );
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('Successfully patched repairOfficial0423Snapshot in official-locks.js');
}

// Also verify if the toLegacyStandardData mapping is correct in dispatchBuild.service.js
// Actually, it already maps row.metrics.正式權重分數.
// Let's ensure the ranking objects have normalized structure.
