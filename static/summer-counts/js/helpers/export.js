// Export functionality for Paper.js projects

/**
 * Export Paper.js project as SVG
 */
export function exportAsSVG() {
    try {
        // Export the Paper.js project as SVG
        const svg = paper.project.exportSVG({ asString: true });
        
        // Create a blob with the SVG content
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'wristband-design.svg';
        
        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        URL.revokeObjectURL(url);
        
        console.log('SVG exported successfully');
    } catch (error) {
        console.error('Error exporting SVG:', error);
        alert('Error exporting SVG. Please try again.');
    }
}
