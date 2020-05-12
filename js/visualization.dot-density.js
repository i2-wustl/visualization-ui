class DotDensityOverlay {
    __isActive = false;
    get isActive() {
        return this.__isActive;
    }

    init = function () {
        this.onPreZoom();
        // Pick the SVG from the map object
        const svg = d3.select("#map").select("svg");

        // Make groups for each type overlay so we can select by them later
        svg.append("g").attr("id", svgGroups.PATIENT_DOT_DENSITY.substr(1));

        this.__isActive = d3.select("#dot-density-btn").classed("active");

        App.selected_patient_IDs = new Set();
        // App.drawRegions = turf.featureCollection([]);
    };

    toggle = function (isActive) {
        this.__isActive = isActive;
        onFilterChanged(false);
    };

    onPreZoom = function () {
        //Question: does this need to run for both dotDensity and contours?
        App.data.patients.forEach(d => {
            d.point = projectPoint(d.Latitude, d.Longitude);
        });

        App.data.filtered_patients.forEach(d => {
            d.point = projectPoint(d.Latitude, d.Longitude);
        });

        for (const key in App.params.patients) {
            App.params.patients[key].radius = getCircleRadius(App.map.getZoom(), App.params.patients[key].size);
        }
    };

    onZoomComplete = function () {
        /* update only the position and radius on zoom */
        d3.select(svgGroups.PATIENT_DOT_DENSITY).selectAll(svgElements.PATIENT_CIRCLES)
            .attr("cx", d => d.point.x)
            .attr("cy", d => d.point.y)
            .attr("r", d => App.params.patients[d.COHORT].radius);

    };

    precomputePointsForTurf = function () {
        // create point array
        let points = [];
        App.data.filtered_patients.forEach(d => points.push([+d.Longitude, +d.Latitude]));
        App.data.filtered_patient_points = turf.points(points);
        App.data.filtered_patient_points.features.forEach((d, i) => d.properties.ID = App.data.filtered_patients[i].ID);
    }

    onFilterChanged = function (sliderDragging = false) {
        /* update on filter change. Time, cases, cohorts, */
        const svg = d3.select("#map").select("svg");
        const patientDotDensityGroup = d3.select(svgGroups.PATIENT_DOT_DENSITY);

        const t = svg.transition().duration(sliderDragging ? 0 : 250);

        if (this.__isActive) {
            patientDotDensityGroup.selectAll(svgElements.PATIENT_CIRCLES)
                .data(App.data.filtered_patients, d => d.ID)
                .join(
                    enter => enter
                        .append("circle")
                        .attr("class", svgElements.PATIENT_CIRCLES.substr(1))
                        .attr("cx", d => d.point.x)
                        .attr("cy", d => d.point.y)
                        .attr("r", 0)
                        .attr("fill",  d => App.params.patients[d.COHORT].fill)
                        .attr("fill-opacity",  d => App.params.patients[d.COHORT]["fill-opacity"]),
                    update => update,
                    exit => exit.call(circles => circles.transition(t).remove()
                        .attr("r", 0))
                )
                .call(circles => circles.transition(t)
                    .attr("r",  d => App.params.patients[d.COHORT].radius));

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

        this.precomputePointsForTurf();
        this.updateSelectionsOnFilterChanged();
    };

    updateSelectionsOnFilterChanged = function () {
        const patientDotDensityGroup = d3.select(svgGroups.PATIENT_DOT_DENSITY);

        // App.drawRegions.features.forEach(d => {
        //     // find points within the polygon
        //     let ptsWithin = turf.pointsWithinPolygon(App.data.filtered_patient_points, d);
        //     // create set with selected IDs so we can use them to filter
        //     let selectedIDs = new Set();
        //     ptsWithin.features.forEach(d => selectedIDs.add(d.properties.ID));
        //     // keep track of selected IDs for the region
        //     d.properties.patient_IDs = selectedIDs;
        //     d.properties.selected_patient_IDs = selectedIDs;
        //     // merge selected IDs with those from other regions
        //     App.selected_patient_IDs = new Set([...App.selected_patient_IDs, ...selectedIDs]);
        // })

        if (App.drawing)
            App.drawing.updateSelectedPatientIds();

        // filter patients by selected IDs
        let selected_patients = App.data.filtered_patients.filter(d => App.selected_patient_IDs.has(d.ID));

        patientDotDensityGroup.selectAll(svgElements.PATIENT_CIRCLES)
            .data(selected_patients, d => d.ID)
            .join(
                enter => enter,
                update => update
                    .attr("stroke-width", 1.25)
                    .attr("stroke", "black"),
                exit => exit
                    .attr("stroke-width", 0),
            )
    };

    onSelectionChangedCurrentRegion = function () {
        const patientDotDensityGroup = d3.select(svgGroups.PATIENT_DOT_DENSITY);

        // find points within the polygon
        let ptsWithin = turf.pointsWithinPolygon(App.data.filtered_patient_points, App.drawCurrentRegion);
        // create set with selected IDs so we can use them to filter
        let selectedIDs = new Set();
        ptsWithin.features.forEach(d => selectedIDs.add(d.properties.ID));

        // keep track of selected IDs for the region
        App.drawCurrentRegion.properties.patient_IDs = selectedIDs;
        App.drawCurrentRegion.properties.selected_patient_IDs = selectedIDs;
        // merge selected IDs with those from other regions
        let selected_patient_IDs = new Set([...App.selected_patient_IDs, ...selectedIDs]);
        // filter patients by selected IDs
        let selected_patients = App.data.filtered_patients.filter(d => selected_patient_IDs.has(d.ID));

        patientDotDensityGroup.selectAll(svgElements.PATIENT_CIRCLES)
            .data(selected_patients, d => d.ID)
            .join(
                enter => enter,
                update => update
                    .attr("stroke-width", 1.25)
                    .attr("stroke", "black"),
                exit => exit
                    .attr("stroke-width", 0),
            )
    };

    onSelectionComplete = function () {
        if (App.drawCurrentRegion.properties.selected_patient_IDs)
            App.selected_patient_IDs = new Set([...App.selected_patient_IDs, ...App.drawCurrentRegion.properties.selected_patient_IDs]);
    };

    raiseGroup = function () {
        const patientDotDensityGroup = d3.select(svgGroups.PATIENT_DOT_DENSITY);

        // raise them in the order of the cohort's z-order
        Object.values(App.params.patients).sort((a, b) => a["z-order"] - b["z-order"]).forEach( p => {
            patientDotDensityGroup.selectAll(svgElements.PATIENT_CIRCLES).filter(d => d.COHORT == p.cohort).raise();
        });
    }
}