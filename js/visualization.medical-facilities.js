class MedicalFacilitiesOverlay {
    init = function () {
        this.onPreZoom();


        // Pick the SVG from the map object
        const svg = d3.select("#map").select("svg");

        // Make groups for each type overlay so we can select by them later
        const medicalFacilitiesGroup = svg.append("g").attr("id", svgGroups.MEDICAL_FACILITIES.substr(1));
        // Static and dynamic medical sites are subgroups of the medical sites group.
        // This way we can manipulate them together or separately.
        const staticMedicalSiteGroup = medicalFacilitiesGroup.append("g").attr("id", svgGroups.STATIC_MEDICAL_FACILITIES.substr(1));
        medicalFacilitiesGroup.append("g").attr("id", svgGroups.DYNAMIC_MEDICAL_FACILITIES.substr(1));

        staticMedicalSiteGroup.selectAll(svgElements.MEDICAL_FACILITIES_CIRCLES)
            .data(App.data.static_medical_facilities)
            .enter()
            .append("circle")
            .attr("class", svgElements.MEDICAL_FACILITIES_CIRCLES.substr(1))
            .attr("cx", d => d.point.x)
            .attr("cy", d => d.point.y)
            .attr("r", d => App.params.medical_facilities[d.Type].radius)
            .attr("fill", d => App.params.medical_facilities[d.Type].fill)
            .attr("fill-opacity", "0.85")
            .attr("stroke", "#333333")
            .attr("stroke-width", "1px");
    };

    onPreZoom = function () {
        App.data.static_medical_facilities.forEach(d => {
            d.point = projectPoint(d.Latitude, d.Longitude);
        });

        App.data.dynamic_medical_facilities.forEach(d => {
            d.point = projectPoint(d.Latitude, d.Longitude);
        });

        App.data.filtered_dynamic_medical_facilities.forEach(d => {
            d.point = projectPoint(d.Latitude, d.Longitude);
        });

        for (const key in App.params.medical_facilities) {
            App.params.medical_facilities[key].radius = getCircleRadius(App.map.getZoom(), App.params.medical_facilities[key].initial_size);
        }
    };

    /* update only the position and radius on zoom */
    onZoomComplete = function () {
        const radiusHospitals = getCircleRadius(App.map.getZoom(), initialRadiusValues.HOSPITALS);

        d3.select(svgGroups.MEDICAL_FACILITIES).selectAll(svgElements.MEDICAL_FACILITIES_CIRCLES)
            .attr("cx", d => d.point.x)
            .attr("cy", d => d.point.y)
            .attr("r", d => App.params.medical_facilities[d.Type].radius);
    };

    /* update on filter change. Only time should affect this */
    // TODO: only trigger this when a time filter has changed.
    onFilterChanged = function (sliderDragging = false) {
        const svg = d3.select("#map").select("svg");
        const dynamicMedicalFacilitiesGroup = d3.select(svgGroups.DYNAMIC_MEDICAL_FACILITIES);

        const t = svg.transition().duration(sliderDragging ? 0 : 250);

        const dynamicMedicalFacilities = App.data.filtered_dynamic_medical_facilities;

        dynamicMedicalFacilitiesGroup.selectAll(svgElements.MEDICAL_FACILITIES_CIRCLES)
            .data(dynamicMedicalFacilities, d => d.ID)
            .join(
                enter => enter
                    .append("circle")
                    .attr("class", svgElements.MEDICAL_FACILITIES_CIRCLES.substr(1))
                    .attr("cx", d => d.point.x)
                    .attr("cy", d => d.point.y)
                    .attr("r", 0)
                    .attr("fill", d => App.params.medical_facilities[d.Type].fill)
                    .attr("fill-opacity", "0.85")
                    .attr("stroke", "#333333")
                    .attr("stroke-width", "1px"),
                update => update,
                exit => exit.call(circles => circles.transition(t).remove()
                    .attr("r", 0))
            )
            .call(circles => circles.transition(t)
                .attr("r", d => App.params.medical_facilities[d.Type].radius));
    }

    raiseGroup = function () {
        const hospitalGroup = d3.select(svgGroups.MEDICAL_FACILITIES);
        hospitalGroup.raise();
    }
}
