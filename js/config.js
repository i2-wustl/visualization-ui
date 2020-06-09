class ConfigLoader {
    constructor() {

        const defaultConfig = {
            "url": "config.json",
            "data": {
                "files": {
                    "timeline_events": "data/timeline-events.csv",
                    "patients": "data/patients.tsv",
                    "medical_facilities": "data/medical-facilities.csv"
                }
            },
            "overlays": {
                "medical_facilities": [
                    {
                        "type": "Hospital",
                        "size": 12,
                        "fill": "#1f78b4"
                    },
                    {
                        "type": "Drive-thru",
                        "size": 12,
                        "fill": "#a6cee3"
                    },
                    {
                        "type": "Testing site",
                        "size": 12,
                        "fill": "#a6cee3"
                    }
                ],
                "patients": [
                    {
                        "cohort": "COVID-19+",
                        "size": 8,
                        "fill": "#B92739",
                        "fill-opacity": 0.75,
                        "z-order": 4
                    },
                    {
                        "cohort": "COVID-19-",
                        "size": 6,
                        "fill": "#fb9a99",
                        "fill-opacity": 0.75,
                        "z-order": 3
                    },
                    {
                        "cohort": "Influenza+",
                        "size": 8,
                        "fill": "#fb9a99",
                        "fill-opacity": 0.75,
                        "z-order": 2
                    },
                    {
                        "cohort": "Influenza-",
                        "size": 6,
                        "fill": "#cab2d6",
                        "fill-opacity": 0.75,
                        "z-order": 1
                    }
                ]
            }
        };

        return {
            init: async (config) => {
                const input = {
                    ...defaultConfig
                };

                const response = await fetch('package.json');
                console.log('loading package');
                if (response.ok) {
                    const json = await response.json();
                    input.version = json.version;
                }

                mergeConfig(input, config);

                // Object.assign(input, defaultConfig, config ?? {});
                return await processParams(input);
            }
        }

        function mergeConfig(target, source) {
            if (source != null) {

                target.version = source.version || (target.version || null);
                //Allow override to null
                //if (source.url)
                target.url = source.url;

                if (source.data)
                    target.data = source.data;

                if (target.overlays == null)
                    target.overlays = {};

                if (source.overlays && source.overlays.medical_facilities)
                    target.overlays.medical_facilities = source.overlays.medical_facilities;

                if (source.overlays && source.overlays.patients)
                    target.overlays.patients = source.overlays.patients;
            }
        }


        async function processParams(config) {
            //set default values
            const output = {};

            //override defaults via arg
            //Object.assign(output, config);
            mergeConfig(output, config);

            if (config.url) {
                const response = await fetch(config.url);
                if (response.ok) {
                    let json = await response.json();
                    //Object.assign(output, json);
                    mergeConfig(output, json);
                }
            }

            let medicalFacilitiesParams = {};
            output.overlays.medical_facilities.forEach(d => medicalFacilitiesParams[d.type] = d);

            let patientParams = {};
            output.overlays.patients.forEach(d => patientParams[d.cohort] = d);

            // mergeConfig(output, {
            //     'medical_facilities': medicalFacilitiesParams,
            //     'patients': patientParams
            // });

            output.medical_facilities = medicalFacilitiesParams;
            output.patients = patientParams;
            return output;

        }



    }


}