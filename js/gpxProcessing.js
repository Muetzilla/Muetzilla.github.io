function processFile() {
    const fileInput = document.getElementById('gpxFile');
    const file = fileInput.files[0];

    if (!file) {
        alert("Bitte wähle eine GPX-Datei aus.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        let gpxContent = event.target.result;

        // Entferne <hr>...</hr> sowie self-closing <hr /> Tags
        gpxContent = gpxContent.replace(/<hr[^>]*?>.*?<\/hr>/g, '');
        gpxContent = gpxContent.replace(/<hr[^>]*?\/>/g, '');

        const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.gpx$/, '') + '_bereinigt.gpx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    reader.readAsText(file);
}
