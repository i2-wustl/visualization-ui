class TopoJSONOverlay {
    get LAYER_ID() {
        return "topjsonGroup";
    }

    init = function () {
        this.onPreZoom();

        // Pick the SVG from the map object
        const svg = d3.select("#map").select("svg");

        // Make groups for each type overlay so we can select by them later
        const group = svg.append("g").attr("id", this.LAYER_ID);


        //NOTE: WIP stopped here due to shifting priorities. I left this code as a reference only.
        // // d3.json('/topo.json', function (error, topology) {
        // //     if (error) throw error;

        // //     var geojson = topojson.feature(topology, topology.objects.tl_2019_17_tract.geo);

        // //     svg.selectAll("path")
        // //         .data(geojson.features)
        // //         .enter().append("path")
        // //         .attr("d", App.pathCreator);

        // // }).then(topology => {
        // //     var geojson = topojson.feature(topology, topology.objects['tl_2019_17_tract.geo']);

        // //     // Join the FeatureCollection's features array to path elements
        // //     var u = group
        // //         .selectAll('path')
        // //         .data(geojson.features);

        // //     // Create path elements and update the d attribute using the geo generator
        // //     u.enter()
        // //         .append('path')
        // //         .attr('d', App.pathCreator);


        // //     //Note: this is supported in newer versions of the API
        // //     //L.geoJSON(geojson.features).addTo(App.map);

        // // });

    };

    onPreZoom = function () {

    };

    /* update only the position and radius on zoom */
    onZoomComplete = function () {

    };

    /* update on filter change */
    onFilterChanged = function (sliderDragging = false) {

    }

    raiseGroup = function () {
        const group = d3.select(this.LAYER_ID);
        group.raise();
    }
}
