class MapEventOverlay {
    init = function () {
        this.onPreZoom();

        // Pick the SVG from the map object
        const svg = d3.select("#map").select("svg");

        // Make groups for each type overlay so we can select by them later
        svg.append("g").attr("id", svgGroups.MAP_EVENTS.substr(1));
    }

    onPreZoom = function () {
        App.data.map_events.forEach(d => {
            d.point = projectPoint(d.Latitude, d.Longitude);
        });

        App.data.filtered_map_events.forEach(d => {
            d.point = projectPoint(d.Latitude, d.Longitude);
        });
    }

    onZoomComplete = function () {
        /* update only the position and radius on zoom */
        const radiusMapEvents = getCircleRadius(App.map.getZoom(), initialRadiusValues.MAP_EVENTS);

        d3.select(svgGroups.MAP_EVENTS).selectAll(svgElements.MAP_EVENT_CIRCLES)
            .attr("cx", d => d.point.x)
            .attr("cy", d => d.point.y)
            .attr("r", radiusMapEvents);
    }

    /* update on filter change. Only time should affect this */
    // TODO: only trigger this when a time filter has changed.
    onFilterChanged = function (sliderDragging = false) {
        const svg = d3.select("#map").select("svg");
        const mapEventGroup = d3.select(svgGroups.MAP_EVENTS);

        const t = svg.transition().duration(250);

        const radiusMapEvents = getCircleRadius(App.map.getZoom(), initialRadiusValues.MAP_EVENTS);
        const mapEvents = App.data.filtered_map_events;

        if (sliderDragging) { // don't animate in this case
            mapEventGroup.selectAll(svgElements.MAP_EVENT_CIRCLES)
                .data(mapEvents, d => d.ID)
                .join(
                    enter => enter
                        .append("circle")
                        .attr("class", svgElements.MAP_EVENT_CIRCLES.substr(1))
                        .attr("cx", d => d.point.x)
                        .attr("cy", d => d.point.y)
                        .attr("r", radiusMapEvents)
                        .attr("fill", "#a6cee3")
                        .attr("fill-opacity", "0.85")
                        .attr("stroke", "#333333")
                        .attr("stroke-width", "1px"),
                    update => update,
                    exit => exit.remove()
                );
        } else { // animate
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
    }
    raiseGroup = function () {
        const mapEventGroup = d3.select(svgGroups.MAP_EVENTS);
        mapEventGroup.raise();
    }
}