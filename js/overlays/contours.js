class ContoursOverlay {
    __is2dActive = false;
    __isContoursActive = false;

    get LEGEND_ID() {
        return "contourLegend";
    }

    init = function () {
        // Make groups for each type overlay so we can select by them later
        d3.select("#map").select("svg")
            .append("g")
            .attr("id", svgGroups.CONTOURS.substr(1));

        // Make a group to hold the legend
        let legendSVG = d3.select("#legend")
            .append("svg")
            .attr("id", this.LEGEND_ID);

        legendSVG.append("text")
            .text("Cases per km²")
            .attr("x","50%")
            .attr("y","50px")
            .attr("text-anchor", "middle")

        this.__is2dActive = d3.select("#twod-density-btn").classed("active");
        this.__isContoursActive = d3.select("#contours-btn").classed("active");
    }
    toggle2d = function (isActive) {
        this.__is2dActive = isActive;
        this.refresh();
    }
    toggleContours = function (isActive) {
        this.__isContoursActive = isActive;
        this.refresh();
    }
    refresh = function () {
        /* Used on zoom, pan, and filters because they are recomputed for all cases */
        const contourGroup = d3.select(svgGroups.CONTOURS);

        if (this.__is2dActive || this.__isContoursActive) {
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
                .split("px").slice(0, 2);
            offsetX = Number(offsetX.trim());
            offsetY = Number(offsetY.split(",")[1].trim());

            // Compute pixel bounds of the window plus a buffer. Only patients in this box will be used for computing contours.
            let minPixelX = -offsetX - buffer;
            let minPixelY = -offsetY - buffer;
            let maxPixelX = window.innerWidth - offsetX + buffer;
            let maxPixelY = window.innerHeight - offsetY + buffer;

            // Filter by bounding box
            let patientsOnScreen = App.data.filtered_patients.filter(d =>
                d.point.x >= minPixelX && d.point.x <= maxPixelX && d.point.y >= minPixelY && d.point.y <= maxPixelY
            );

            //patientsOnScreen = patientsOnScreen.slice(0,2);
            //console.log(patientsOnScreen)

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
                .range([0, maxX - minX]);

            let y2densityScale = d3.scaleLinear()
                .domain([minY, maxY])
                .range([0, maxY - minY]);

            // Translate the points
            patientsOnScreen.forEach(d => {
                d.pointDensity = [x2densityScale(d.point.x), y2densityScale(d.point.y)]
            });

            // Choose parameters for computing the contours based on the zoom.
            // These are magic numbers empirically chosen to balance usefulness, aesthetics, and performance.
            // Maybe you can do better, but is it really worth your time?
            let cellSize = App.map.getZoom() > 11 ? Math.pow(2, App.map.getZoom() - 10) : 2;
            let bandwidth = App.map.getZoom() > 11 ? Math.pow(2, App.map.getZoom() - 10) : 4;

            // Compute the density data
            let densityData = density()
                .x(function (d) { return d.pointDensity[0]; })
                .y(function (d) { return d.pointDensity[1]; })
                .size([x2densityScale.range()[1], y2densityScale.range()[1]])
                .cellSize(cellSize)
                .bandwidth(bandwidth)
                .numThresholds(10)
                .isLogScale(true)
                //.maxThresholdValue(1)
                (patientsOnScreen);

            let thresholds = [];
            // Translate the contours back to pixel coordinates used by leaflet
            densityData.forEach(threshold => {
                thresholds.push(threshold.value)
                threshold.coordinates.forEach(contour => {
                    contour.forEach(subcontour => {
                        subcontour.forEach(point => {
                            point[0] = x2densityScale.invert(point[0]);
                            point[1] = y2densityScale.invert(point[1]);
                        })
                    })
                })
            });

            // Prepare a color palette
            const color = d3.scaleSequential([0, densityData.length], d3.interpolateYlGnBu);

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

            if (this.__isContoursActive) {
                densityPath
                    .attr("stroke", "#69b3a2")
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-width", "1px");
            }
            if (this.__is2dActive) {
                densityPath
                    .attr("fill", (d, i) => color(i))
                    .attr("fill-opacity", 0.7)
            }

            let minLatLng = projectPointInverse(minX, minY);
            let nextLatLng = projectPointInverse(minX+1, minY);
            minLatLng = turf.point([minLatLng.lng, minLatLng.lat]);
            nextLatLng = turf.point([nextLatLng.lng, nextLatLng.lat]);

            let distPerPixel = turf.distance(minLatLng, nextLatLng);
            let pixelsPerKm = 1 / distPerPixel;
            let correctionFactor = Math.pow(pixelsPerKm, 2);

            let legend = d3.legendColor()
                .shapeWidth((300.0/thresholds.length) - 3)
                .shapePadding(3)
                .cells(Array.from(Array(thresholds.length).keys()))
                .labels(thresholds.map(x => (x * correctionFactor).toFixed(1)))
                .orient('horizontal')
                .scale(color);

            d3.select("#legend").style("display", "flex");

            d3.select("#" + this.LEGEND_ID).call(legend);

        } else {
            // TODO: don't bother doing this if the contour or 2d-density button wasn't clicked
            contourGroup.selectAll(svgElements.CONTOURS)
                .data([])
                .join(
                    enter => enter,
                    update => update,
                    exit => exit.remove()
                );
            //d3.select("#legend").style("display", "none");
        }

    }
    raiseGroup = function () {
        d3.selectAll(svgGroups.CONTOURS).raise();
    }
}