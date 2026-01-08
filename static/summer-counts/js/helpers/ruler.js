import { mmToPixels } from './measure.js';
import { getPalette } from '../paletteCollection.js';

export function createRuler(centerX, centerY, rectWidth, rectHeight, scale, config) {
    const palette = getPalette(config.palette_id);
    const textColor = palette.text_color;
    const totalHeightMm = config.fabric_height;
    const printableHeightMm = config.fabric_printable_height;
    const nonPrintableMarginMm = (totalHeightMm - printableHeightMm) / 2;

    const marginPx = mmToPixels(nonPrintableMarginMm) * scale;
    const rulerY = centerY + rectHeight / 2 - marginPx - 2;
    const rulerStartX = centerX - rectWidth / 2;
    const rulerEndX = centerX + rectWidth / 2;
    const rulerLength = rulerEndX - rulerStartX;

    const font = config.font;
    const expectedLife = config.expected_life || 100;
    const step = Math.max(10, Math.floor(expectedLife / 10));

    for (let i = 0; i <= expectedLife; i += step) {
        const tickX = rulerStartX + (i / expectedLife) * rulerLength;

        const tickMark = new paper.Path.Line(
            new paper.Point(tickX, rulerY - 3),
            new paper.Point(tickX, rulerY + 2)
        );
        tickMark.strokeColor = textColor;
        tickMark.strokeWidth = 1 * scale;

        const label = new paper.PointText({
            point: [tickX + 3, rulerY],
            content: i.toString(),
            justification: 'left',
            fontSize: 7 * scale,
            fillColor: textColor,
            fontFamily: font
        });
    }
}


