/********************************************************************************
 ************************************* Drawing **********************************
 ********************************************************************************/

class DrawingFeature {
    constructor() {
        let currentRegionID = 0;
        let startPoint;
        let drawMode = drawingMode.NONE;
        App.drawRegions = turf.featureCollection([]);
        let isDraggingOnDraw = false;

        //#region private functions
        function onMouseDown(e) {
            if (e.originalEvent.button == 2) return; // ignore right click

            if (drawMode === drawingMode.BOX ||
                drawMode === drawingMode.INSPECTION_BOX ||
                drawMode === drawingMode.FREE) {
                toggleIsDraggingOnDraw(true);
            }
            if (drawMode === drawingMode.BOX ||
                drawMode === drawingMode.INSPECTION_BOX) {
                startPoint = e.latlng;
                drawBox(startPoint);
            }
        }

        function onMouseMove(e) {
            if (drawMode === drawingMode.BOX ||
                drawMode === drawingMode.INSPECTION_BOX) {
                if (isDraggingOnDraw) {
                    updateBox(e.latlng);
                }
            }
        }

        function onMouseUp(e) {
            if (e.originalEvent.button == 2) return; // ignore right click

            if (isDraggingOnDraw &&
                (drawMode === drawingMode.BOX ||
                    drawMode === drawingMode.INSPECTION_BOX)) {
                finishBox();
            }
            if (drawMode === drawingMode.BOX ||
                drawMode === drawingMode.INSPECTION_BOX ||
                drawMode === drawingMode.FREE) {
                toggleIsDraggingOnDraw(false);
            }

        }

        function drawBox(point) {
            let drawGroup = d3.select(svgGroups.DRAWING);

            // need at least 4 points for a path. Essentially a triangle that ends at itself
            // but we can use the same point 4x
            App.drawCurrentRegion = turf.polygon([Array(4).fill([point.lng, point.lat])]);
            App.drawCurrentRegion.properties.ID = ++currentRegionID;
            App.drawCurrentRegion.properties.color = getRandomColor();

            drawGroup.selectAll(svgElements.DRAWING_PATHS)
                .data([App.drawCurrentRegion], d => d.properties.ID)
                .enter()
                .append("path")
                .attr("class", svgElements.DRAWING_PATHS.substr(1))
                .attr("d", App.pathCreator)
                .style("fill", App.drawCurrentRegion.properties.color)
                .style("fill-opacity", 0.5)
        }

        function updateBox(point) {
            let drawGroup = d3.select(svgGroups.DRAWING);
            let tempColor = App.drawCurrentRegion.properties.color;

            App.drawCurrentRegion = turf.polygon([[
                [startPoint.lng, startPoint.lat],
                [point.lng, startPoint.lat],
                [point.lng, point.lat],
                [startPoint.lng, point.lat],
                [startPoint.lng, startPoint.lat]
            ]]);
            App.drawCurrentRegion.properties.ID = currentRegionID;
            App.drawCurrentRegion.properties.color = tempColor;

            drawGroup.selectAll(svgElements.DRAWING_PATHS)
                .data([App.drawCurrentRegion], d => d.properties.ID)
                .join(
                    enter => enter,
                    update => update
                        .attr("d", App.pathCreator),
                    exit => exit.remove()
                );

            App.visualization.dotDensity.onSelectionChangedCurrentRegion();
            App.visualization.sidebar.refresh();
        }

        function finishBox() {
            let currentBox = d3.select(svgGroups.DRAWING).selectAll(svgElements.DRAWING_PATHS);
            let drawCompleteGroup = d3.select(svgGroups.DRAWING_COMPLETE);

            App.visualization.dotDensity.onSelectionComplete();

            App.drawRegions.features.unshift(App.drawCurrentRegion);
            App.drawCurrentRegion = null;

            currentBox.each(function () { drawCompleteGroup.append(() => this); });


        }

        function deleteAllBoxes() {

            App.drawRegions = turf.featureCollection([]);
            App.selected_patient_IDs.clear();
            App.visualization.drawing.refresh();
            App.visualization.dotDensity.refreshSelections();
        }

        function deleteSelectedBoxes() {
            if (App.selectedRegion) {
                App.selectedRegion.properties.patient_IDs.forEach(d => {
                    App.selected_patient_IDs.delete(d);
                });

                App.drawRegions.features.splice(App.drawRegions.features.indexOf(App.selectedRegion), 1);
                App.selectedRegion = null;

                updateSelectedPatientIds();
                App.visualization.sidebar.refresh();
                App.visualization.drawing.refresh();
                App.visualization.dotDensity.refreshSelections();
            }
        }

        function updateSelectedPatientIds() {
            let selectedIDs = new Set();
            App.drawRegions.features.forEach(d => {
                // find points within the polygon
                let ptsWithin = turf.pointsWithinPolygon(App.data.filtered_patient_points, d);
                // create set with selected IDs so we can use them to filter

                ptsWithin.features.forEach(d => selectedIDs.add(d.properties.ID));
                // keep track of selected IDs for the region
                d.properties.patient_IDs = selectedIDs;
                d.properties.selected_patient_IDs = selectedIDs;
                // merge selected IDs with those from other regions

            });
            App.selected_patient_IDs = new Set([...App.selected_patient_IDs, ...selectedIDs]);

        }

        function toggleDraggable(isDraggable) {
            if (App.map && App.map.dragging)
                isDraggable ? App.map.dragging.enable() : App.map.dragging.disable();
        }

        function setDrawMode(mode) {
            drawMode = mode;

            switch (drawMode) {
                case drawingMode.NONE:
                    toggleDraggable(true);
                    App.visualization.drawing.makeUnSelectable();
                    App.visualization.drawing.unSelectAll();
                    d3.select("#map").classed("drawing", false);
                    break;
                case drawingMode.SELECT:
                    toggleDraggable(true);
                    App.visualization.drawing.makeSelectable();
                    d3.select("#map").classed("drawing", false);
                    break;
                default:
                    toggleDraggable(false);
                    App.visualization.drawing.makeUnSelectable();
                    App.visualization.drawing.unSelectAll();
                    d3.select("#map").classed("drawing", true);
            }
        }

        function toggleIsDraggingOnDraw(isDragging) {
            isDraggingOnDraw = isDragging;
            App.visualization.toggleScrollWheelZoomable(!isDragging);
        }
        //#endregion

        //#region public api

        this.init = () => {

            setDrawMode(drawingMode.NONE);
            toggleIsDraggingOnDraw(false);

            // handle click events for draw mode
            if (App.map) {
                App.map.on('mousedown', onMouseDown);
                App.map.on('mousemove', onMouseMove);
                App.map.on('mouseup', onMouseUp);
            }
            else {
                console.warn('map not initialized');
            }

        };



        this.updateSelectedPatientIds = updateSelectedPatientIds;
        //#endregion


        //#region event handlers

        d3.select("#draw-box-btn").on("click", function () {
            let btn = d3.select(this);
            let isActive = !btn.classed("active");
            btn.classed("active", isActive);
            //toggleDrawBox(isActive);
            setDrawMode(isActive ? drawingMode.BOX : drawingMode.NONE);

            d3.select("#select-region-btn").classed("active", false);
        });

        d3.select("#select-region-btn").on("click", function () {
            let btn = d3.select(this);
            let isActive = !btn.classed("active");
            btn.classed("active", isActive);
            //toggleSelect(isActive);
            setDrawMode(isActive ? drawingMode.SELECT : drawingMode.NONE);

            d3.select("#draw-box-btn").classed("active", false);
        });

        d3.select("#clear-poly-btn").on("click", function () {
            deleteAllBoxes();
            //deleteSelectedBoxes();
        });

        // TODO this is a terrible way to do this. We need a way to register event handlers with the app so
        // different parts can listen to the same event.
        d3.select("body").on("keydown", function() {
            if (App.selectedRegion) {
                if( d3.event.keyCode === 8 || d3.event.keyCode === 46 ) {
                    deleteSelectedBoxes();
                }

            }
        });

        //#endregion


    }
}
