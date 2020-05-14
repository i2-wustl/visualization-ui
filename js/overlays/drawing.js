/********************************************************************************
 ************************************* Drawing **********************************
 ********************************************************************************/

class DrawingOverlay {
    init = function () {
        // Pick the SVG from the map object
        const svg = d3.select("#map").select("svg");

        // Make groups for each type overlay so we can select by them later
        svg.append("g").attr("id", svgGroups.DRAWING_COMPLETE.substr(1));
        svg.append("g").attr("id", svgGroups.DRAWING.substr(1));
    };

    refresh = function () {
        d3.selectAll(svgElements.DRAWING_PATHS)
            .data(App.drawRegions.features, d => d.properties.ID)
            .join(
                enter => enter
                    .append("path")
                    .attr("class", svgElements.DRAWING_PATHS.substr(1))
                    .attr("d", App.pathCreator)
                    .style("fill", d => d.properties.color)
                    .style("fill-opacity", 0.5),
                update => update,
                exit => exit.remove()
            )
    };


    makeSelectable = function() {
        d3.select(svgGroups.DRAWING_COMPLETE).selectAll(svgElements.DRAWING_PATHS)
            .on("mouseover", this.onMouseOver)
            .on("mouseout", this.onMouseOut)
            .on("click", this.onClick)
    };

    makeUnSelectable = function() {
        d3.select(svgGroups.DRAWING_COMPLETE).selectAll(svgElements.DRAWING_PATHS)
            .on("mouseover", null)
            .on("mouseout", null)
            .on("click", null);
        App.selectedRegion = null;
    };

    unSelectAll = function() {
        d3.select(svgGroups.DRAWING_COMPLETE).selectAll(svgElements.DRAWING_PATHS)
            .classed("selected", false)
            .attr("stroke-width", 0)
    };

    onMouseOver = function() {
        d3.select(d3.event.target)
            .filter(":not(.selected)")
            .attr("stroke-width", 2)
            .attr("stroke", "blue")
    };

    onMouseOut = function() {
        d3.select(d3.event.target)
            .filter(":not(.selected)")
            .attr("stroke-width", 0)
    };

    onClick = function(d, i) {
        // unselect previously selected
        d3.select(svgGroups.DRAWING_COMPLETE).selectAll(svgElements.DRAWING_PATHS)
            .filter(".selected")
            .classed("selected", false)
            .attr("stroke-width", 0)

        // select what we clicked on
        d3.select(d3.event.target)
            .classed("selected", true)
            .attr("stroke-width", 4)
        App.selectedRegion = d;
    };

    /* update only the position and radius on zoom */
    onZoomComplete = function () {
        d3.select(svgGroups.DRAWING).selectAll(svgElements.DRAWING_PATHS)
            .attr("d", App.pathCreator);
        d3.select(svgGroups.DRAWING_COMPLETE).selectAll(svgElements.DRAWING_PATHS)
             .attr("d", App.pathCreator);
    };

    raiseGroup = function () {
        const drawingRegionGroup = d3.select(svgGroups.DRAWING_COMPLETE);
        const currentDrawingGroup = d3.select(svgGroups.DRAWING);
        drawingRegionGroup.raise();
        currentDrawingGroup.raise();
    };
}



