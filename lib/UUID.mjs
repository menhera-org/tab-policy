
export const UUID = () => {
    const bytes = new Uint8Array(0x10);
    crypto.getRandomValues(bytes);
    bytes[6] = bytes[6] & 0x0f ^ 0x40;
    bytes[8] = bytes[8] & 0x3f ^ 0x80;
    const hex = Array.prototype.map.call(
        bytes,
        byte => ('0' + byte.toString(0x10)).slice(-2)
    ).join('');
    return [
        hex.substr(0, 8),
        hex.substr(8, 4),
        hex.substr(12, 4),
        hex.substr(16, 4),
        hex.substr(20, 12),
    ].join('-');
};
