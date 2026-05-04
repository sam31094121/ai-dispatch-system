const fs = require('fs');
const path = require('path');

const dataDir = path.resolve('c:/Users/DRAGON/Desktop/兆櫃系統/dispatch_app_red/data');
const reportsDir = path.join(dataDir, 'dispatch-reports-v1', 'reports');

function purge() {
  if (fs.existsSync(reportsDir)) {
    const dirs = fs.readdirSync(reportsDir);
    dirs.forEach(dir => {
      if (dir !== 'dispatch_2026_05_03_v1') {
        const fullPath = path.join(reportsDir, dir);
        console.log('Deleting old report:', fullPath);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    });
  }

  // Delete old files in data root
  const dataFiles = fs.readdirSync(dataDir);
  dataFiles.forEach(file => {
    if (file.includes('0427') || file.includes('0428') || file.includes('2026_04')) {
      const fullPath = path.join(dataDir, file);
      console.log('Deleting old data file:', fullPath);
      fs.rmSync(fullPath, { force: true });
    }
  });
}

purge();
console.log('Purge successful');
