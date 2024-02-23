import { getDataUrl } from './dataUrls.js';

function makeSvg(width, height, svgContent) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>`+
        `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`+
        `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" version="1.1" xmlns="http://www.w3.org/2000/svg">`+
        `${svgContent}`+
        `</svg>`;
}

export function makeSvgIcons(svgs) {
    let icons = {};
    for (let [name,svg] of Object.entries(svgs)) {
        icons[name] = getDataUrl("image/svg+xml", 'entitiesStripSpaces', makeSvg(svg.width, svg.height, svg.svg));
    }
    return icons;
}