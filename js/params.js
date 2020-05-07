const params = {
    init: async () => await processParams()
};

async function processParams() {
    return Promise.all([
        d3.csv("params/medical_facilities_params.csv"), // visualization parameters for testing sites
        d3.csv("params/patient_params.csv"), // visualization parameters for patients
    ]).then(async (files) => {

        let medicalFacilitiesParams = {};
        files[0].forEach(d => medicalFacilitiesParams[d.type] = d);

        let patientParams = {};
        files[1].forEach(d => patientParams[d.cohort] = d);

        Object.assign(params, {
            'medical_facilities': medicalFacilitiesParams,
            'patients': patientParams
        });

        // sanity check on facility types.
        let rowsWithMissingTypes = App.data.medical_facilities.filter(d => !Object.keys(params.medical_facilities).includes(d.Type));
        rowsWithMissingTypes.forEach(d => console.error("Missing parameters for facility: " + d.Type));
        // sanity check on patient cohorts.
        rowsWithMissingTypes = App.data.patients.filter(d => !Object.keys(params.patients).includes(d.COHORT));
        rowsWithMissingTypes.forEach(d => console.error("Missing parameters for patient cohort: " + d.COHORT));
        
        return params;
    });
}