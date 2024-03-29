
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
        mbUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZWUyZGV2IiwiYSI6ImNqaWdsMXJvdTE4azIzcXFscTB1Nmcwcm4ifQ.hECfwyQtM7RtkBtydKpc5g';

    const grayscale = L.tileLayer(mbUrl, { id: 'mapbox/light-v10', attribution: mbAttr }),
        satellite = L.tileLayer(mbUrl, { id: 'mapbox/satellite-v9', attribution: mbAttr }),
        streets = L.tileLayer(mbUrl, { id: 'mapbox/streets-v11', attribution: mbAttr });

    // [latitude, longitude] of WashU SOM
    const mapCenter =  App.params.map?.center ?? [38.637587, -90.262347];

    // setup map
    App.map = L.map('map', {
        center: mapCenter,
        zoom: App.params.map?.zoom ?? 11,
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
    L.control.scale( {imperial:false, position: 'bottomleft'}).addTo(App.map);

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
    if (!App.zooming) {
        visualization.contours.refresh();
    }
    App.zooming = false;
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
//ToDo refactor to importable utilities
function getCircleRadius(zoom, init) {
    return (init / (Math.pow(1.15, 18 - zoom)));
}

/********************************************************************************
 ********************************** Utility - Map *******************************
 ********************************************************************************/

 //Todo make private function
// Use Leaflets projection API for drawing svg path (creates a stream of projected points)
function projectPointLeaflet(x, y) {
    const point = App.map.latLngToLayerPoint(new L.latLng(y, x));
    this.stream.point(point.x, point.y)
}

//Todo refactor to importable utilities
function projectPoint(x, y) {
    return (App.map.latLngToLayerPoint(new L.latLng(x, y)));
}

//Todo refactor to importable utilities
function projectPointInverse(x, y) {
    return (App.map.layerPointToLatLng(new L.point(x, y)));
}

//Todo make private function
function preprocessCoordinatesForZoom() {
    visualization.dotDensity.onPreZoom();
    visualization.mapEvents.onPreZoom();
    visualization.medicalFacilities.onPreZoom();
}
