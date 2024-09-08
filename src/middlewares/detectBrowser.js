// detectBrowser.js

function detectBrowser(req, res, next) {
    console.log("===CALLING DETECTING BROSWER===",req['headers']);
    
    const userAgent = req.headers['user-agent'];
    const accept = req.headers['accept'];
    const referer = req.headers['referer'];
    const origin = req.headers['origin'];

    if (userAgent && accept && (referer || origin)) {
        console.log('Request likely coming from a browser');
    } else {
        console.log('Request likely coming from a non-browser client');
    }

    // Proceed to the next middleware or route handler
    next();
}

module.exports = detectBrowser;
