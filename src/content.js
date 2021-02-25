
const getCookieKeys = () => document.cookie.split('; ').map(cookie => cookie.split('=')[0]);

/**
 * 
 * @param {number} aByteLength 
 * @returns {string}
 */
const getRandomHex = (aByteLength) => {
    const byteLength = aByteLength & (-1 >>> 1);
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return Array.prototype.map.call(bytes, byte => (0x100 | byte).toString(0x10).slice(-2)).join('');
};

const getRandomCookieKey = () => `_menhera_${getRandomHex(16)}`;

const isDomainName = (hostname) => !String(hostname).match(/^[0-9]+(\.[0-9]+)*$/) && !String(hostname).startsWith('[');

const reportRegistrableDomain = (domain) => void browser.runtime.sendMessage({command: 'registrable_domain', domain: String(domain)});

if (isDomainName(location.hostname)) {
    const domainLabels = location.hostname.split('.');
    if (domainLabels.length > 1) {
        for (let i = 2; i <= domainLabels.length; i++) {
            const domain = domainLabels.slice(- i).join('.');
            const key = getRandomCookieKey();
            document.cookie = `${key}=1;domain=${domain}`;
            const keys = getCookieKeys();
            if (keys.includes(key)) {
                document.cookie = `${key}=;domain=${domain};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                reportRegistrableDomain(domain);
                break;
            }
        }
    }
}

