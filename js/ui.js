/********************************************************************************
 ************************************** GUI *************************************
 ********************************************************************************/
const ui = {
    init: () => {
        initializeControls();
    }
};

function initializeControls() {

    createMedicalFacilityFilters();

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

function createMedicalFacilityFilters() {
    let facilityDiv = d3.select("#facility-filter");
    facilityDiv.append("span").text("Medical Facilities:");

    for (const key in App.params.medical_facilities) {
        let rowDiv = facilityDiv.append("div").attr("class", "sidebar-section-menu-row")
        let label = rowDiv .append("label").attr("class", "switch");

        let input = label.append("input")
            .attr("type", "checkbox")
            .attr("id", key + "-cb")
            .attr("name", key)
            .attr("value", key)
            .attr("checked", true);

        let span = label.append("span")
            .attr("class", "slider round")
            .style("background-color", App.params.medical_facilities[key].fill);

        input.on("change", function () {
                if (d3.select(this).property('checked')) span.style("background-color", App.params.medical_facilities[key].fill);
                else span.style("background-color", "#ccc");

                filters.toggleMedicalFacilities(key, d3.select(this).property('checked'));
            });

        rowDiv.append("span").text(key);
    }
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

