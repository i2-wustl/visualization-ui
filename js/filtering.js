
/********************************************************************************
 ******************************** Data Filtering ********************************
 ********************************************************************************/

const filters = {
    init: () => {
        let initialFilters = {
            "date": d3.min(App.data.patients, d => d.SAMPLE_COLLECTION_DATE),
            "cases": d3.select('input[name="cases"]:checked').node().value,
            "cohorts": new Set(),
            "medicalFacilities": new Set()
        };

        for (const key in App.params.medical_facilities) {
            initialFilters.medicalFacilities.add(key);
        }

        for (const key in App.params.patients) {
            initialFilters.cohorts.add(key);
        }

        return initialFilters;
    },
    toggleCohort: (cohort, isActive) => {
        if (isActive) {
            App.filters.cohorts.add(cohort);
        } else {
            App.filters.cohorts.delete(cohort);
        }
        visualization.refresh();
    },
    toggleMedicalFacilities: (type, isActive) => {
        if (isActive) {
            App.filters.medicalFacilities.add(type);
        } else {
            App.filters.medicalFacilities.delete(type);
        }
        visualization.refresh();
    },
    apply: () => {
        // Filter by map events by date and type
        App.data.filtered_medical_facilities = App.data.medical_facilities
            .filter(d => (d.Date <= App.filters.date) && App.filters.medicalFacilities.has(d.Type));

        //Filter patients
        let patients = App.data.patients;

        // Filter by date and cases
        switch (App.filters.cases) {
            case cases.TOTAL:
                patients = patients.filter(d => d.SAMPLE_COLLECTION_DATE <= App.filters.date);
                break;
            case cases.NEW:
                patients = patients.filter(d => datesAreOnSameDay(d.SAMPLE_COLLECTION_DATE, App.filters.date));
                break;
            case cases.ACTIVE:
                let activeThreshold = getDateAfterDays(App.filters.date, -14);
                patients = patients.filter(d => d.SAMPLE_COLLECTION_DATE <= App.filters.date && d.SAMPLE_COLLECTION_DATE > activeThreshold);
                break;
            default:
        }

        // Filter by cohort
        App.data.filtered_patients = patients.filter(d => App.filters.cohorts.has(d.COHORT));
    }

};
