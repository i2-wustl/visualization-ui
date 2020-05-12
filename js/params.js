const params = {
    init: processParams
};

async function processParams(config) {
        //ToDo: set default values if no specific setting is provided

        let medicalFacilitiesParams = {};
        config.overlays.medical_facilities.forEach(d => medicalFacilitiesParams[d.type] = d);

        let patientParams = {};
        config.overlays.patients.forEach(d => patientParams[d.cohort] = d);

        Object.assign(params, {
            'medical_facilities': medicalFacilitiesParams,
            'patients': patientParams
        });

        return params;
    
}