class PandemicTracker {
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

        try {
            const configLoader = new ConfigLoader();
            this.params = await configLoader.init(config);

            const dataLoader = new DataLoader();
            this.data = await dataLoader.init(this.params);

            this.filters = filters.init();

            this.visualization = visualization.init();
            this.drawing = new DrawingFeature();
            this.drawing.init();
            
            this.showControls();
            ui.init();

        } catch (error) {
           this.showError(error);
        }
    }
    showControls() {
        document.querySelector('.hamburger-container-left').style.display = 'inherit';
        document.querySelector('.hamburger-container-right').style.display = 'inherit';
        document.querySelector('#control-sidebar').style.display = 'inherit';
        document.querySelector('#chart-sidebar').style.display = 'inherit';
        document.querySelector('#timeline').style.display = 'inherit';
        document.querySelector('#drawing-tooltip-bar').style.display = 'inherit';
        document.querySelector('#error-message').style.display = 'none';
    }
    showError(error) {
        document.querySelector('.hamburger-container-left').style.display = 'none';
        document.querySelector('.hamburger-container-right').style.display = 'none';
        document.querySelector('#control-sidebar').style.display = 'none';
        document.querySelector('#chart-sidebar').style.display = 'none';
        document.querySelector('#timeline').style.display = 'none';
        document.querySelector('#drawing-tooltip-bar').style.display = 'none';
        document.querySelector('#map').style.display = 'none';
        document.querySelector('#error-message').style.display = 'flex';
        document.querySelector('#error-message').innerHTML = `<p>${error}</p>`;
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
