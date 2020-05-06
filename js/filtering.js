
/********************************************************************************
 ******************************** Data Filtering ********************************
 ********************************************************************************/

const filters = {
    init: () => {
        let initialFilters = {
            "date": d3.min(App.data.patients, d => d.ENC_DATE),
            "COVID19": d3.select("#COVID19-cb").property('checked'),
            "ILI": d3.select("#ILI-cb").property('checked'),
            "cases": d3.select('input[name="cases"]:checked').node().value,
            "medicalFacilities": new Set()
        };

        for (const key in App.params.medical_facilities) {
            initialFilters.medicalFacilities.add(key);
        }

        return initialFilters;
    },
    toggleCOVID19: (isActive) => {
        App.filters.COVID19 = isActive;
        visualization.refresh();
    },
    toggleILI: (isActive) => {
        App.filters.ILI = isActive;
        visualization.refresh();
    },
    toggleCases: (value) => {
        App.filters.cases = value;
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
                patients = patients.filter(d => d.ENC_DATE <= App.filters.date);
                break;
            case cases.NEW:
                patients = patients.filter(d => datesAreOnSameDay(d.ENC_DATE, App.filters.date));
                break;
            case cases.ACTIVE:
                let activeThreshold = getDateAfterDays(App.filters.date, -14);
                patients = patients.filter(d => d.ENC_DATE <= App.filters.date && d.ENC_DATE > activeThreshold);
                break;
            default:
        }

        // Filter by cohort
        const cohorts = [];
        if (App.filters.COVID19) cohorts.push(true);
        if (App.filters.ILI) cohorts.push(false);
        patients = patients.filter(d => cohorts.includes(d.COVID19));

        App.data.filtered_patients = patients;
    }

};
