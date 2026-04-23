const fs = require('fs');
const https = require('https');

https.get('https://raw.githubusercontent.com/66ji-max/lqnyv1/main/assets/logo.png', (res) => {
    if (res.statusCode === 200) {
        const file = fs.createWriteStream('./assets/logo.png');
        res.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log('Downloaded logo.png in /assets!');
        });
    } else {
        console.log('Could not find logo.png, status:', res.statusCode);
    }
});
