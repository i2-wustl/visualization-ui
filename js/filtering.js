
/********************************************************************************
 ******************************** Data Filtering ********************************
 ********************************************************************************/

const filters = {
    init: () => {
        let initialFilters = {
            "date": d3.min(App.data.patients, d => d.SAMPLE_COLLECTION_DATE),
            "cases": d3.select('input[name="cases"]:checked').node().value,
            "withXDaysValue": d3.selectAll('input[name="within-x-days-value"]').node().value,
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
    toggleCases: (value) => {
        App.filters.cases = value;
        visualization.refresh();
    },
    updateWithinXDays: (value) => {
        App.filters.withXDaysValue = value;
        if (App.filters.cases === cases.WITHIN_X_DAYS) {
            visualization.refresh();
        }
    },
    apply: () => {
        let nextDay = getDateAfterDays(App.filters.date,1), // one day after our threshold
            startIndex = 0,
            endIndex = binarySearchFirstOccurrence(App.data.medical_facilities, nextDay, (a, b) => compareDates(a.Date, b));
        if (endIndex < 0) endIndex = -(endIndex+1); // if the date isn't found, convert to insertion index
        // Filter by medical facilities by date and type
        App.data.filtered_medical_facilities = App.data.medical_facilities
            .slice(startIndex, endIndex) // indices of filtered dates
            .filter(d => App.filters.medicalFacilities.has(d.Type));

        //Filter patients
        endIndex = binarySearchFirstOccurrence(App.data.patients, nextDay, (a, b) => compareDates(a.SAMPLE_COLLECTION_DATE, b));
        if (endIndex < 0) endIndex = -(endIndex+1);
        // Filter by date and cases
        switch (App.filters.cases) {
            case cases.TOTAL:
                break;
            case cases.NEW:
                startIndex = binarySearchFirstOccurrence(App.data.patients, App.filters.date, (a, b) => compareDates(a.SAMPLE_COLLECTION_DATE, b), 0, endIndex-1)
                break;
            case cases.WITHIN_X_DAYS:
                let activeThreshold = getDateAfterDays(App.filters.date, -App.filters.withXDaysValue);
                startIndex = binarySearchFirstOccurrence(App.data.patients, activeThreshold, (a, b) => compareDates(a.SAMPLE_COLLECTION_DATE, b), 0, endIndex-1)
                break;
            default:
        }

        if (startIndex < 0) startIndex = -(startIndex+1); // if the date isn't found, convert to insertion index
        // Filter by cohort
        App.data.filtered_patients = App.data.patients
            .slice(startIndex, endIndex) // indices of filtered dates
            .filter(d => App.filters.cohorts.has(d.COHORT));
    }

};
