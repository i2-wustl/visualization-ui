const data = {
    init: async () => await processData()
};

async function processData() {
    return Promise.all([
        d3.tsv("data/COVID19_032720_06Apr2020_125828336197.tsv"), // patients
        d3.tsv("data/hospitals_06Apr2020_152920809709.tsv"), // hospitals
        d3.csv("data/timeline-events.csv"), // timeline events
        d3.csv("data/map_events.csv"), // map events
        //d3.csv("data/test.csv"),
    ]).then(async (files) => {

        Object.assign(data, {
            'patients': files[0],
            'filtered_patients': files[0],
            'hospitals': files[1],
            'timeline_events': files[2],
            'map_events': files[3],
            'filtered_map_events': files[3]
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

        data.map_events.forEach(function (e) {
            e.Date = new Date(e.Date)
        });

        return data;
    });
}