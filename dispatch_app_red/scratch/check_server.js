const http = require('http');

async function checkPort(port) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/api/current`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`Port ${port} Response: Title="${json.data?.公告標題}", Version="${json.data?.reportId || 'N/A'}"`);
                    resolve(true);
                } catch (e) {
                    console.log(`Port ${port} Response is not JSON`);
                    resolve(false);
                }
            });
        });
        req.on('error', () => {
            console.log(`Port ${port} is not reachable`);
            resolve(false);
        });
        req.setTimeout(1000, () => {
            req.abort();
            console.log(`Port ${port} timeout`);
            resolve(false);
        });
    });
}

async function main() {
    await checkPort(3000);
    await checkPort(3001);
}

main();
