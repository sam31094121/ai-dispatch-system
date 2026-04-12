const http = require('http');
http.get('http://localhost:3000/api/baseline/latest', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed.payload.data.consistencyGuard, null, 2));
    } catch (e) {
      console.error(e.message);
    }
  });
});
