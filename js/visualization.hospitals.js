class HospitalOverlay {
    init = function () {
        this.onPreZoom();


        // Pick the SVG from the map object
        const svg = d3.select("#map").select("svg");

        // Make groups for each type overlay so we can select by them later
        svg.append("g").attr("id", svgGroups.HOSPITALS.substr(1));
        
        /* the hospitals are always present so we draw them once and only update on zoom */
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

    onPreZoom = function () {
        App.data.hospitals.forEach(d => {
            d.point = projectPoint(d.Latitude, d.Longitude);
        });
    }

    /* update only the position and radius on zoom */
    onZoomComplete = function () {
        const radiusHospitals = getCircleRadius(App.map.getZoom(), initialRadiusValues.HOSPITALS);

        d3.select(svgGroups.HOSPITALS).selectAll(svgElements.HOSPITAL_CIRCLES)
            .attr("cx", d => d.point.x)
            .attr("cy", d => d.point.y)
            .attr("r", radiusHospitals);
    }
    raiseGroup = function () {
        const hospitalGroup = d3.select(svgGroups.HOSPITALS);
        hospitalGroup.raise();
    }
}
