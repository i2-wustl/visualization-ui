/********************************************************************************
 ************************************ Globals ***********************************
 ********************************************************************************/



/* Enumerations */
const cases = {
    TOTAL: "total",
    ACTIVE: "active",
    RECOVERED: "recovered",
    NEW: "new"
};

const svgGroups = {
    HOSPITALS: "#hospitalGroup",
    PATIENT_DOT_DENSITY: "#patientDotDensity",
    MAP_EVENTS: "#mapEventGroup",
    CONTOURS: "#contourGroup",
    DRAWING: "#drawGroup",
    DRAWING_COMPLETE: "#drawGroupComplete"
};

const svgElements = {
    HOSPITAL_CIRCLES: ".hospitalCircle",
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



