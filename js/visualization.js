
const visualization = {
    init: () => {

        initializeMap();

        visualization.medicalFacilities = new MedicalFacilitiesOverlay();
        visualization.medicalFacilities.init();

        visualization.mapEvents = new MapEventOverlay();
        visualization.mapEvents.init();

        visualization.dotDensity = new DotDensityOverlay();
        visualization.dotDensity.init();

        visualization.contours = new ContoursOverlay();
        visualization.contours.init();

        visualization.drawing = new DrawingOverlay();
        visualization.drawing.init();

        visualization.sidebar = new Charts();
        visualization.sidebar.init();

        visualization.timelineSlider = new timelineSlider();
        visualization.timelineSlider.init();

        visualization.topoJSON = new TopoJSONOverlay();
        visualization.topoJSON.init();

        updateZorder();

        preprocessCoordinatesForZoom();
        onFilterChanged();

        return visualization;
    },
    refresh: onFilterChanged,
    toggle2dDensityOverlay: (isActive) => {
        visualization.contours.toggle2d(isActive);
    },
    toggleContourOverlay: (isActive) => {
        visualization.contours.toggleContours(isActive);
    },
    toggleDotDensity: (isActive) => {
        visualization.dotDensity.toggle(isActive);
    },

    toggleScrollWheelZoomable: (isScrollWheelZoomable) => {
        isScrollWheelZoomable ? App.map.scrollWheelZoom.enable() : App.map.scrollWheelZoom.disable();
    }

}


function initializeMap() {

    const mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZWUyZGV2IiwiYSI6ImNqaWdsMXJvdTE4azIzcXFscTB1Nmcwcm4ifQ.hECfwyQtM7RtkBtydKpc5g';

    const grayscale = L.tileLayer(mbUrl, { id: 'mapbox.light', attribution: mbAttr }),
        satellite = L.tileLayer(mbUrl, { id: 'mapbox.satellite', attribution: mbAttr }),
        streets = L.tileLayer(mbUrl, { id: 'mapbox.streets', attribution: mbAttr });

    // [latitude, longitude] of WashU SOM
    const mapCenter = [38.637587, -90.262347];

    // setup map
    App.map = L.map('map', {
        center: mapCenter,
        zoom: 7,
        layers: [grayscale],
        zoomControl: false
    });

    new L.Control.Zoom({ position: 'bottomleft'}).addTo(App.map);

    // map layer options
    const baseLayers = {
        "Grayscale": grayscale,
        "Streets": streets,
        "Satellite": satellite
    };

    L.control.layers(null, baseLayers, { position: 'bottomleft'}).addTo(App.map);

    // Initialize SVG layer
    App.map._initPathRoot();

    d3.select(".leaflet-bottom.leaflet-left").style("z-index", 0);

    // use D3's custom geo transform method to implement the above
    const projection = d3.geoTransform({ point: projectPointLeaflet });
    // creates geopath from projected points (SVG)
    App.pathCreator = d3.geoPath().projection(projection);
    App.map.on('zoomstart', onZoomStart);
    // reset whenever map is zoomed
    App.map.on('zoomend', onZoomComplete);
    // recompute contours when map is done panning
    App.map.on('moveend', onPanComplete);

}



/********************************************************************************
 ****************************** Visualization - Events ***************************
 ********************************************************************************/



function onPanComplete() {
    visualization.contours.refresh();
}

function onZoomStart() {
    App.zooming = true;
}

function onZoomComplete() {
    preprocessCoordinatesForZoom();
    visualization.dotDensity.onZoomComplete();
    visualization.medicalFacilities.onZoomComplete();
    visualization.mapEvents.onZoomComplete();
    visualization.drawing.onZoomComplete();
    visualization.contours.refresh();
    visualization.sidebar.refresh();
    App.zooming = false;
}

function onFilterChanged(sliderDragging = false) {
    filters.apply();
    visualization.dotDensity.onFilterChanged(sliderDragging);
    visualization.medicalFacilities.onFilterChanged(sliderDragging);
    visualization.mapEvents.onFilterChanged(sliderDragging);
    visualization.timelineSlider.refresh();
    visualization.contours.refresh();
    visualization.sidebar.refresh();
    visualization.timelineSlider.refresh();
}



/********************************************************************************
 **************************** Visualization - Updates ***************************
 ********************************************************************************/

/* SVG doesn't support z-index, so we need to add them back in desired order */
function updateZorder() {
    visualization.topoJSON.raiseGroup();
    visualization.dotDensity.raiseGroup();
    visualization.mapEvents.raiseGroup();
    visualization.medicalFacilities.raiseGroup();
    visualization.contours.raiseGroup();
    visualization.drawing.raiseGroup();
}



/********************************************************************************
 ********************************** Utility - Viz *******************************
 ********************************************************************************/

function getCircleRadius(zoom, init) {
    return (init / (Math.pow(1.15, 18 - zoom)));
}

function getDensityThresholds(points, cellSize) {
    let gridCounts = {};

    let maxCount = 0;
    points.forEach(d => {
        let xIndex = Math.floor(d.pointDensity[0] / cellSize);
        let yIndex = Math.floor(d.pointDensity[1] / cellSize);

        if (!(xIndex in gridCounts)) {
            gridCounts[xIndex] = {}
        }
        if (!(yIndex in gridCounts[xIndex])) {
            gridCounts[xIndex][yIndex] = 0
        }

        gridCounts[xIndex][yIndex]++;
        maxCount = Math.max(maxCount, gridCounts[xIndex][yIndex]);
    });

    // WARNING: empirical magic numbers
    let maxThreshold = Math.log2(maxCount);
    let maxLogThreshold = Math.floor(maxThreshold);
    let logThresholds = Array.from(Array(10 + maxLogThreshold * 4).keys());
    let thresholds = logThresholds.map(x => Math.pow(1.25, x) / 20);
    thresholds.unshift(0.01);

    //console.log(maxThreshold, thresholds);

    return (thresholds);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getNextColor(init_chroma, init_luminance, initial_hue, num_divisions, i) {
    const cycle = Math.floor(i / num_divisions);
    const step = i % num_divisions;
    const huePerStep = 360.0 / num_divisions;

    let hueOffsetForCycleGroup = 0, distBetweenOffsets = 0, cycleInGroup = 0;
    if (cycle > 0 ) {
        const group = Math.floor(Math.log2(cycle))+1;
        const groupSquared = Math.pow(2, group);
        hueOffsetForCycleGroup = huePerStep / groupSquared;
        distBetweenOffsets = hueOffsetForCycleGroup * 2;
        cycleInGroup = cycle - Math.pow(2, group-1);
    }

    const firstHueInCycle = hueOffsetForCycleGroup + (distBetweenOffsets * cycleInGroup);

    const hue = initial_hue + firstHueInCycle + (huePerStep * step);

    const clCycle = (cycle % 5);

    return chroma({ l:(init_luminance-(clCycle*(0.05)))*100, c:(init_chroma-(clCycle*(0.05)))*100, h:hue });
    //return chroma({ l:lightness*100, c:saturation*100, h:hue });
    //return d3.hsl(hue, saturation, lightness)
}



/********************************************************************************
 ********************************** Utility - Map *******************************
 ********************************************************************************/

// Use Leaflets projection API for drawing svg path (creates a stream of projected points)
function projectPointLeaflet(x, y) {
    const point = App.map.latLngToLayerPoint(new L.latLng(y, x));
    this.stream.point(point.x, point.y)
}

function projectPoint(x, y) {
    return (App.map.latLngToLayerPoint(new L.latLng(x, y)));
}

function preprocessCoordinatesForZoom() {
    visualization.dotDensity.onPreZoom();
    visualization.mapEvents.onPreZoom();
    visualization.medicalFacilities.onPreZoom();
}
