let originalGpxText = '';
let xmlDoc = null;
let map = null;
let polyline = null;
let trackLayers = [];
let reversed = false;

function initMap() {
    map = L.map('map').setView([51.1657, 10.4515], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

function resetMap() {
    trackLayers.forEach(layer => map.removeLayer(layer));
    trackLayers = [];
    if (polyline) {
        map.removeLayer(polyline);
        polyline = null;
    }
}

function parseGPX(text) {
    const parser = new DOMParser();
    xmlDoc = parser.parseFromString(text, 'application/xml');
}

function extractTracks() {
    const tracks = [];
    if (!xmlDoc) return tracks;
    const trks = xmlDoc.getElementsByTagName('trk');
    for (let i = 0; i < trks.length; i++) {
        const trk = trks[i];
        const segs = trk.getElementsByTagName('trkseg');
        for (let s = 0; s < segs.length; s++) {
            const seg = segs[s];
            const pts = seg.getElementsByTagName('trkpt');
            const coords = [];
            for (let p = 0; p < pts.length; p++) {
                const lat = parseFloat(pts[p].getAttribute('lat'));
                const lon = parseFloat(pts[p].getAttribute('lon'));
                const eleEl = pts[p].getElementsByTagName('ele')[0];
                const ele = eleEl ? parseFloat(eleEl.textContent) : null;
                coords.push({lat, lon, ele});
            }
            tracks.push({trkIndex: i, segIndex: s, coords});
        }
    }
    return tracks;
}

function drawTracks(tracks) {
    resetMap();
    const allCoords = [];
    tracks.forEach((t, idx) => {
        const latlngs = t.coords.map(c => [c.lat, c.lon]);
        if (latlngs.length === 0) return;
        const layer = L.polyline(latlngs, {color: idx % 2 === 0 ? 'blue' : 'green'}).addTo(map);
        trackLayers.push(layer);
        allCoords.push(...latlngs);
        // start/end markers
        const start = L.circleMarker(latlngs[0], {radius:5, color:'white', fillColor:'green', fillOpacity:1}).addTo(map);
        const end = L.circleMarker(latlngs[latlngs.length-1], {radius:5, color:'white', fillColor:'red', fillOpacity:1}).addTo(map);
        trackLayers.push(start, end);
    });
    if (allCoords.length) {
        map.fitBounds(allCoords);
    }
}

function reverseTracksInDom() {
    if (!xmlDoc) return;
    const trksegs = xmlDoc.getElementsByTagName('trkseg');
    for (let i = 0; i < trksegs.length; i++) {
        const seg = trksegs[i];
        const pts = Array.from(seg.getElementsByTagName('trkpt'));
        // remove all existing trkpt
        pts.forEach(pt => seg.removeChild(pt));
        // append in reversed order
        for (let j = pts.length - 1; j >= 0; j--) {
            seg.appendChild(pts[j]);
        }
    }
}

function downloadCurrentGPX(filename) {
    if (!xmlDoc) return;
    const serializer = new XMLSerializer();
    const text = serializer.serializeToString(xmlDoc);
    const blob = new Blob([text], {type: 'application/gpx+xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'track.gpx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function onFileLoaded(e) {
    const text = e.target.result;
    originalGpxText = text;
    parseGPX(text);
    const tracks = extractTracks();
    drawTracks(tracks);
    document.getElementById('reverseBtn').disabled = false;
    document.getElementById('downloadBtn').disabled = false;
    reversed = false;
    document.getElementById('reverseBtn').textContent = 'Reverse Points';
}

function setupControls() {
    const fileInput = document.getElementById('gpxFile');
    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = onFileLoaded;
        reader.readAsText(file);
    });

    document.getElementById('reverseBtn').addEventListener('click', function() {
        if (!xmlDoc) return;
        reverseTracksInDom();
        const tracks = extractTracks();
        drawTracks(tracks);
        reversed = !reversed;
        this.textContent = reversed ? 'Restore Original' : 'Reverse Points';
    });

    document.getElementById('downloadBtn').addEventListener('click', function() {
        // try to derive filename from metadata/name
        let filename = 'track.gpx';
        try {
            const nameEl = xmlDoc.getElementsByTagName('name')[0];
            if (nameEl && nameEl.textContent) {
                filename = nameEl.textContent.trim().toLowerCase().replace(/\s+/g, '_') + '.gpx';
            }
        } catch (e) {}
        downloadCurrentGPX(filename);
    });
}

window.addEventListener('load', function() {
    initMap();
    setupControls();
});
