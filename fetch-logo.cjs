const https = require('https');
https.get('https://raw.githubusercontent.com/66ji-max/lqnyv1/main/components/FullLogo.tsx', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
});
