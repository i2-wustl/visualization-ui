class DataLoader {
    constructor() {
        const data = {
            patients: [],
            filtered_patients: [],
            timeline_events: [],
            medical_facilities: [],
            filtered_medical_facilities: [],
            map_events: [],
            filtered_map_events: []
        };

        return {
            init: async (params) => {
                await processData(params);
                return data;
            }
        };

        async function processData(params) {
            await loadPatients(params.data.files.patients);
            return Promise.all([
                loadEvents(params.data.files.timeline_events),
                loadFacilities(params.data.files.medical_facilities)
            ]);
        }


        function loadPatients(url) {
            return d3.tsv(url)
                .then(async (file) => {
                    data.patients = file;

                    data.patients.forEach(function (p) {
                        p.SAMPLE_COLLECTION_DATE = new Date(p.SAMPLE_COLLECTION_DATE);
                        // add uniform random number to lat/long if demo'ing so we don't show patient addresses;
                        p.Latitude = Number(p.Latitude);// + (Math.random() - 0.5) * 2e-2;
                        p.Longitude = Number(p.Longitude);// + (Math.random() - 0.5) * 2e-2;
                    });

                    // sort so we can efficiently filter by time using binary search
                    data.patients.sort((a, b) => compareDates(a.SAMPLE_COLLECTION_DATE, b.SAMPLE_COLLECTION_DATE))

                    //ToDo: create type and cohort overlay configurations with "random" settings for any missing from the configuration

                    // sanity check on patient cohorts.
                    let rowsWithMissingTypes = [];
                    rowsWithMissingTypes = data.patients.filter(d => !Object.keys(App.params.patients).includes(d.COHORT));
                    rowsWithMissingTypes.forEach(d => console.error("Patient " + d.ID
                        + " belongs to an unregistered cohort. An entry for \"" + d.COHORT + "\" was not found in the overlay configuration."));

                    return data;
                });
        }

        function loadFacilities(url) {
            return d3.csv(url)
                .then(async (file) => {
                    data.medical_facilities = file;
                    data.filtered_medical_facilities = file;

                    const startDate = d3.min(data.patients, d => d.SAMPLE_COLLECTION_DATE);
                    data.medical_facilities.forEach(function (e) {
                        e.Date = e.Date === "" ? startDate : new Date(e.Date);
                    });

                    // sort so we can efficiently filter by time using binary search
                    data.medical_facilities.sort((a, b) => compareDates(a.Date, b.Date))


                    // sanity check on facility types.
                    let rowsWithMissingTypes = data.medical_facilities.filter(d => !Object.keys(App.params.medical_facilities).includes(d.Type));
                    rowsWithMissingTypes.forEach(d => console.error("Medical facility " + d.ID
                        + " has an unregistered type. An entry for \"" + d.Type + "\" was not found in the overlay configuration."));

                    return data;
                });
        }

        function loadEvents(url) {
            return d3.csv(url)
                .then(async (file) => {
                    data.timeline_events = file;
                    data.timeline_events.forEach(function (e) {
                        e.Date = new Date(e.Date)
                    });
                    return data;
                });
        }
    }
}
