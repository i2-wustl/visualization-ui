class MedicalFacilitiesOverlay {
    init = function () {
        this.onPreZoom();


        // Pick the SVG from the map object
        const svg = d3.select("#map").select("svg");

        // Make groups for each type overlay so we can select by them later
        svg.append("g").attr("id", svgGroups.MEDICAL_FACILITIES.substr(1));
    };

    onPreZoom = function () {
        App.data.medical_facilities.forEach(d => {
            d.point = projectPoint(d.Latitude, d.Longitude);
        });

        App.data.filtered_medical_facilities.forEach(d => {
            d.point = projectPoint(d.Latitude, d.Longitude);
        });

        for (const key in App.params.medical_facilities) {
            App.params.medical_facilities[key].radius = getCircleRadius(App.map.getZoom(), App.params.medical_facilities[key].size);
        }
    };

    /* update only the position and radius on zoom */
    onZoomComplete = function () {
        d3.select(svgGroups.MEDICAL_FACILITIES).selectAll(svgElements.MEDICAL_FACILITIES_CIRCLES)
            .attr("cx", d => d.point.x)
            .attr("cy", d => d.point.y)
            .attr("r", d => App.params.medical_facilities[d.Type].radius);
    };

    /* update on filter change */
    // TODO: only trigger this when a time filter or associated toggle has changed.
    onFilterChanged = function (sliderDragging = false) {
        const svg = d3.select("#map").select("svg");
        const medicalFacilitiesGroup = d3.select(svgGroups.MEDICAL_FACILITIES);

        const t = svg.transition().duration(sliderDragging ? 0 : 250);

        medicalFacilitiesGroup.selectAll(svgElements.MEDICAL_FACILITIES_CIRCLES)
            .data(App.data.filtered_medical_facilities, d => d.ID)
            .join(
                enter => enter
                    .append("circle")
                    .attr("class", svgElements.MEDICAL_FACILITIES_CIRCLES.substr(1))
                    .attr("cx", d => d.point.x)
                    .attr("cy", d => d.point.y)
                    .attr("r", d => App.params.medical_facilities[d.Type].radius)
                    .attr("fill", d => App.params.medical_facilities[d.Type].fill)
                    .attr("fill-opacity", "0.85")
                    .attr("stroke", "#333333")
                    .attr("stroke-width", "1px"),
                update => update,
                exit => exit.call(circles => circles.transition(t).remove().attr("r", 0))
            )
            .call(circles => circles.transition(t)
                .attr("r", d => App.params.medical_facilities[d.Type].radius));
    }

    raiseGroup = function () {
        const hospitalGroup = d3.select(svgGroups.MEDICAL_FACILITIES);
        hospitalGroup.raise();
    }
}
