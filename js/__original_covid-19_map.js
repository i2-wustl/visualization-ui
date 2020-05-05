/********************************************************************************
 ************************************ Globals ***********************************
 ********************************************************************************/

/* Global variable to store data, settings, etc */
let App = {};

/* Enumerations */
const cases = {
    TOTAL : "total",
    ACTIVE : "active",
    RECOVERED : "recovered",
    NEW : "new"
};

const svgGroups = {
    HOSPITALS : "#hospitalGroup",
    PATIENT_DOT_DENSITY : "#patientDotDensity",
    MAP_EVENTS : "#mapEventGroup",
    CONTOURS : "#contourGroup",
    DRAWING : "#drawGroup",
    DRAWING_COMPLETE : "#drawGroupComplete"
};

const svgElements = {
    HOSPITAL_CIRCLES : ".hospitalCircle",
    PATIENT_CIRCLES : ".patientCircle",
    MAP_EVENT_CIRCLES : ".mapEventCircle",
    CONTOURS : ".contourPath",
    DRAWING_LINES : ".drawingLine",
    DRAWING_PATHS : ".drawingPath",
};

const initialRadiusValues = {
    HOSPITALS : 14,
    COVID19 : 11,
    ILI : 9,
    MAP_EVENTS : 14
};




/********************************************************************************
 ******************************** Initialization ********************************
 ********************************************************************************/

$(document).ready(function() {
    initialize();
});

function initialize() {
    Promise.all([
        d3.tsv("data/COVID19_032720_06Apr2020_125828336197.tsv"), // patients
        d3.tsv("data/hospitals_06Apr2020_152920809709.tsv"), // hospitals
        d3.csv("data/timeline-events.csv"), // timeline events
        d3.csv("data/map_events.csv"), // map events
        //d3.csv("data/test.csv"),
    ]).then(function(files) {
        processData(files);
        initializeSettings();
        initializeGUI();
        applyFilter();
        preprocessCoordinatesForZoom();
        drawHospitals();
        onFilterChanged();
    });
}

function processData(files) {
    App.data = {
        'patients' : files[0],
        'filtered_patients' : files[0],
        'hospitals' : files[1],
        'timeline_events' : files[2],
        'map_events' : files[3],
        'filtered_map_events' : files[3]
    };

    App.data.patients.forEach(function(p) {
        p.ENC_DATE = new Date(p.ENC_DATE);
        p.COVID19 = p.COVID19 === "TRUE"
        // add uniform random number to lat/long if demo'ing so we don't show patient addresses;
        p.Latitude = Number(p.Latitude) + (Math.random()-0.5)*2e-2;
        p.Longitude = Number(p.Longitude) + (Math.random()-0.5)*2e-2;
    });

    App.data.timeline_events.forEach(function(e) {
        e.Date = new Date(e.Date)
    });

    App.data.map_events.forEach(function(e) {
        e.Date = new Date(e.Date)
    });
}

function initializeSettings() {
    App.filters = {
        "date" : d3.min(App.data.patients, d => d.ENC_DATE),
        "COVID19" : d3.select("#COVID19-cb").property('checked'),
        "ILI" : d3.select("#ILI-cb").property('checked'),
        "cases" : d3.select('input[name="cases"]:checked').node().value
    };

    App.overlays = {
        "dot_density" : d3.select("#dot-density-btn").classed("active"),
        "twod_density" : d3.select("#twod-density-btn").classed("active"),
        "contours" : d3.select("#contours-btn").classed("active"),
    };

    App.drawMode = d3.select("#draw-poly-btn").classed("active");
}

function initializeGUI() {
    initializeMap();
    initializeTimeline();
    initializeControls();
    //initializeCharts();
}




/********************************************************************************
 ************************************** GUI *************************************
 ********************************************************************************/

function initializeMap() {

    const mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZWUyZGV2IiwiYSI6ImNqaWdsMXJvdTE4azIzcXFscTB1Nmcwcm4ifQ.hECfwyQtM7RtkBtydKpc5g';

    const grayscale = L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr}),
        satellite = L.tileLayer(mbUrl, {id: 'mapbox.satellite', attribution: mbAttr}),
        streets = L.tileLayer(mbUrl, {id: 'mapbox.streets', attribution: mbAttr});

    // [latitude, longitude] of WashU SOM
    const mapCenter = [38.637587, -90.262347];

    // setup map
    App.map = L.map('map', {
        center: mapCenter,
        zoom: 7,
        layers: [grayscale],
        zoomControl: false
    });

    new L.Control.Zoom({ position: 'bottomright' }).addTo(App.map);

    // map layer options
    const baseLayers = {
        "Grayscale": grayscale,
        "Streets": streets,
        "Satellite": satellite
    };

    L.control.layers(null, baseLayers, {position: 'bottomright'}).addTo(App.map);

    // Initialize SVG layer
    App.map._initPathRoot();

    // Pick the SVG from the map object
    const svg = d3.select("#map").select("svg");

    // Make groups for each type overlay so we can select by them later
    svg.append("g").attr("id", svgGroups.HOSPITALS.substr(1));
    svg.append("g").attr("id", svgGroups.PATIENT_DOT_DENSITY.substr(1));
    svg.append("g").attr("id", svgGroups.MAP_EVENTS.substr(1));
    svg.append("g").attr("id", svgGroups.CONTOURS.substr(1));
    svg.append("g").attr("id", svgGroups.DRAWING.substr(1));

    // use D3's custom geo transform method to implement the above
    const projection = d3.geoTransform({point: projectPointLeaflet});
    // creates geopath from projected points (SVG)
    App.pathCreator = d3.geoPath().projection(projection);
    // reset whenever map is zoomed
    App.map.on('zoomend', onZoomComplete);
    // recompute contours when map is done panning
    App.map.on('moveend', onPanComplete);
    // handle click events for draw mode
    App.map.on('click', drawPolygon);
}

function initializeTimeline() {
    const [startDate, endDate] = d3.extent(App.data.patients, d => d.ENC_DATE);

    const formatDateIntoYear = d3.timeFormat("%m/%d/%y");
    const formatDate = d3.timeFormat("%B %d, %Y"); //%A,

    const margin = {top:5, right:10, bottom:5, left:10},
        width = 320 - margin.left - margin.right,
        height = 70 - margin.top - margin.bottom;

    const svg = d3.select("#vis")
        .append("svg")
        .attr("width", "320px")
        .attr("height", height);

    let moving = false;
    let currentValue = 0;
    const targetValue = width;

    const numDays = daysBetween(startDate, endDate);

    const playButton = d3.select("#timeline-play");

    playButton.on("click", function() {
        const button = d3.select(this);
        if (button.attr("class") === "playing") {
            button.attr("class", "not-playing");
            moving = false;
            clearInterval(timer);
        } else {
            button.attr("class", "playing");
            moving = true;
            timer = setInterval(dateSliderStep, 50);
        }
    });

    const x = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, targetValue])
        .clamp(true);

    const slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + 32 + ")");

    const label = slider.append("text")
        .attr("class", "label")
        .attr("id", "dateFilter")
        .attr("x", targetValue/2)
        .attr("text-anchor", "middle")
        .text(formatDate(startDate))
        .attr("transform", "translate(0," + (-10) + ")");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() {
                slider.interrupt();
                currentValue = Math.max(0, d3.event.x);
                dateSliderUpdate(x.invert(currentValue));
            })
            .on("drag", function() {
                currentValue = Math.max(0, d3.event.x);
                dateSliderUpdate(x.invert(currentValue), true);
            })
        );

    const eventLabel = slider.append("text")
        .attr("class", "timeline-event-label")
        .attr("x", targetValue/2)
        .attr("text-anchor", "middle")
        .text("null")
        .attr("transform", "translate(0," + (25) + ")")
        .attr("visibility", "hidden")
        .style("fill", "#1f78b4");

    slider.selectAll("timeline-event")
        .data(App.data.timeline_events)
        .enter()
        .append("line")
        .attr("class", "timeline-event")
        .attr("x1", d => (x(new Date(d.Date)) + x(getDateAfterDays(d.Date,1)))/2)
        .attr("x2", d => (x(new Date(d.Date)) + x(getDateAfterDays(d.Date,1)))/2)
        .attr("y1", -4)
        .attr("y2", 4)
        .attr("name", d => "event_" + d.Name )
        .on("mouseover", function(d, i) {
            d3.select(this).classed("active", true);
            eventLabel.attr("visibility", "visible");
            eventLabel.text(d.Name + " - " + formatDateIntoYear(d.Date));
        })
        .on("mouseout", function(d, i) {
            d3.select(this).classed("active", false );
            eventLabel.attr("visibility", "hidden");
        }).on("click", function(d, i) {
        dateSliderUpdate(new Date(d.Date));
    });

    const handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 8);

    function dateSliderStep() {
        dateSliderUpdate(x.invert(currentValue));
        currentValue = currentValue + (targetValue/(numDays*5));
        if (currentValue > targetValue) {
            moving = false;
            playButton.attr("class", "not-playing");
            currentValue = 0;
            clearInterval(timer);
        }
    }

    function dateSliderUpdate(h, dragging=false) {
        // update position of slider
        handle.attr("cx", x(h));

        // update text of slider
        let oldDate = App.filters.date;
        let formattedDate = formatDate(h);
        label.text(formattedDate);
        App.filters.date = new Date(formattedDate);

        /*
        The next section was for showing the timeline event name while the play button was playing.
        In practice, the days pass too quickly to be able to read it. Also it was a little buggy.
        */

        /*
        // find name in events by date
        var matchedEvent = App.data.timeline_events.find(e => formatDate(e.Date) == formattedDate);
        if (matchedEvent) {
            // get matching tick and activate it
            slider.selectAll("[name='event_" + matchedEvent.Name+"']").classed("active", true )
            // update and show the tick label
            eventLabel.attr("visibility", "visible");
            eventLabel.text(matchedEvent.Name + " - " + formatDateIntoYear(matchedEvent.Date));
        } // check if there was a match yesterday, meaning we just left an event and should inactivate the tick and hide the label
        else if (App.data.timeline_events.find(e => formatDate(getDateAfterDays(e.Date,1)) === formattedDate))
        {
            eventTicks.classed("active", false );
            eventLabel.attr("visibility", "hidden");
        }
        */

        if (!datesAreOnSameDay(App.filters.date, oldDate)) {
            onFilterChanged(dragging);
        }


    }
}

function initializeControls() {
    d3.select("#COVID19-cb").on("click", function(){
        App.filters.COVID19 = d3.select(this).property('checked');
        onFilterChanged();
    });
    d3.select("#ILI-cb").on("click", function(){
        App.filters.ILI = d3.select(this).property('checked');
        onFilterChanged();
    });
    d3.selectAll('input[name="cases"]').on("change", function(){
        App.filters.cases = d3.select('input[name="cases"]:checked').node().value;
        onFilterChanged();
    });

    d3.select("#dot-density-btn").on("click", function(){
        let btn =  d3.select(this);
        let isActive = !btn.classed("active");
        btn.classed("active", isActive );
        App.overlays.dot_density = isActive;
        onDotDensityClick();
    });

    d3.select("#twod-density-btn").on("click", function(){
        let btn =  d3.select(this);
        let isActive = !btn.classed("active");
        btn.classed("active", isActive );
        App.overlays.twod_density = isActive;
        onContourClick();
    });

    d3.select("#contours-btn").on("click", function(){
        let btn =  d3.select(this);
        let isActive = !btn.classed("active");
        btn.classed("active", isActive );
        App.overlays.contours = isActive;
        onContourClick();
    });

    d3.select("#draw-poly-btn").on("click", function(){
        let btn =  d3.select(this);
        let isActive = !btn.classed("active");
        btn.classed("active", isActive );
        App.drawMode = isActive;
        App.drawPoints = [];
        App.drawPolygons = [];
    });
}

function initializeCharts() {
    let chart = timeSeries();

    d3.select("#example")
        .datum(App.data.patients)
        .call(chart);
}

function openControlPanel() {
    document.getElementById("control-sidebar").style.width = "250px";
}

function closeControlPanel() {
    document.getElementById("control-sidebar").style.width = "0";
}

function openChartPanel() {
    document.getElementById("chart-sidebar").style.width = "600px";
}

function closeChartPanel() {
    document.getElementById("chart-sidebar").style.width = "0";
}




/********************************************************************************
 ******************************** Data Filtering ********************************
 ********************************************************************************/

function applyFilter() {
    filterMapEvents();
    filterPatients();
}

function filterMapEvents() {
    // Filter by map events by date
    App.data.filtered_map_events = App.data.map_events.filter(d => d.Date <= App.filters.date);
}

function filterPatients() {
    let patients = App.data.patients;

    // Filter by date and cases
    switch (App.filters.cases) {
        case cases.TOTAL:
            patients = patients.filter(d => d.ENC_DATE <= App.filters.date);
            break;
        case cases.NEW:
            patients = patients.filter(d => datesAreOnSameDay(d.ENC_DATE, App.filters.date));
            break;
        case cases.ACTIVE:
            let activeThreshold = getDateAfterDays(App.filters.date, -14);
            patients = patients.filter(d => d.ENC_DATE <= App.filters.date && d.ENC_DATE > activeThreshold);
            break;
        default:
    }

    // Filter by cohort
    const cohorts = [];
    if (App.filters.COVID19) cohorts.push(true);
    if (App.filters.ILI) cohorts.push(false);
    patients = patients.filter(d => cohorts.includes(d.COVID19));

    App.data.filtered_patients = patients;
}




/********************************************************************************
 ****************************** Visualization - Events ***************************
 ********************************************************************************/

function onDotDensityClick() {
    updateDotDensity();
    updateZorder();
}

function onContourClick() {
    updateContours();
    updateZorder();
}

function onPanComplete() {
    updateContours();
    updateZorder();
}

function onZoomComplete() {
    preprocessCoordinatesForZoom();
    updatePatientDotDensityOnZoom()
    updateHospitalCirclesOnZoom();
    updateMapEventCirclesOnZoom();
    updateContours();
    updateZorder();
}

function onFilterChanged(sliderDragging = false) {
    applyFilter();
    updateDotDensity(sliderDragging);
    updateMapEventCircles(sliderDragging);
    updateContours(sliderDragging);
    updateZorder(sliderDragging);
}




/********************************************************************************
 **************************** Visualization - Updates ***************************
 ********************************************************************************/

/* the hospitals are always present so we draw them once and only update on zoom */
function drawHospitals() {
    const hospitalGroup = d3.select(svgGroups.HOSPITALS);
    const radiusHospitals = getCircleRadius(App.map.getZoom(), initialRadiusValues.HOSPITALS);

    hospitalGroup.selectAll(svgElements.HOSPITAL_CIRCLES)
        .data(App.data.hospitals)
        .enter()
        .append("circle")
        .attr("class", svgElements.HOSPITAL_CIRCLES.substr(1))
        .attr("cx", d => projectPoint(d.Latitude, d.Longitude).x)
        .attr("cy", d => projectPoint(d.Latitude, d.Longitude).y)
        .attr("r", radiusHospitals)
        .attr("fill", "#1f78b4")
        .attr("fill-opacity", "0.85")
        .attr("stroke", "#333333")
        .attr("stroke-width", "1px");
}

/* update only the position and radius on zoom */
function updateHospitalCirclesOnZoom() {
    const radiusHospitals = getCircleRadius(App.map.getZoom(), initialRadiusValues.HOSPITALS);

    d3.select(svgGroups.HOSPITALS).selectAll(svgElements.HOSPITAL_CIRCLES)
        .attr("cx", d => d.point.x)
        .attr("cy", d => d.point.y)
        .attr("r", radiusHospitals);
}

/* update only the position and radius on zoom */
function updatePatientDotDensityOnZoom() {
    const radiusCOVID19 = getCircleRadius(App.map.getZoom(), initialRadiusValues.COVID19);
    const radiusILI = getCircleRadius(App.map.getZoom(), initialRadiusValues.ILI);

    d3.select(svgGroups.PATIENT_DOT_DENSITY).selectAll(svgElements.PATIENT_CIRCLES)
        .attr("cx", d => d.point.x)
        .attr("cy", d => d.point.y)
        .attr("r", d => d.COVID19 ? radiusCOVID19 : radiusILI);
}

/* update only the position and radius on zoom */
function updateMapEventCirclesOnZoom() {
    const radiusMapEvents = getCircleRadius(App.map.getZoom(), initialRadiusValues.MAP_EVENTS);

    d3.select(svgGroups.MAP_EVENTS).selectAll(svgElements.MAP_EVENT_CIRCLES)
        .attr("cx", d => d.point.x)
        .attr("cy", d => d.point.y)
        .attr("r", radiusMapEvents);
}

/* update on filter change. Only time should affect this */
// TODO: only trigger this when a time filter has changed.
function updateMapEventCircles(sliderDragging = false) {
    const svg = d3.select("#map").select("svg");
    const mapEventGroup = d3.select(svgGroups.MAP_EVENTS);

    const t = svg.transition().duration(sliderDragging ? 0 : 250);

    const radiusMapEvents = getCircleRadius(App.map.getZoom(), initialRadiusValues.MAP_EVENTS);
    const mapEvents = App.data.filtered_map_events;

    mapEventGroup.selectAll(svgElements.MAP_EVENT_CIRCLES)
        .data(mapEvents, d => d.ID)
        .join(
            enter => enter
                .append("circle")
                .attr("class", svgElements.MAP_EVENT_CIRCLES.substr(1))
                .attr("cx", d => d.point.x)
                .attr("cy", d => d.point.y)
                .attr("r", 0)
                .attr("fill", "#a6cee3")
                .attr("fill-opacity", "0.85")
                .attr("stroke", "#333333")
                .attr("stroke-width", "1px"),
            update => update,
            exit => exit.call(circles => circles.transition(t).remove()
                .attr("r", 0))
        )
        .call(circles => circles.transition(t)
            .attr("r", radiusMapEvents));
}

/* update on filter change. Time, cases, cohorts, */
function updateDotDensity(sliderDragging = false) {
    const svg = d3.select("#map").select("svg");
    const patientDotDensityGroup = d3.select(svgGroups.PATIENT_DOT_DENSITY);

    const t = svg.transition().duration(sliderDragging ? 0 : 250);

    const radiusCOVID19 = getCircleRadius(App.map.getZoom(), initialRadiusValues.COVID19);
    const radiusILI = getCircleRadius(App.map.getZoom(), initialRadiusValues.ILI);

    const patients = App.data.filtered_patients;

    if (App.overlays.dot_density)
    {
        patientDotDensityGroup.selectAll(svgElements.PATIENT_CIRCLES)
            .data(patients, d => d.ID)
            .join(
                enter => enter
                    .append("circle")
                    .attr("class", svgElements.PATIENT_CIRCLES.substr(1))
                    .attr("cx", d => d.point.x)
                    .attr("cy", d =>  d.point.y)
                    .attr("r", 0)
                    .attr("fill", d => d.COVID19 ? "#B92739" : "#fb9a99")
                    .attr("fill-opacity", d => d.COVID19 ? "0.85" : "0.5"),
                update => update,
                exit => exit.call(circles => circles.transition(t).remove()
                    .attr("r", 0))
            )
            .call(circles => circles.transition(t)
                .attr("r", d => d.COVID19 ? radiusCOVID19 : radiusILI));

    }
    else { // TODO: don't even bother doing this if the dot-density button wasn't clicked
        // remove patient circles
        patientDotDensityGroup.selectAll(svgElements.PATIENT_CIRCLES)
            .data([])
            .join(
                enter => enter,
                update => update,
                exit => exit.call(circles => circles.transition(t).remove()
                    .attr("r", 0))
            )
    }

}

/* Used on zoom, pan, and filters because they are recomputed for all cases */
function updateContours() {
    const contourGroup = d3.select(svgGroups.CONTOURS);

    if (App.overlays.twod_density || App.overlays.contours)
    {
        // Use the data just outside our view for computing the contours
        let buffer = 50;

        /*
        There's a lot of coordinate system changes going on here. This are the coordinate systems:
            1) Lat/Long. These are largely ignored because we precomputed 2) on zoom.
            2) Pixel coordinates in window (projections from lat/long are computed by Leaflet).
            3) Pixel coordinates in the leaflet container that's been translated due to panning.
         */

        // Parse leaflet transform
        let [offsetX, offsetY] = d3.select(".leaflet-map-pane")
            .style("transform")
            .split("(")[1]
            .split("px").slice(0,2);
        offsetX = Number(offsetX.trim());
        offsetY = Number(offsetY.split(",")[1].trim());

        // Compute pixel bounds of the window plus a buffer. Only patients in this box will be used for computing contours.
        let minPixelX = -offsetX - buffer;
        let minPixelY = -offsetY - buffer;
        let maxPixelX = window.innerWidth - offsetX + buffer;
        let maxPixelY =  window.innerHeight - offsetY + buffer;

        // Filter by bounding box
        let patientsOnScreen = App.data.filtered_patients.filter(d =>
            d.point.x >= minPixelX && d.point.x <= maxPixelX && d.point.y >= minPixelY && d.point.y <= maxPixelY
        );

        // If we filtered everything, remove any contours that still exist and return.
        // TODO: duplicated code
        if (patientsOnScreen.length === 0) {
            contourGroup.selectAll(svgElements.CONTOURS)
                .data([])
                .join(
                    enter => enter,
                    update => update,
                    exit => exit.remove()
                );
            return;
        }

        // To compute the contours, the locations need to be in a range beginning at 0
        // so we need to translate the current pixel coordinates to start at [0,0]

        // Current pixel range of our data
        let [minX, maxX] = d3.extent(patientsOnScreen.map(d => d.point.x));
        let [minY, maxY] = d3.extent(patientsOnScreen.map(d => d.point.y));

        // functions to take our current range [min, max] and translate it to [0, max-min]
        let x2densityScale = d3.scaleLinear()
            .domain([minX, maxX])
            .range([0, maxX-minX]);

        let y2densityScale = d3.scaleLinear()
            .domain([minY, maxY])
            .range([0, maxY-minY]);

        // Translate the points
        patientsOnScreen.forEach(d => {
            d.pointDensity = [x2densityScale(d.point.x), y2densityScale(d.point.y)]
        });

        // Choose parameters for computing the contours based on the zoom.
        // These are magic numbers empirically chosen to balance usefulness, aesthetics, and performance.
        // Maybe you can do better, but is it really worth your time?
        let cellSize = App.map.getZoom() > 11 ? Math.pow(2, App.map.getZoom()-10) : 2;
        let bandwidth = App.map.getZoom() > 11 ? Math.pow(2, App.map.getZoom()-10) : 4;
        let thresholds = getDensityThresholds(patientsOnScreen, cellSize);

        // Compute the density data
        let densityData = d3.contourDensity()
            .x(function(d) { return d.pointDensity[0]; })
            .y(function(d) { return d.pointDensity[1]; })
            .size([x2densityScale.range()[1], y2densityScale.range()[1]])
            .cellSize(cellSize)
            .bandwidth(bandwidth)
            .thresholds(thresholds)
            (patientsOnScreen);

        // Translate the contours back to pixel coordinates used by leaflet
        densityData.forEach(threshold => {
            threshold.coordinates.forEach(contour => {
                contour.forEach(subcontour => {
                    subcontour.forEach(point => {
                        point[0] = x2densityScale.invert(point[0]);
                        point[1] = y2densityScale.invert(point[1]);
                    })
                })
            })
        });

        // Remove empty contours
        densityData = densityData.filter(d => d.coordinates.length > 0);

        // Prepare a color palette
        const color = d3.scaleSequential([0, densityData.length+2], d3.interpolateYlGnBu);

        // Draw the contours. They are already in the leaflet coordinates so we use d3.geoPath() without any
        // projection function.
        // TODO: refactor so that we don't update these attributes twice based on the overlay
        let densityPath = contourGroup.selectAll(svgElements.CONTOURS)
            .data(densityData)
            .join(
                enter => enter
                    .append("path")
                    .attr("class", svgElements.CONTOURS.substr(1))
                    .attr("fill", "none")
                    .attr("stroke-width", 0)
                    .attr("d", d3.geoPath()),
                update => update
                    .attr("fill", "none")
                    .attr("stroke-width", 0)
                    .attr("d", d3.geoPath()),
                exit => exit.remove()
            );

        if (App.overlays.contours) {
            densityPath
                .attr("stroke", "#69b3a2")
                .attr("stroke-linejoin", "round")
                .attr("stroke-width", "1px");
        }
        if (App.overlays.twod_density) {
            densityPath
                .attr("fill", (d,i) => color(i === 0 ? 0 : i + 2))
                .attr("fill-opacity", 0.7)
        }


    } else {
        // TODO: don't bother doing this if the contour or 2d-density button wasn't clicked
        contourGroup.selectAll(svgElements.CONTOURS)
            .data([])
            .join(
                enter => enter,
                update => update,
                exit => exit.remove()
            );
    }
}

/* SVG doesn't support z-index, so we need to add them back in desired order */
function updateZorder() {
    const patientDotDensityGroup = d3.select(svgGroups.PATIENT_DOT_DENSITY);
    const hospitalGroup = d3.select(svgGroups.HOSPITALS);
    const mapEventGroup = d3.select(svgGroups.MAP_EVENTS);
    // make sure COVID patients are drawn on top of ILI because they're more important
    patientDotDensityGroup.selectAll(svgElements.PATIENT_CIRCLES).filter(d => d.COVID19).raise();
    mapEventGroup.raise();
    hospitalGroup.raise();
    d3.selectAll(svgGroups.CONTOURS).raise();
}




/********************************************************************************
 ************************************* Drawing **********************************
 ********************************************************************************/

function drawPolygon(e) {

    if (App.drawMode) {
        let drawGroup = d3.select(svgGroups.DRAWING);
        let newPoly = drawGroup.select(".newPoly").empty() ?
            drawGroup.append('g').attr('class', 'newPoly') : drawGroup.select(".newPoly");

        let startPoint = e.containerPoint;

        App.drawPoints.push(e.layerPoint);
        newPoly.select('path').remove();

        let line = d3.line()
            .x(d => d.x)
            .y(d => d.y)(App.drawPoints);

        newPoly.selectAll("path")
            .data(App.drawPoints)
            .enter()
            .append("path")
            .attr("d", line)
            .style('fill', 'none')
            .attr('stroke', '#000');

        newPoly.selectAll("circle")
            .data(App.drawPoints)
            .enter()
            .append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 8)
            .attr('fill', 'yellow')
            .attr('stroke', '#000')
            .attr('is-handle', 'true')
            .on("click", function (d,i) {
                closePolygon();
                d3.event.stopPropagation();
            })
            .style("cursor", 'pointer');

    }
}

function closePolygon() {
    let drawGroup = d3.select(svgGroups.DRAWING);
    // clear the points
    drawGroup.select(".newPoly").remove();

    App.drawPolygons.push(App.drawPoints);
    App.drawPoints = [];

    // add the polygon
    drawGroup.selectAll("polygon")
        .data(App.drawPolygons)
        .enter()
        .append("polygon")
        .attr("points", d => d.map(function(d) { return [d.x, d.y].join(",")}))
        .attr('fill', d => getRandomColor())
        .attr('fill-opacity', 0.5);

}




/********************************************************************************
 ************************************* Charts ***********************************
 ********************************************************************************/

function timeSeries() {
    let width = 400,
        height = 200;

    function chart(selection){
        let data = selection.datum();

        let svg = d3.select(this).selectAll("svg");

        // Otherwise, create the skeletal chart.
        let gEnter = svg.enter().append("svg").append("g");
        gEnter.append("path").attr("class", "area");
        gEnter.append("path").attr("class", "line");
        gEnter.append("g").attr("class", "x axis");

        // Update the outer dimensions.
        svg.attr("width", width)
            .attr("height", height);

    }

    chart.width = function(value) {
        if (!arguments.length) {
            return width;
        }
        width = value;
        return chart;
    }

    chart.height = function(value) {
        if (!arguments.length) {
            return height;
        }
        height = value;
        return chart;
    }

    return chart;
}

function timeSeriesChart() {
    let margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = 760,
        height = 120,
        xValue = function(d) { return d[0]; },
        yValue = function(d) { return d[1]; },
        xScale = d3.scaleTime().range([0, width]),
        yScale = d3.scaleLinear().range([height, 0]),
        area = d3.area().x(X).y1(Y),
        line = d3.line().x(X).y(Y),
        xAxis = d3.axisBottom(xScale);

    function chart(selection) {
        selection.each(function(data) {

            // Convert data to standard representation greedily;
            // this is needed for nondeterministic accessors.
            data = data.map(function(d, i) {
                return [xValue.call(data, d, i), yValue.call(data, d, i)];
            });

            // Update the x-scale.
            xScale
                .domain(d3.extent(data, function(d) { return d[0]; }))
                .range([0, width - margin.left - margin.right]);

            // Update the y-scale.
            yScale
                .domain([0, d3.max(data, function(d) { return d[1]; })])
                .range([height - margin.top - margin.bottom, 0]);

            // Select the svg element, if it exists.
            let svg = d3.select(this).selectAll("svg").data([data]);

            // Otherwise, create the skeletal chart.
            let gEnter = svg.enter().append("svg").append("g");
            gEnter.append("path").attr("class", "area");
            gEnter.append("path").attr("class", "line");
            gEnter.append("g").attr("class", "x axis");

            // Update the outer dimensions.
            svg.attr("width", width)
                .attr("height", height);

            // Update the inner dimensions.
            let g = svg.select("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // Update the area path.
            g.select(".area")
                .attr("d", area.y0(yScale.range()[0]));

            // Update the line path.
            g.select(".line")
                .attr("d", line);

            // Update the x-axis.
            g.select(".x.axis")
                .attr("transform", "translate(0," + yScale.range()[0] + ")")
                .call(xAxis);
        });
    }

    // The x-accessor for the path generator; xScale ∘ xValue.
    function X(d) {
        return xScale(d[0]);
    }

    // The x-accessor for the path generator; yScale ∘ yValue.
    function Y(d) {
        return yScale(d[1]);
    }

    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
    };

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.x = function(_) {
        if (!arguments.length) return xValue;
        xValue = _;
        return chart;
    };

    chart.y = function(_) {
        if (!arguments.length) return yValue;
        yValue = _;
        return chart;
    };

    return chart;
}




/********************************************************************************
 ********************************** Utility - Map *******************************
 ********************************************************************************/

// Use Leaflets projection API for drawing svg path (creates a stream of projected points)
function projectPointLeaflet(x,y) {
    const point = App.map.latLngToLayerPoint(new L.latLng(y,x));
    this.stream.point(point.x, point.y)
}

function projectPoint(x,y) {
    return(App.map.latLngToLayerPoint(new L.latLng(x,y)));
}

function preprocessCoordinatesForZoom() {

    App.data.patients.forEach(d => {
        d.point = projectPoint(d.Latitude, d.Longitude);
    });

    App.data.filtered_patients.forEach(d => {
        d.point = projectPoint(d.Latitude, d.Longitude);
    });

    App.data.map_events.forEach(d => {
        d.point = projectPoint(d.Latitude, d.Longitude);
    });

    App.data.filtered_map_events.forEach(d => {
        d.point = projectPoint(d.Latitude, d.Longitude);
    });

    App.data.hospitals.forEach(d => {
        d.point = projectPoint(d.Latitude, d.Longitude);
    });
}




/********************************************************************************
 ********************************** Utility - Time ******************************
 ********************************************************************************/

function datesAreOnSameDay(first, second) {
    return (first.getDate() === second.getDate() &&
        first.getMonth() === second.getMonth() &&
        first.getFullYear() === second.getFullYear());
}

function getDateAfterDays(currentDate, days) {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + days);
}

function daysBetween(startDate, endDate) {
    return (treatAsUTC(endDate) - treatAsUTC(startDate)) / 86400000; // millisecondsPerDay = 24 * 60 * 60 * 1000
}

function treatAsUTC(date) {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}




/********************************************************************************
 ********************************** Utility - Viz *******************************
 ********************************************************************************/

function getCircleRadius(zoom, init) {
    return(init / (Math.pow(1.15,18-zoom)));
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
    let logThresholds = Array.from(Array(1+maxLogThreshold*4).keys());
    let thresholds = logThresholds.map(x => Math.pow(1.3, x)/20);
    thresholds.unshift(0.01);

    //console.log(maxThreshold, thresholds);

    return(thresholds);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}











