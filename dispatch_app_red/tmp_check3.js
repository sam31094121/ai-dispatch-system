const http = require('http');
const fs = require('fs');
http.get('http://localhost:3000/api/baseline/latest', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
     fs.writeFileSync('tmp_res.json', data);
  });
});
