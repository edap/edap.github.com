
export function exportAsSVG() {
    try {
        const svg = paper.project.exportSVG({ asString: true });

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'wristband-design.svg';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        console.log('SVG exported successfully');
    } catch (error) {
        console.error('Error exporting SVG:', error);
        alert('Error exporting SVG. Please try again.');
    }
}
