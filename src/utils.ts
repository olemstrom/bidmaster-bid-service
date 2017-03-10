export const randomId = (length: number) => {
    const chars = 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789'.split('');
    const randomChar = () => chars[Math.floor((Math.random()*chars.length))];
    return Array(length).fill(0).map(randomChar).join('');
};
