/********************************************************************************
 ************************************ Globals ***********************************
 ********************************************************************************/



/* Enumerations */
const cases = {
    TOTAL: "total",
    WITHIN_X_DAYS: "within-x-days",
    ACTIVE: "active",
    RECOVERED: "recovered",
    NEW: "new"
};

const svgGroups = {
    MEDICAL_FACILITIES: "#medicalFacilitiesGroup",
    PATIENT_DOT_DENSITY: "#patientDotDensity",
    MAP_EVENTS: "#mapEventGroup",
    CONTOURS: "#contourGroup",
    DRAWING: "#drawGroup",
    DRAWING_COMPLETE: "#drawGroupComplete"
};

const svgElements = {
    MEDICAL_FACILITIES_CIRCLES: ".medicalFacilitiesCircle",
    PATIENT_CIRCLES: ".patientCircle",
    MAP_EVENT_CIRCLES: ".mapEventCircle",
    CONTOURS: ".contourPath",
    DRAWING_LINES: ".drawingLine",
    DRAWING_PATHS: ".drawingPath",
};

const drawingMode = {
    NONE: "none",
    SELECT: "select",
    BOX: "box",
    INSPECTION_BOX: "inspection_box",
    FREE: "free"
};

const initialRadiusValues = {
    HOSPITALS: 14,
    COVID19: 11,
    ILI: 9,
    MAP_EVENTS: 14
};



