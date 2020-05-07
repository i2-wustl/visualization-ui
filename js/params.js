const params = {
    init: async () => await processParams()
};

async function processParams() {
    return Promise.all([
        d3.csv("params/medical_facilities_params.csv"), // visualization parameters for testing sites
    ]).then(async (files) => {

        let medicalFacilitiesParams = {};
        files[0].forEach(d => medicalFacilitiesParams[d.type] = d);

        Object.assign(params, {
            'medical_facilities': medicalFacilitiesParams,
        });

        // sanity check on facility types.
        const rowsWithMissingTypes = App.data.medical_facilities.filter(d => !Object.keys(params.medical_facilities).includes(d.Type));
        rowsWithMissingTypes.forEach(d => console.error("Missing parameters for facility: " + d.Type));
        
        return params;
    });
}