
export const getUserAvatar = (user) => {
    if (!user) return '';

    // Check if avatar is valid and not the broken pravatar link
    const isPravatar = user.avatar && user.avatar.includes('pravatar.cc');
    const isValid = user.avatar && !isPravatar && !user.avatar.includes('ui-avatars.com');

    if (isValid) {
        return user.avatar;
    }

    // Generate local SVG avatar (Robust & Offline-friendly)
    const name = user.name || 'User';
    const initials = name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="background-color: #800020; border-radius: 50%;">
        <text x="50%" y="50%" dy=".35em" fill="#ffffff" font-size="40" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
            ${initials}
        </text>
    </svg>
    `.trim();

    return `data:image/svg+xml;base64,${btoa(svg)}`;
};







