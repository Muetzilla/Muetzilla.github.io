let gpxText = '';
let foundTags = new Set();

const tagDescriptions = {
    'ele': 'Höhe in Metern',
    'time': 'Zeitstempel',
    'trk': 'Track Container',
    'trkseg': 'Track Segment',
    'trkpt': 'Track Punkt',
    'hr': 'Herzfrequenz',
    'cad': 'Kadenz',
    'extensions': 'Ermöglicht das Hinzufügen von zusätzlichen Daten',
    'gpx': 'GPX Hauptcontainer',
    'type': 'Sportart',
    'name': 'Name der Aktivität',
    'metadata':'Zusätzliche Informationen z.B. Autor, Beschreibung oder Zeit',
    '':'',
};

document.getElementById('gpxFile').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        gpxText = e.target.result;
        extractTags(gpxText);
        extractMetadata(gpxText);
        displayTags();
    };
    reader.readAsText(file);
});

function extractTags(text) {
    foundTags = new Set();
    const regex = /<([a-zA-Z0-9:_-]+)(\s[^>]*)?>/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        foundTags.add(match[1]);
    }
}

function extractMetadata(text) {
    const nameMatch = text.match(/<name>(.*?)<\/name>/);
    const typeMatch = text.match(/<type>(.*?)<\/type>/);
    const typeValue = typeMatch ? typeMatch[1] : '';

    const nameInput = document.getElementById('activityName');
    const warning = document.getElementById('nameWarning');

    if (nameMatch) {
        nameInput.value = nameMatch[1];
        nameInput.classList.remove('invalid');
        warning.style.display = 'none';
    } else {
        nameInput.value = '';
        nameInput.classList.add('invalid');
        warning.style.display = 'inline';
    }

    document.getElementById('fileName').value = nameMatch
        ? nameMatch[1].toLowerCase().replace(/\s+/g, '_')
        : 'bereinigt';

    const select = document.getElementById('activityTypeSelect');
    const customInput = document.getElementById('customType');

    const knownTypes = ['walking', 'running', 'hiking', 'cycling', 'mountain_biking'];

    if (!typeValue) {
        select.value = '';
        customInput.style.display = 'none';
        customInput.value = '';
    } else if (knownTypes.includes(typeValue)) {
        select.value = typeValue;
        customInput.style.display = 'none';
        customInput.value = '';
    } else {
        select.value = 'custom';
        customInput.style.display = 'block';
        customInput.value = typeValue;
    }

}

function handleTypeChange() {
    const select = document.getElementById('activityTypeSelect');
    const customInput = document.getElementById('customType');
    if (select.value === 'custom') {
        customInput.style.display = 'block';
        customInput.readOnly = false;
        customInput.placeholder = 'Benutzerdefinierter Typ';
    } else {
        customInput.style.display = 'none';
        customInput.value = '';
    }
}


function clearNameWarning() {
    const input = document.getElementById('activityName');
    const warning = document.getElementById('nameWarning');
    if (input.value.trim() !== '') {
        input.classList.remove('invalid');
        warning.style.display = 'none';
    }
}

function displayTags() {
    const tagList = document.getElementById('tagList');
    const tagForm = document.getElementById('tagForm');
    tagList.innerHTML = '';
    tagForm.innerHTML = '';

    Array.from(foundTags).sort().forEach(tag => {
        const li = document.createElement('li');
        li.textContent = `<${tag}>`;
        li.setAttribute('data-description', tagDescriptions[tag] || 'Keine Beschreibung verfügbar');
        tagList.appendChild(li);

        const label = document.createElement('label');
        label.style.display = 'block';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = tag;
        checkbox.name = 'removeTags';
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` <${tag}>`));
        tagForm.appendChild(label);
    });
}

function cleanGPX() {
    let cleanedText = gpxText;

    // Entferne <hr> sicher über DOM
    cleanedText = removeHrTagsFromDOM(cleanedText);

    // Entferne alle anderen gewählten Tags per Regex
    const selected = Array.from(document.querySelectorAll('input[name="removeTags"]:checked'))
        .map(cb => cb.value)
        .filter(tag => tag !== 'hr'); // hr wurde schon behandelt

    selected.forEach(tag => {
        const openClose = new RegExp(`<${tag}[^>]*?>.*?</${tag}>`, 'gs');
        const selfClose = new RegExp(`<${tag}[^>]*/>`, 'gs');
        cleanedText = cleanedText.replace(openClose, '');
        cleanedText = cleanedText.replace(selfClose, '');
    });

    // Name und Typ aus UI lesen
    const newName = document.getElementById('activityName').value.trim();
    let newType = document.getElementById('activityTypeSelect').value;
    if (newType === 'custom') {
        newType = document.getElementById('customType').value.trim();
    }

    // GPX DOM neu parsen
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(cleanedText, "application/xml");

    // === NAME ===
    const metadata = xmlDoc.getElementsByTagName("metadata")[0];
    if (metadata) {
        let nameEl = metadata.getElementsByTagName("name")[0];
        if (!nameEl) {
            nameEl = xmlDoc.createElement("name");
            metadata.insertBefore(nameEl, metadata.firstChild);
        }
        nameEl.textContent = newName;
    }

    const trk = xmlDoc.getElementsByTagName("trk")[0];
    if (trk) {
        let trkName = trk.getElementsByTagName("name")[0];
        if (!trkName) {
            trkName = xmlDoc.createElement("name");
            trk.insertBefore(trkName, trk.firstChild);
        }
        trkName.textContent = newName;
    }

    // === TYP ===
    if (metadata) {
        // Versuche alle <type>-Elemente zu finden, egal ob mit oder ohne Namespace
        let typeEl = Array.from(metadata.getElementsByTagName("*"))
            .find(el => el.localName === "type");

        if (!typeEl) {
            typeEl = xmlDoc.createElement("type");
            metadata.appendChild(typeEl);
        }

        typeEl.textContent = newType;
    }


    if (trk) {
        let trkType = trk.getElementsByTagName("type")[0];
        if (!trkType) {
            trkType = xmlDoc.createElement("type");
            trk.appendChild(trkType);
        }
        trkType.textContent = newType;
    }

    const serializer = new XMLSerializer();
    cleanedText = serializer.serializeToString(xmlDoc);

    // === Download vorbereiten ===
    const fileBase = document.getElementById('fileName').value.trim() || 'bereinigt';
    const blob = new Blob([cleanedText], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileBase}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Entfernt <hr> unabhängig vom Namespace via DOM
function removeHrTagsFromDOM(gpxText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxText, "application/xml");

    const hrElements = Array.from(xmlDoc.getElementsByTagNameNS("*", "hr"));
    hrElements.forEach(el => {
        const parent = el.parentNode;
        if (parent) parent.removeChild(el);
    });

    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
}
