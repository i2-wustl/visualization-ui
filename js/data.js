const data = {
    init: async () => await processData()
};

async function processData() {
    return Promise.all([
        d3.tsv("data/Patients_COVID_FLU_Apr29.tsv"), // patients
        d3.csv("data/timeline-events.csv"), // timeline events
        d3.csv("data/medical_facilities.csv"), // testing sites
    ]).then(async (files) => {

        Object.assign(data, {
            'patients': files[0],
            'filtered_patients': files[0],
            'timeline_events': files[1],
            'medical_facilities': files[2],
            'filtered_medical_facilities': files[2],
            'map_events': [], // empty for now. Might use it in the future
            'filtered_map_events': [] // empty for now. Might use it in the future
        });

        data.patients.forEach(function (p) {
            p.SAMPLE_COLLECTION_DATE = new Date(p.SAMPLE_COLLECTION_DATE);
            // add uniform random number to lat/long if demo'ing so we don't show patient addresses;
            p.Latitude = Number(p.Latitude) + (Math.random() - 0.5) * 2e-2;
            p.Longitude = Number(p.Longitude) + (Math.random() - 0.5) * 2e-2;
        });

        const startDate = d3.min(data.patients, d => d.SAMPLE_COLLECTION_DATE);

        data.timeline_events.forEach(function (e) {
            e.Date = new Date(e.Date)
        });

        data.medical_facilities.forEach(function (e) {
            e.Date = e.Date === "" ? startDate : new Date(e.Date);
        });

        return data;
    });
}