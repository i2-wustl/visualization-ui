class AppMediator {
    constructor() {
        this._selectedRegion = null;

        this.data = {
            patients: [],
            filtered_patients: [],
            timeline_events: [],
            static_medical_facilities: [],
            dynamic_medical_facilities: [],
            filtered_medical_facilities: [],
            map_events: [],
            filtered_map_events: []
        };

        this.params = {};
        this.filters = {};
        this.visualization = {};
        this.drawing = null;
        this.zooming = false;
    }

    init = async (config) => {

        this.params = await params.init(config);
        this.data = await data.init();
        this.filters = filters.init();

        this.visualization = visualization.init();
        this.drawing = new DrawingFeature();
        this.drawing.init();


        ui.init();
        timelineSlider.init();
    }

    get selectedRegion() {
        return this._selectedRegion;
    }
    /** Property setter for selectedRegion. This pattern is an easy shim for pub/sub to enable cross feature communication */
    set selectedRegion(value) {
        console.debug('Setting selected region', value);
        this._selectedRegion = value;
    }

    get selected_patient_IDs() {
        return this._selected_patient_IDs;
    }

    set selected_patient_IDs(value) {
        console.debug('Setting selected patient IDs', value);
        this._selected_patient_IDs = value;
    }

}
