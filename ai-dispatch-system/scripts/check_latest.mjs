const res = await fetch('http://localhost:3001/api/v1/latest');
const j = await res.json();
const ann = j.data.announcement;
console.log('announcement keys:', Object.keys(ann));
console.log('fullText len:', ann.fullText?.length ?? 0);
console.log('lineText len:', ann.lineText?.length ?? 0);
console.log('shortText len:', ann.shortText?.length ?? 0);
console.log('voiceText len:', ann.voiceText?.length ?? 0);
console.log('managerText len:', ann.managerText?.length ?? 0);
