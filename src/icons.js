const icons = {
    logoShape: '<path d="M3.8,5C5.6,3.2,7,1.9,9.3,1.2c3.3-1,6.2,0.2,7.9,0.7c3,0.9,4.3,3,5.2,5.9c0.7,2.3,2,6,0.8,8.2c-1.1,2-4.2,4.1-6.1,5.4c-1.4,1-2.9,1.6-4.4,1.7c0,0-1.7,0.1-3.4-0.4c-5-1.6-10.5-9.3-8.4-14.2C1.3,7.3,2.1,6.5,3.8,5z"/>',
    chevronDown: '<polyline points="6 9 12 15 18 9"></polyline>'
};

export default icon => {
    return icons[icon]
        ? `<svg xmlns="http://www.w3.org/240/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-${icon}">${icons[icon]}</svg>`
        : '';
};
