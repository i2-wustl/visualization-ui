
/********************************************************************************
 ************************************* Charts ***********************************
 ********************************************************************************/

class Charts {
    init = function() {

        var timeHist = this.tsHistogramChart()
            .x("SAMPLE_COLLECTION_DATE");
            .color("#888888");

        d3.select("#populationCharts")
            .append("p")
            .html("Population-Level Information")

        d3.select("#populationCharts")
            .append("div")
            .attr("id", "popHist1")
            .datum(App.data.filtered_patients)
            .call(timeHist);

        var ageHist = this.numericalHistogramChart()
            .x("AGE")
            .binSize(5)
            .color("#888888");

        d3.select("#populationCharts")
            .append("div")
            .attr("id", "popHist2")
            .datum(App.data.filtered_patients)
            .call(ageHist);

        var genderHist = this.categoricalHistogramChart()
            .x("GENDER")
            .color("#888888");

        d3.select("#populationCharts")
            .append("div")
            .attr("id", "popHist3")
            .datum(App.data.filtered_patients)
            .call(genderHist);

        // get selected patients
        if (App.drawCurrentRegion) {
            let selected_patients = App.data.filtered_patients.filter(d => App.drawCurrentRegion.properties.patient_IDs.has(d.ID))

            var ageHistCurrentRegion = this.numericalHistogramChart()
                .color(App.drawCurrentRegion.properties.color)
                .x("AGE")
                .binSize(5);

            var currentRegionAgeDiv = d3.select("#regionAgeCharts")
                .append("div")
                .attr("id", "age_hist_region_current")

            currentRegionAgeDiv
                .append("p")
                .html("Last Selected Region Information")

            currentRegionAgeDiv
                .datum(selected_patients)
                .call(ageHistCurrentRegion);
        }

        if (App.drawRegions) {
            if (App.drawRegions.features.length > 0) {
                d3.select("#regionAgeCharts")
                        .append("p")
                        .html((App.drawCurrentRegion ? "Other " : "") + "Regional Age Distributions")
            }

            App.drawRegions.features.forEach(region => {
                let selected_patients = App.data.filtered_patients.filter(d => region.properties.patient_IDs.has(d.ID))

                var ageHistDrawnRegion = this.numericalHistogramChart()
                    .color(region.properties.color)
                    .x("AGE")
                    .binSize(5);

                var regionAgeDiv = d3.select("#regionAgeCharts")
                    .append("div")
                    .attr("id", "age_hist_region_" + region.ID)

                regionAgeDiv
                    .datum(selected_patients)
                    .call(ageHistDrawnRegion);
            })
        }


    }

    refresh = function() {
        d3.select("#populationCharts").html("")
        d3.select("#regionTimeCharts").html("")
        d3.select("#regionAgeCharts").html("")
        d3.select("#regionRaceCharts").html("")
        d3.select("#regionGenderCharts").html("")

        this.init();
    }

    tsHistogramChart = function() {
        var margin = {top: 20, right: 20, bottom: 20, left: 40},
            width = 560 - margin.left - margin.right,
            height = 150 - margin.top - margin.bottom,
            xScale = d3.scaleTime(),
            yScale = d3.scaleLinear(),
            x,
            y;
    
        function my(selection) {
            selection.each(function(data) {

                if (data.length == 0) return;

                var svg = d3.select(this)
                    .selectAll("svg")
                    .data([data]);
                    
                var gEnter = svg.enter()
                    .append("svg")
                .attr("width", width + (margin.left + margin.right))
                .attr("height", height + (margin.top + margin.bottom))
                    .append("g")
                .attr("class", "container")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
                gEnter.append("g").attr("class", "x axis");
                gEnter.append("g").attr("class", "y axis");
    
                xScale
                    .domain(d3.extent(data, function(d) {  return d[x]; }))
                    .rangeRound([0, width]);
    
                var histogram = d3.histogram()
                    .value(function(d) { return d[x]; })
                    .domain(xScale.domain())
                    .thresholds(xScale.ticks(d3.timeWeek));
    
                var bins = histogram(data);
    
                yScale
                    .domain([0, d3.max(bins, function(d) { return d.length; })])
                    .range([height, 0]);
    
                var chart = gEnter.append("g").attr("class", "histogram");
    
                var bars = chart.selectAll(".bar")
                    .data(bins)
                    .enter().append("g")
                    .attr("class", "bar")
                    .attr("transform", function(d) { return "translate(" + (bins.length > 1 ? xScale(d.x0) : 0) + "," + yScale(d.length) + ")"; });
    
                var rects = bars.append("rect")
                    .attr("x", 1)
                    .attr("width", function(d) { return bins.length > 1 ? xScale(d.x1) - xScale(d.x0) - 1 : 2*xScale(d.x1); })
                    .attr("height", function(d) { return height - yScale(d.length); })
                    .attr("fill", color);
    
                gEnter.select(".x.axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(xScale));
    
                gEnter.select(".y.axis")
                    .call(d3.axisLeft(yScale));
    
                bars.exit().remove();
            });
        }
    
        my.x = function (_){
            return arguments.length ? (x = _, my) : x;
        };
        
        my.y = function (_){
            return arguments.length ? (y = _, my) : y;
        };
        
        my.width = function (_){
            return arguments.length ? (width = _, my) : width;
        };
        
        my.height = function (_){
            return arguments.length ? (height = _, my) : height;
        };

        my.color = function (_){
            return arguments.length ? (color = _, my) : color;
        }

        return my;
    }
    
    numericalHistogramChart = function() {
        var margin = {top: 20, right: 20, bottom: 20, left: 40},
            width = 560 - margin.left - margin.right,
            height = 150 - margin.top - margin.bottom,
            xScale = d3.scaleLinear(),
            yScale = d3.scaleLinear(),
            x,
            y,
            color,
            binSize;

        function my(selection) {
            selection.each(function(data) {
                if (data.length == 0) return;

                var svg = d3.select(this)
                    .selectAll("svg")
                    .data([data]);
                    
                var gEnter = svg.enter()
                    .append("svg")
                .attr("width", width + (margin.left + margin.right))
                .attr("height", height + (margin.top + margin.bottom))
                    .append("g")
                .attr("class", "container")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
                gEnter.append("g").attr("class", "x axis");
                gEnter.append("g").attr("class", "y axis");

                let extentData = d3.extent(data, function(d) {  return +d[x]; })
                // nice-ify data
                extentData[0] = Math.floor( extentData[0]/binSize)*binSize;
                extentData[1] = Math.ceil( (extentData[1]+1)/binSize)*binSize;

                xScale
                    .domain(extentData)
                    .rangeRound([0, width]);
        
                var histogram = d3.histogram()
                    .value(d => +d[x])
                    .domain(xScale.domain())
                    .thresholds(xScale.ticks((d3.max(xScale.domain()) - d3.min(xScale.domain()))/5));
    
                var bins = histogram(data);
    
                yScale
                    .domain([0, d3.max(bins, function(d) { return d.length; })])
                    .range([height, 0]);
    
                var chart = gEnter.append("g").attr("class", "histogram");
    
                var bars = chart.selectAll(".bar")
                    .data(bins)
                    .enter().append("g")
                    .attr("class", "bar")
                    .attr("transform", function(d) { return "translate(" + (bins.length > 1 ? xScale(d.x0) : xScale(d.x0)/2) + "," + yScale(d.length) + ")"; });
    
                var rects = bars.append("rect")
                    .attr("x", 1)
                    .attr("width", function(d) { return getBinWidth(bins.length, d.x0, d.x1, xScale, d); })
                    .attr("height", function(d) { return height - yScale(d.length); })
                    .attr("fill", color);
    
                gEnter.select(".x.axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(xScale));
    
                gEnter.select(".y.axis")
                    .call(d3.axisLeft(yScale));
    
                bars.exit().remove();
            });
        }

        function getBinWidth(numBins, x0, x1, xScale, d) {
            if (numBins > 1) {
                if (x0 === x1) { // should be an empty last bin
                    // shouldn't need this or even to pass in "d", but I'm not certain, so leave this just in case.
                    if (d.length > 0) console.log("WARNING! Histogram bar with 0 width has", d.length, "entries!");
                    return 0;
                } else { // normal case
                    return xScale(x1) - xScale(x0) - 1;
                }
            } else { // just 1 bin. give it's full width and we'll translate it to the center
                return xScale(x1);
            }
        }

        my.x = function (_){
            return arguments.length ? (x = _, my) : x;
        };
        
        my.y = function (_){
            return arguments.length ? (y = _, my) : y;
        };
        
        my.width = function (_){
            return arguments.length ? (width = _, my) : width;
        };
        
        my.height = function (_){
            return arguments.length ? (height = _, my) : height;
        };

        my.color = function (_){
            return arguments.length ? (color = _, my) : color;
        };

        my.binSize = function (_){
            return arguments.length ? (binSize = _, my) : binSize;
        };

        return my;
    }

    categoricalHistogramChart = function() {
        var margin = {top: 20, right: 20, bottom: 20, left: 40},
            width = 560 - margin.left - margin.right,
            height = 150 - margin.top - margin.bottom,
            xScale = d3.scaleBand(),
            yScale = d3.scaleLinear(),
            x,
            y,
            color;
    
        function my(selection) {
            selection.each(function(data) {
                if (data.length == 0) return;

                var dataModified = d3.nest()
                    .key(d => d[x])
                    .rollup(v => v.length)
                    .entries(data);

                var svg = d3.select(this)
                    .selectAll("svg")
                    .data([dataModified]);
                    
                var gEnter = svg.enter()
                    .append("svg")
                .attr("width", width + (margin.left + margin.right))
                .attr("height", height + (margin.top + margin.bottom))
                    .append("g")
                .attr("class", "container")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
                gEnter.append("g").attr("class", "x axis");
                gEnter.append("g").attr("class", "y axis");

                function convert(n) {
                    var order = Math.floor(Math.log(n) / Math.LN10
                                       + 0.000000001); // because float math sucks like that
                    var raised = Math.pow(10, order);
                    var firstDigit = parseInt(('' + n)[0]);
                    var newMax = raised * (firstDigit + 1);

                    return newMax;
                }
    
                xScale
                    .domain(dataModified.map(d => d.key))
                    .rangeRound([0, width])
                    .paddingInner(0.05);
    
                yScale
                    .domain([0, convert(d3.max(dataModified, d => d.value))])
                    .rangeRound([height, 0]);
    
                var chart = gEnter.append("g").attr("class", "histogram");
    
                var bars = chart.selectAll(".bar")
                    .data(dataModified)
                    .enter().append("g")
                    .attr("class", "bar")
                    .attr("transform", function(d) { return "translate(" + xScale(d.key) + "," + yScale(d.value) + ")"; });
    
                var rects = bars.append("rect")
                    .attr("x", 1)
                    // .attr("x", function(d) { return xScale(d.key); })
                    // .attr("x", function(d) { return xScale(d.key); })
                    .attr("width", function(d) { return xScale.bandwidth(); })
                    .attr("height", function(d) { return height - yScale(d.value); })
                    .attr("fill", color);
    
                gEnter.select(".x.axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(xScale));
    
                gEnter.select(".y.axis")
                    .call(d3.axisLeft(yScale));
    
                bars.exit().remove();
            });
        }
    
        my.x = function (_){
            return arguments.length ? (x = _, my) : x;
        };
        
        my.y = function (_){
            return arguments.length ? (y = _, my) : y;
        };
        
        my.width = function (_){
            return arguments.length ? (width = _, my) : width;
        };
        
        my.height = function (_){
            return arguments.length ? (height = _, my) : height;
        };

        my.color = function (_){
            return arguments.length ? (color = _, my) : color;
        }

        return my;
    }
}
