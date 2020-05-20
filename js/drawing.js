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
        const drawingButtonIDs = {
            SELECT: "#select-region-btn",
            BOX: "#draw-box-btn",
            FREE: "#free-draw-btn",
        };

        //#region private functions
        function onMouseDown(e) {
            if (e.originalEvent.button === 2 || App.zooming) return; // ignore right click

            startPoint = e.latlng;

            if (drawMode === drawingMode.BOX ||
                drawMode === drawingMode.INSPECTION_BOX ||
                drawMode === drawingMode.FREE ||
                drawMode === drawingMode.SELECT) {
                toggleIsDraggingOnDraw(true);
            }
            if (drawMode === drawingMode.BOX ||
                drawMode === drawingMode.INSPECTION_BOX) {
                drawBox(startPoint);
            }
            else if (drawMode === drawingMode.FREE) {
                drawFree(startPoint);
            }
            else if (drawMode === drawingMode.SELECT &&
                    App.selectedRegion &&
                    turf.booleanPointInPolygon(turf.point([startPoint.lng, startPoint.lat]), App.selectedRegion)) {
                setDrawMode(drawingMode.MOVING)
            }
        }

        function onMouseMove(e) {
            if (drawMode === drawingMode.BOX ||
                drawMode === drawingMode.INSPECTION_BOX) {
                if (isDraggingOnDraw) {
                    updateBox(e.latlng);
                }
            }
            else if (drawMode === drawingMode.FREE) {
                if (isDraggingOnDraw) {
                    updateFree(e.latlng);
                }
            } else if (drawMode === drawingMode.MOVING) {
                if (isDraggingOnDraw) {
                    moveSelectedRegion(startPoint, e.latlng);
                    startPoint = e.latlng;
                }
            }
        }

        function onMouseUp(e) {
            if (e.originalEvent.button === 2 || App.zooming) return; // ignore right click

            if (isDraggingOnDraw) {
                if (drawMode === drawingMode.BOX ||
                    drawMode === drawingMode.INSPECTION_BOX) {
                    finishBox();
                } else if (drawMode === drawingMode.FREE) {
                    finishFree();
                } else if (drawMode === drawingMode.MOVING) {
                    setDrawMode(drawingMode.SELECT);
                }
            }
            if (drawMode === drawingMode.BOX ||
                drawMode === drawingMode.INSPECTION_BOX ||
                drawMode === drawingMode.FREE ||
                drawMode === drawingMode.SELECT) {
                toggleIsDraggingOnDraw(false);
            }
        }
        function getNextColor(init_chroma, init_luminance, initial_hue, num_divisions, i) {
            const cycle = Math.floor(i / num_divisions);
            const step = i % num_divisions;
            const huePerStep = 360.0 / num_divisions;
        
            let hueOffsetForCycleGroup = 0, distBetweenOffsets = 0, offsetCycleInGroup = 0;
            if (cycle > 0 ) {
                const group = Math.floor(Math.log2(cycle))+1;
                const groupSquared = Math.pow(2, group);
                hueOffsetForCycleGroup = huePerStep / groupSquared;
                distBetweenOffsets = hueOffsetForCycleGroup * 2;
                const cycleInGroup = cycle - (groupSquared/2);
                const offsetStepSize = Math.floor(groupSquared/4) === 1 ? 1 : 1 + Math.floor(groupSquared/4);
                offsetCycleInGroup = (cycleInGroup * offsetStepSize) % (groupSquared/2);
            }
        
            const firstHueInCycle = hueOffsetForCycleGroup + (distBetweenOffsets * offsetCycleInGroup);
        
            const hue = initial_hue + firstHueInCycle + (huePerStep * step);
        
            const clCycle = (cycle % 5);
        
            return chroma({ l:(init_luminance-(clCycle*(0.05)))*100, c:(init_chroma-(clCycle*(0.05)))*100, h:hue });
            //return chroma({ l:lightness*100, c:saturation*100, h:hue });
            //return d3.hsl(hue, saturation, lightness)
        }
        
        function drawFree(point) {
            let drawGroup = d3.select(svgGroups.DRAWING);

            // need at least 4 points for a path. Essentially a triangle that ends at itself
            // but we can use the same point 4x
            App.drawCurrentRegion = turf.point([point.lng, point.lat]);
            App.drawCurrentRegion.properties.ID = ++currentRegionID;
            App.drawCurrentRegion.properties.color = getNextColor(0.75, 0.75, 0, 3, currentRegionID-1);

            drawGroup.selectAll(svgElements.DRAWING_PATHS)
                .data([App.drawCurrentRegion], d => d.properties.ID)
                .enter()
                .append("path")
                .attr("class", svgElements.DRAWING_PATHS.substr(1))
                .attr("d", App.pathCreator)
                .attr("stroke", App.drawCurrentRegion.properties.color)
                .attr("stroke-width", 4)
                .attr("fill", "none");
        }

        function updateFree(point) {
            let drawGroup = d3.select(svgGroups.DRAWING);
            let tempColor = App.drawCurrentRegion.properties.color;

            if (App.drawCurrentRegion.geometry.type === "Point") {
                App.drawCurrentRegion = turf.lineString([App.drawCurrentRegion.geometry.coordinates, [point.lng, point.lat]]);
                App.drawCurrentRegion.properties.ID = currentRegionID;
                App.drawCurrentRegion.properties.color = tempColor;
            } else {
                App.drawCurrentRegion.geometry.coordinates.push([point.lng, point.lat]);
            }

            drawGroup.selectAll(svgElements.DRAWING_PATHS)
                .data([App.drawCurrentRegion], d => d.properties.ID)
                .join(
                    enter => enter,
                    update => update
                        .attr("d", App.pathCreator),
                    exit => exit.remove()
                );

        }

        function finishFree() {
            if (App.drawCurrentRegion.geometry.type === "Point" || App.drawCurrentRegion.geometry.coordinates.length < 2) {
                d3.select(svgGroups.DRAWING).selectAll(svgElements.DRAWING_PATHS).remove();
                App.drawCurrentRegion = null;
                return;
            }

            let drawGroup = d3.select(svgGroups.DRAWING);
            let tempColor = App.drawCurrentRegion.properties.color;
            let options = {tolerance: 1e-5, highQuality: true};

            App.drawCurrentRegion.geometry.coordinates.push([startPoint.lng, startPoint.lat]);
            App.drawCurrentRegion = turf.simplify(turf.polygon([App.drawCurrentRegion.geometry.coordinates]), options);
            App.drawCurrentRegion.properties.ID = currentRegionID;
            App.drawCurrentRegion.properties.color = tempColor;

            drawGroup.selectAll(svgElements.DRAWING_PATHS)
                .data([App.drawCurrentRegion], d => d.properties.ID)
                .join(
                    enter => enter,
                    update => update
                        .attr("d", App.pathCreator)
                        .attr("stroke-width", 0)
                        .attr("fill", App.drawCurrentRegion.properties.color)
                        .attr("fill-opacity", 0.5),
                    exit => exit.remove()
                );

            let currentBox = d3.select(svgGroups.DRAWING).selectAll(svgElements.DRAWING_PATHS);
            let drawCompleteGroup = d3.select(svgGroups.DRAWING_COMPLETE);

            App.visualization.dotDensity.onSelectionChangedCurrentRegion();
            App.visualization.dotDensity.onSelectionComplete();

            App.drawRegions.features.unshift(App.drawCurrentRegion);
            App.drawCurrentRegion = null;

            currentBox.each(function () { drawCompleteGroup.append(() => this); });

            App.visualization.sidebar.refresh();
        }


        function drawBox(point) {
            let drawGroup = d3.select(svgGroups.DRAWING);

            // need at least 4 points for a path. Essentially a triangle that ends at itself
            // but we can use the same point 4x
            App.drawCurrentRegion = turf.polygon([Array(4).fill([point.lng, point.lat])]);
            App.drawCurrentRegion.properties.ID = ++currentRegionID;
            App.drawCurrentRegion.properties.color = getNextColor(0.75, 0.75, 0, 3, currentRegionID-1);

            drawGroup.selectAll(svgElements.DRAWING_PATHS)
                .data([App.drawCurrentRegion], d => d.properties.ID)
                .enter()
                .append("path")
                .attr("class", svgElements.DRAWING_PATHS.substr(1))
                .attr("d", App.pathCreator)
                .attr("fill", App.drawCurrentRegion.properties.color)
                .attr("fill-opacity", 0.5)
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

        function moveSelectedRegion(startPoint, endPoint) {
            let diffX = endPoint.lng - startPoint.lng;
            let diffY = endPoint.lat - startPoint.lat;
            App.selectedRegion.geometry.coordinates.forEach(path => {
                path.forEach(d => {
                    d[0] += diffX;
                    d[1] += diffY;
                });
            });
            updateSelectedPatientIdsAfterRegionChange(App.selectedRegion);
            App.visualization.sidebar.refresh();
            App.visualization.drawing.refresh();
            App.visualization.dotDensity.refreshSelections();
        }

        function deleteAllBoxes() {
            App.drawRegions = turf.featureCollection([]);
            App.selected_patient_IDs.clear();
            App.visualization.sidebar.refresh();
            App.visualization.drawing.refresh();
            App.visualization.dotDensity.refreshSelections();

            // no point in selecting when all the regions are gone, make the user's life easier
            if (drawMode === drawingMode.SELECT) {
                setDrawMode(drawingMode.NONE);
            }
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

                // no point in selecting when all the regions are gone, make the user's life easier
                if (App.drawRegions.features.length === 0) {
                    setDrawMode(drawingMode.NONE);
                }
            }
        }

        function updateSelectedPatientIdsForRegion(region) {
            let selectedIDs = new Set();
            // find points within the polygon
            let ptsWithin = turf.pointsWithinPolygon(App.data.filtered_patient_points, region);
            // create set with selected IDs so we can use them to filter

            ptsWithin.features.forEach(d => selectedIDs.add(d.properties.ID));
            // keep track of selected IDs for the region
            region.properties.patient_IDs = selectedIDs;
            region.properties.selected_patient_IDs = selectedIDs;
        }

        function updateSelectedPatientIdsAfterRegionChange(region) {
            // remove selected IDs from global list if they aren't selected by any other region
            region.properties.selected_patient_IDs.forEach(d => {
                let isSelectedByOtherRegion = false;
                App.drawRegions.features.forEach(r => {
                    if (r !== region && r.properties.selected_patient_IDs.has(d)) {
                        isSelectedByOtherRegion = true;
                    }
                })
                if (!isSelectedByOtherRegion) {
                    App.selected_patient_IDs.delete(d);
                }
            });
            updateSelectedPatientIdsForRegion(region);
            region.properties.selected_patient_IDs.forEach(d => App.selected_patient_IDs.add(d));
        }

        function updateSelectedPatientIds() {
            App.selected_patient_IDs.clear();

            App.drawRegions.features.forEach(d => {
                updateSelectedPatientIdsForRegion(d);
                // merge selected IDs with those from other regions
                App.selected_patient_IDs = new Set([...App.selected_patient_IDs, ...d.properties.selected_patient_IDs]);
            });

        }

        function toggleDraggable(isDraggable) {
            if (App.map && App.map.dragging)
                isDraggable ? App.map.dragging.enable() : App.map.dragging.disable();
        }

        function setDrawMode(mode) {
            drawMode = mode;

            toggleNotificationBar();

            switch (drawMode) {
                case drawingMode.NONE:
                    toggleDraggable(true);
                    toggleActiveButton();
                    App.visualization.drawing.makeUnSelectable();
                    App.visualization.drawing.unSelectAll();
                    d3.select("#map").classed("drawing", false);
                    break;
                case drawingMode.SELECT:
                    toggleDraggable(true);
                    toggleActiveButton(drawingButtonIDs.SELECT);
                    App.visualization.drawing.makeSelectable();
                    d3.select("#map").classed("drawing", false);
                    break;
                case drawingMode.MOVING:
                    toggleDraggable(false);
                    App.visualization.drawing.makeOthersUnSelectable();
                    d3.select("#map").classed("drawing", false);
                    break;
                case drawingMode.BOX:
                    toggleDraggable(false);
                    toggleActiveButton(drawingButtonIDs.BOX);
                    App.visualization.drawing.makeUnSelectable();
                    App.visualization.drawing.unSelectAll();
                    d3.select("#map").classed("drawing", true);
                    break;
                case drawingMode.FREE:
                    toggleDraggable(false);
                    toggleActiveButton(drawingButtonIDs.FREE);
                    App.visualization.drawing.makeUnSelectable();
                    App.visualization.drawing.unSelectAll();
                    d3.select("#map").classed("drawing", true);
                    break;
                default:
            }
        }

        function toggleActiveButton(activeButtonID = "") {
            for (const key in drawingButtonIDs) {
                d3.select(drawingButtonIDs[key]).classed("active", drawingButtonIDs[key] === activeButtonID);
            }
        }

        function toggleNotificationBar() {
            let notificationBar = d3.select("#drawing-tooltip-bar");

            switch (drawMode) {
                case drawingMode.NONE:
                    notificationBar.style("visibility", "hidden")
                    break;
                case drawingMode.SELECT:
                    notificationBar.style("visibility", "visible")
                    notificationBar.selectAll("p").style("display", "none");
                    d3.select("#drawing-tooltip-select").style("display", "block");
                    break;
                case drawingMode.BOX:
                    notificationBar.style("visibility", "visible")
                    notificationBar.selectAll("p").style("display", "none");
                    d3.select("#drawing-tooltip-box").style("display", "block");
                    break;
                case drawingMode.FREE:
                    notificationBar.style("visibility", "visible")
                    notificationBar.selectAll("p").style("display", "none");
                    d3.select("#drawing-tooltip-free").style("display", "block");
                    break;
                default:
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

        d3.select("#free-draw-btn").on("click", function () {
            let isActive = !d3.select(this).classed("active");
            setDrawMode(isActive ? drawingMode.FREE : drawingMode.NONE);
        });

        d3.select("#draw-box-btn").on("click", function () {
            let isActive = !d3.select(this).classed("active");
            setDrawMode(isActive ? drawingMode.BOX : drawingMode.NONE);
        });

        d3.select("#select-region-btn").on("click", function () {
            let isActive = !d3.select(this).classed("active");
            setDrawMode(isActive ? drawingMode.SELECT : drawingMode.NONE);
        });

        d3.select("#clear-poly-btn").on("click", function () {
            deleteAllBoxes();
        });

        // TODO this is a terrible way to do this. We need a way to register event handlers with the app so
        // different parts can listen to the same event.
        d3.select("body").on("keydown", function() {
            if (App.selectedRegion) {
                if (d3.event.keyCode === 8 || d3.event.keyCode === 46) {
                    deleteSelectedBoxes();
                }
            }
            if (d3.event.keyCode === 27) {
                setDrawMode(drawingMode.NONE)
            }
        });

        //#endregion


    }
}
