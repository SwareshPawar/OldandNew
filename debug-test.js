const http = require('http');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function checkDebug() {
    try {
        console.log('Checking debug endpoint...');
        const data = await makeRequest('http://localhost:3001/api/debug/setlists');
        console.log('Debug response:');
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkDebug();