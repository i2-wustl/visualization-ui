/********************************************************************************
 ************************************** GUI *************************************
 ********************************************************************************/
const ui = {
    init: () => {
        initializeControls();
    }
};

function initializeControls() {

    d3.select("#COVID19-cb").on("click", function () {
        filters.toggleCOVID19(d3.select(this).property('checked'));
    });
    d3.select("#ILI-cb").on("click", function () {
        filters.toggleILI(d3.select(this).property('checked'));
    });
    d3.selectAll('input[name="cases"]').on("change", function () {
        filters.toggleCases(d3.select('input[name="cases"]:checked').node().value);
    });

    d3.select("#dot-density-btn").on("click", function () {
        let btn = d3.select(this);
        let isActive = !btn.classed("active");
        btn.classed("active", isActive);
        visualization.toggleDotDensity(isActive);
    });

    d3.select("#twod-density-btn").on("click", function () {
        let btn = d3.select(this);
        let isActive = !btn.classed("active");
        btn.classed("active", isActive);
        visualization.toggle2dDensityOverlay(isActive);
    });

    d3.select("#contours-btn").on("click", function () {
        let btn = d3.select(this);
        let isActive = !btn.classed("active");
        btn.classed("active", isActive);
        visualization.toggleContourOverlay(isActive);
    });



}

function openControlPanel() {
    document.getElementById("control-sidebar").style.width = "250px";
}

function closeControlPanel() {
    document.getElementById("control-sidebar").style.width = "0";
}

function openChartPanel() {
    document.getElementById("chart-sidebar").style.width = "600px";
}

function closeChartPanel() {
    document.getElementById("chart-sidebar").style.width = "0";
}

