const data = {
    init: async () => await processData()
};

async function processData() {
    return Promise.all([
        d3.tsv("data/COVID19_032720_06Apr2020_125828336197.tsv"), // patients
        d3.csv("data/timeline-events.csv"), // timeline events
        d3.csv("data/medical_facilities.csv"), // testing sites
    ]).then(async (files) => {

        Object.assign(data, {
            'patients': files[0],
            'filtered_patients': files[0],
            'timeline_events': files[1],
            'static_medical_facilities': files[2].filter(d => d.Date === ""),
            'dynamic_medical_facilities': files[2].filter(d => d.Date !== ""),
            'filtered_dynamic_medical_facilities': files[2].filter(d => d.Date !== ""),
            'map_events': [], // empty for now. Might use it in the future
            'filtered_map_events': [] // empty for now. Might use it in the future
        });

        data.patients.forEach(function (p) {
            p.ENC_DATE = new Date(p.ENC_DATE);
            p.COVID19 = p.COVID19 === "TRUE"
            // add uniform random number to lat/long if demo'ing so we don't show patient addresses;
            p.Latitude = Number(p.Latitude) + (Math.random() - 0.5) * 2e-2;
            p.Longitude = Number(p.Longitude) + (Math.random() - 0.5) * 2e-2;
        });

        data.timeline_events.forEach(function (e) {
            e.Date = new Date(e.Date)
        });

        data.dynamic_medical_facilities.forEach(function (e) {
            e.Date = new Date(e.Date)
        });

        return data;
    });
}