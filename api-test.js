// Simple script to check what data exists
const https = require('https');
const http = require('http');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (res) => {
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

async function checkAPI() {
    try {
        console.log('Checking global setlists API...');
        const setlists = await makeRequest('http://localhost:3001/api/global-setlists');
        console.log('Global setlists:', setlists);
        console.log('Number of global setlists:', Array.isArray(setlists) ? setlists.length : 'Not an array');
    } catch (err) {
        console.error('Error checking API:', err.message);
    }
}

checkAPI();