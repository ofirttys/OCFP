let cities = [];

// Load cities data from JSON file
async function loadCitiesData() {
    try {
        const response = await fetch('cities.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        cities = await response.json();
        initializeMap();
        updateStats();
    } catch (error) {
        console.error('Error loading cities data:', error);
        showError('Failed to load cities data. Please ensure cities.json file exists and is accessible.');
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

// Calculate and update statistics
function updateStats() {
    const totalCases = cities.reduce((sum, city) => sum + city.cases, 0);
    const activeLocations = cities.length;
    
    // Calculate GTA cases (includes Toronto, Hamilton, Newmarket, Mississauga)
    const gtaCases = cities
        .filter(city => city.region === "GTA")
        .reduce((sum, city) => sum + city.cases, 0);
    const gtaPercentage = Math.round((gtaCases / totalCases) * 100);
    
    // Calculate SickKids cases
    const sickKidsCity = cities.find(city => city.name.includes("SickKids"));
    const sickKidsPercentage = sickKidsCity ? 
        Math.round((sickKidsCity.cases / totalCases) * 100) : 0;
    
    // Update DOM elements
    document.getElementById('total-cases').textContent = totalCases;
    document.getElementById('active-locations').textContent = activeLocations;
    document.getElementById('gta-percentage').textContent = `${gtaPercentage}%`;
    document.getElementById('sickkids-percentage').textContent = `${sickKidsPercentage}%`;
}

// Initialize the map
function initializeMap() {
    const map = L.map('map').setView([44.0, -79.5], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Calculate total cases dynamically
    const totalCases = cities.reduce((sum, city) => sum + city.cases, 0);

    function createCustomMarker(city) {
        const markerClass = `marker-${city.type}`;
        const markerSize = city.type === 'high' ? [50, 50] : 
                          city.type === 'medium' ? [35, 35] : [25, 25];
        
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="custom-marker ${markerClass}">${city.cases}</div>`,
            iconSize: markerSize,
            iconAnchor: [markerSize[0]/2, markerSize[1]/2],
            popupAnchor: [0, -markerSize[1]/2]
        });

        return icon;
    }

    // Force map to invalidate size and reposition markers correctly
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    // Add markers for each city
    cities.forEach(city => {
        const percentage = ((city.cases / totalCases) * 100).toFixed(1);
        
        const marker = L.marker([city.lat, city.lng], {
            icon: createCustomMarker(city)
        }).addTo(map);

        // Create popup content
        const popupContent = `
            <div class="custom-popup">
                <div class="popup-title">${city.name}</div>
                <div class="popup-cases">Cases: ${city.cases}</div>
                <div class="popup-share">Share: ${percentage}% of total</div>
            </div>
        `;

        marker.bindPopup(popupContent);
    });

    // Fit map to show all markers with proper bounds
    const group = new L.featureGroup(cities.map(city => 
        L.marker([city.lat, city.lng])
    ));
    
    // Set bounds with padding after a brief delay to ensure markers are rendered
    setTimeout(() => {
        map.fitBounds(group.getBounds().pad(0.15));
    }, 200);
}

// Load data and initialize when page loads
loadCitiesData();