const data = {
    init: async () => await processData()
};

async function processData() {
    return Promise.all([
        d3.tsv("data/patients.tsv"), // patients
        d3.csv("data/timeline-events.csv"), // timeline events
        d3.csv("data/medical-facilities.csv"), // testing sites
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

        [data.startDate, data.endDate] = d3.extent(data.patients, d => d.SAMPLE_COLLECTION_DATE);

        data.timeline_events.forEach(function (e) {
            e.Date = new Date(e.Date)
        });

        data.medical_facilities.forEach(function (e) {
            e.Date = e.Date === "" ? data.startDate : new Date(e.Date);
        });


        //ToDo: create type and cohort overlay configurations with "random" settings for any missing from the configuration
        
        // sanity check on facility types.
        let rowsWithMissingTypes = data.medical_facilities.filter(d => !Object.keys(App.params.medical_facilities).includes(d.Type));
        rowsWithMissingTypes.forEach(d => console.error("Medical facility " + d.ID + " has an unregistered type. An entry for \"" + d.Type + "\" was not found in the overlay configuration."));

        // sanity check on patient cohorts.
        rowsWithMissingTypes = data.patients.filter(d => !Object.keys(App.params.patients).includes(d.COHORT));
        rowsWithMissingTypes.forEach(d => console.error("Patient " + d.ID + " belongs to an unregistered cohort. An entry for \"" + d.COHORT + "\" was not found in the overlay configuration."));


        return data;
    });
}