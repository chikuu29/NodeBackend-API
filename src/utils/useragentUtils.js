



const parseUserAgent = (userAgentString) => {
    // Check if it's Microsoft Edge first
    const details = detectVersion(userAgentString)
    if (userAgentString.includes('Edg')) {
        return { browser: 'Edge', os: detectOS(userAgentString),  browserDetails: details };
    }
    const browser = userAgentString.match(/(firefox|msie|chrome|safari|trident)/i)?.[0] || 'Unknown';
    return { browser, os: detectOS(userAgentString), browserDetails: details};

}

const detectVersion = (userAgentString) => {
    let browser = "Unknown";
    let version = "Unknown";

    if (userAgentString.includes("Edg")) {
        browser = "Edge";
        const match = userAgentString.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
        if (match) {
            version = match[1]; // Extracts version number
        }
    } else if (userAgentString.includes("Chrome")) {
        browser = "Chrome";
        const match = userAgentString.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
        if (match) {
            version = match[1];
        }
    } else if (userAgentString.includes("Firefox")) {
        browser = "Firefox";
        const match = userAgentString.match(/Firefox\/(\d+\.\d+\.\d+)/);
        if (match) {
            version = match[1];
        }
    } else if (userAgentString.includes("Safari")) {
        browser = "Safari";
        const match = userAgentString.match(/Version\/(\d+\.\d+\.\d+)/);
        if (match) {
            version = match[1];
        }
    } else if (userAgentString.includes("MSIE") || userAgentString.includes("Trident")) {
        // Handle older Internet Explorer
        browser = "Internet Explorer";
        const match = userAgentString.match(/(MSIE\s|rv:)(\d+\.\d+)/);
        if (match) {
            version = match[2]; // Extracts version number
        }
    }

    return { browser, version }
}
// Function to detect operating system
const detectOS = (userAgentString) => {
    return userAgentString.match(/(windows|mac|linux|android|iphone|ipad)/i)?.[0] || 'Unknown';
};

module.exports = {
    parseUserAgent,
    detectOS
}