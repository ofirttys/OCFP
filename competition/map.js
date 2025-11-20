let clinics = [];
// Version: 2024-11-20c - Updated clinic colors, removed future extension, CartoDB Voyager default

// TTC Line 1 (Yonge-University) station coordinates
const ttcLine1Stations = [
    { name: "Vaughan Metropolitan Centre", lat: 43.7956, lng: -79.5245 },
    { name: "Highway 407", lat: 43.7789, lng: -79.5287 },
    { name: "Pioneer Village", lat: 43.7733, lng: -79.5030 },
    { name: "York University", lat: 43.7735, lng: -79.5025 },
    { name: "Finch West", lat: 43.7658, lng: -79.4935 },
    { name: "Downsview Park", lat: 43.7532, lng: -79.4782 },
    { name: "Sheppard West", lat: 43.7489, lng: -79.4697 },
    { name: "Wilson", lat: 43.7354, lng: -79.4501 },
    { name: "Yorkdale", lat: 43.7250, lng: -79.4478 },
    { name: "Lawrence West", lat: 43.7165, lng: -79.4429 },
    { name: "Glencairn", lat: 43.7090, lng: -79.4402 },
    { name: "Eglinton West", lat: 43.6988, lng: -79.4354 },
    { name: "St. Clair West", lat: 43.6839, lng: -79.4287 },
    { name: "Dupont", lat: 43.6744, lng: -79.4069 },
    { name: "Spadina", lat: 43.6673, lng: -79.4044 },
    { name: "St. George", lat: 43.6681, lng: -79.3999 },
    { name: "Museum", lat: 43.6677, lng: -79.3933 },
    { name: "Queen's Park", lat: 43.6660, lng: -79.3906 },
    { name: "St. Patrick", lat: 43.6547, lng: -79.3888 },
    { name: "Osgoode", lat: 43.6507, lng: -79.3869 },
    { name: "St. Andrew", lat: 43.6476, lng: -79.3843 },
    { name: "Union", lat: 43.6453, lng: -79.3806 },
    { name: "King", lat: 43.6491, lng: -79.3779 },
    { name: "Queen", lat: 43.6524, lng: -79.3791 },
    { name: "Dundas", lat: 43.6565, lng: -79.3805 },
    { name: "College", lat: 43.6611, lng: -79.3831 },
    { name: "Wellesley", lat: 43.6654, lng: -79.3835 },
    { name: "Bloor-Yonge", lat: 43.6707, lng: -79.3863 },
    { name: "Rosedale", lat: 43.6777, lng: -79.3880 },
    { name: "Summerhill", lat: 43.6823, lng: -79.3905 },
    { name: "St. Clair", lat: 43.6868, lng: -79.3932 },
    { name: "Davisville", lat: 43.6977, lng: -79.3974 },
    { name: "Eglinton", lat: 43.7067, lng: -79.3985 },
    { name: "Lawrence", lat: 43.7254, lng: -79.4016 },
    { name: "York Mills", lat: 43.7456, lng: -79.4076 },
    { name: "Sheppard-Yonge", lat: 43.7614, lng: -79.4107 },
    { name: "North York Centre", lat: 43.7679, lng: -79.4141 },
    { name: "Finch", lat: 43.7806, lng: -79.4149 }
];

// Color palette for different clinic groups
const clinicColors = {
    'mount-sinai': '#e74c3c',     // Red
    'trio': '#3498db',            // Blue  
    'create': '#2ecc71',          // Green
    'hannam': '#f39c12',          // Orange
    'anova': '#9b59b6',           // Purple
    'twig': '#e91e63',            // Pink/Magenta
    'pollin': '#00bcd4',          // Cyan/Turquoise
    'generation': '#8bc34a',      // Light Green
    'default': '#95a5a6'
};

// Geocode an address to lat/lng using Nominatim (OpenStreetMap)
async function geocodeAddress(address) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error(`Error geocoding address: ${address}`, error);
        return null;
    }
}

// Load clinics data from JSON file
async function loadClinicsData() {
    try {
        console.log('Attempting to load clinics.json...');
        console.log('Current URL:', window.location.href);
        
        const response = await fetch('clinics.json');
        console.log('Fetch response:', response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        clinics = await response.json();
        console.log('Loaded clinics data:', clinics);
        
        // Geocode any clinics that don't have lat/lng
        const geocodePromises = clinics.map(async (clinic, index) => {
            if (!clinic.lat || !clinic.lng) {
                console.log(`Geocoding address for ${clinic.name}: ${clinic.address}`);
                const coords = await geocodeAddress(clinic.address);
                if (coords) {
                    clinics[index].lat = coords.lat;
                    clinics[index].lng = coords.lng;
                    console.log(`✓ Geocoded ${clinic.name}:`, coords);
                } else {
                    console.warn(`✗ Failed to geocode ${clinic.name}`);
                }
                // Add delay to respect Nominatim usage policy (max 1 request per second)
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        });
        
        await Promise.all(geocodePromises);
        
        initializeMap();
    } catch (error) {
        console.error('Error loading clinics data:', error);
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        
        // Check if it's a CORS error
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showError(`Failed to load clinics data. <br><br>
                <strong>Common causes:</strong><br>
                1. You're opening the file directly (file://) - Use a local web server instead<br>
                2. The clinics.json file is not in the same folder as index.html<br><br>
                <strong>Solutions:</strong><br>
                • Use Python: <code>python -m http.server 8000</code><br>
                • Use Node.js: <code>npx http-server</code><br>
                • Use VS Code: Install "Live Server" extension<br><br>
                Then open: <code>http://localhost:8000</code>`);
        } else {
            showError(`Failed to load clinics data: ${error.message}<br><br>
                Check the browser console (F12) for more details.`);
        }
    }
}

// Display error message to user
function showError(message) {
    const mapElement = document.getElementById('map');
    mapElement.innerHTML = `
        <div style="
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100%; 
            background: #f8f9fa; 
            color: #6c757d; 
            text-align: center;
            font-size: 16px;
            border-radius: 8px;
        ">
            <div>
                <h3 style="color: #dc3545; margin-bottom: 10px;">⚠️ Error Loading Map</h3>
                <p style="margin: 0;">${message}</p>
            </div>
        </div>
    `;
}

// Calculate and update statistics - REMOVED (not needed)
// function updateStats() { ... }

// Initialize the map
function initializeMap() {
    const map = L.map('map').setView([43.7, -79.4], 11);

    // Define different tile layer options
    const baseLayers = {
        "Standard OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }),
        
        "OpenTopoMap (Shows roads clearly)": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenTopoMap, © OpenStreetMap contributors',
            maxZoom: 17
        }),
        
        "CartoDB Voyager (Clean & Modern)": L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© CARTO, © OpenStreetMap contributors'
        }),
        
        "CartoDB Dark Matter": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© CARTO, © OpenStreetMap contributors'
        })
    };
    
    // Add the default layer (CartoDB Voyager)
    baseLayers["CartoDB Voyager (Clean & Modern)"].addTo(map);
    
    // Add layer control (top-right corner) so user can switch between map styles
    L.control.layers(baseLayers).addTo(map);
    
    // Draw TTC Line 1
    drawTTCLine1(map);

    // Calculate total physicians dynamically
    const totalPhysicians = clinics.reduce((sum, clinic) => sum + clinic.physicians, 0);

    // Force map to invalidate size and reposition markers correctly
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    // Add markers for each clinic
    clinics.forEach(clinic => {
        const percentage = ((clinic.physicians / totalPhysicians) * 100).toFixed(1);
        const color = clinicColors[clinic.clinicGroup] || clinicColors['default'];
        
        // Use circle markers like TTC stations
        const marker = L.circleMarker([clinic.lat, clinic.lng], {
            radius: 6,
            fillColor: color,
            color: '#333',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(map);

        // Create popup content
        const popupContent = `
            <div class="custom-popup">
                <div class="popup-title">${clinic.name}</div>
                <div class="popup-address">${clinic.address}</div>
                <div class="popup-physicians">Physicians: ${clinic.physicians}</div>
                <div class="popup-share">Share: ${percentage}% of total</div>
            </div>
        `;

        marker.bindPopup(popupContent);
    });

    // Fit map to show all markers with proper bounds
    const group = new L.featureGroup(clinics.map(clinic => 
        L.marker([clinic.lat, clinic.lng])
    ));
    
    // Set bounds with padding after a brief delay to ensure markers are rendered
    setTimeout(() => {
        map.fitBounds(group.getBounds().pad(0.15));
    }, 200);
    
    // Add legend for clinic groups
    addClinicLegend(map);
}

// Highway 401 coordinates (approximate path through GTA)
const highway401 = [
    [43.7850, -79.6200], [43.7800, -79.5500], [43.7750, -79.4800],
    [43.7700, -79.4200], [43.7650, -79.3600], [43.7600, -79.3000],
    [43.7550, -79.2400], [43.7500, -79.1800]
];

// Highway 404/DVP coordinates
const highway404DVP = [
    [43.8800, -79.4650], [43.8400, -79.4600], [43.8000, -79.4550],
    [43.7600, -79.4500], [43.7200, -79.4100], [43.7000, -79.3950],
    [43.6800, -79.3800], [43.6600, -79.3700], [43.6500, -79.3650]
];

// Gardiner Expressway coordinates
const gardinerExpressway = [
    [43.6350, -79.6400], [43.6380, -79.5800], [43.6400, -79.5200],
    [43.6420, -79.4600], [43.6440, -79.4000], [43.6460, -79.3400],
    [43.6480, -79.2800]
];

// Draw TTC Line 1 on the map
function drawTTCLine1(map) {
    // Create array of coordinates for the line
    const lineCoordinates = ttcLine1Stations.map(station => [station.lat, station.lng]);
    
    // Draw the main subway line with enhanced styling
    const ttcLine = L.polyline(lineCoordinates, {
        color: '#FFD700',
        weight: 6,
        opacity: 0.9,
        smoothFactor: 1,
        className: 'ttc-line'
    }).addTo(map);
    
    // Add a white border/outline effect
    const ttcLineOutline = L.polyline(lineCoordinates, {
        color: '#FFFFFF',
        weight: 8,
        opacity: 0.6,
        smoothFactor: 1
    }).addTo(map);
    
    // Bring the main line to front
    ttcLine.bringToFront();
    
    // Add station markers (small circles) - optional, can be removed
    ttcLine1Stations.forEach(station => {
        L.circleMarker([station.lat, station.lng], {
            radius: 3,
            fillColor: '#FFD700',
            color: '#333',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(map).bindPopup(`<b>TTC Line 1</b><br>${station.name}`);
    });
    
    ttcLine.bindPopup('<b>TTC Line 1</b><br>Yonge-University Subway Line');
}

// Draw future TTC Line 1 extension on the map
// Add legend for clinic groups
function addClinicLegend(map) {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        
        // Get unique clinic groups from data
        const groups = [...new Set(clinics.map(c => c.clinicGroup))];
        
        div.innerHTML = '<h4>Clinic Networks</h4>';
        
        groups.forEach(group => {
            const color = clinicColors[group] || clinicColors['default'];
            const displayName = group.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            div.innerHTML += `
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${color}"></span>
                    <span>${displayName}</span>
                </div>
            `;
        });
        
        div.innerHTML += `
            <div class="legend-item" style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
                <span class="legend-color" style="background-color: #FFD700; border-radius: 0; width: 20px;"></span>
                <span>TTC Line 1</span>
            </div>
        `;
        
        return div;
    };
    
    legend.addTo(map);
}

// Load data and initialize when page loads
loadClinicsData();