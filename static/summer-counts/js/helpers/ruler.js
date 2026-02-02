import { mmToPixels } from './measure.js';
import { getPalette } from '../paletteCollection.js';

export const RULER_FONT_SIZE = 7;
const SCALE_WHEN_4_CHILDREN = 0.7;

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
    const expectedLife = config.expected_life;
    const step = Math.max(10, Math.floor(expectedLife / 10));
    
    // Check if there are 4 children and reduce font size by 40%
    const numberOfChildren = Object.keys(config.family || {}).length;
    const fontSize = numberOfChildren === 4 ? RULER_FONT_SIZE * SCALE_WHEN_4_CHILDREN * scale : RULER_FONT_SIZE * scale;
    
    const strokeWidth = 1 * scale;
    const strokeOffset = strokeWidth / 2;

    for (let i = 0; i <= expectedLife; i += step) {
        let tickX = rulerStartX + (i / expectedLife) * rulerLength;
        
        if (i === 0) {
            tickX += strokeOffset;
        }
        else if (i === expectedLife) {
            tickX -= strokeOffset;
        }

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
            fontSize: fontSize,
            fillColor: textColor,
            fontFamily: font
        });
    }
}


