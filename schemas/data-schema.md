# Data Schemas

Below are descriptions of the various data files used by the application. Each file has a default file location that can be changed in the `config.json` file. The default location for the data as well as other details will be noted in each description.

## Patients

> File format: TSV\
> Default location: "/data/patients.tsv"

This file contains the majority of the data for the application. It consists of a list of patients assigned to various cohorts and additional patient specific information used in the data visualizations.

| Field | Type | Description |
|-------|------|-------------|
|ID|numeric|Unique id of the patient within the dataset|
|PAT_MRN_ID|numeric|Unique id of the patient within the source data|
|FEVER_SYMPTOMS|Yes/No|Did the patient have a fever at the time of collection|
|COUGH_SYMPTOMS|Yes/No|Did the patient have a cough at the time of collection|
|SORE_THROAT_SYMPTOMS|Yes/No|Did the patient have a sore throat at the time of collection|
|GENDER|string|Supported values are: Male/Female/Unknown|
|RACE|string|Currently this field is free text|
|MORTALITY_STATUS|string|Supported values are: Alive/Deceased/[Blank]|
|AGE|numeric|Patient age at the time of collection|
|FACILITY|string|Facility identifier for the dataset|
|DEATH_DATE|date|Time can be included but is currently not used|
|SAMPLE_COLLECTION_DATE|date|Time can be included but is currently not used|
|Latitude|numeric|Latitude coordinate for the patient's home address|
|Longitude|numeric|Longitude coordinate for the patient's home address|
|COHORT|string|The cohort the patient belongs to*|

### Additional Information

The values allowed in the `COHORT` column of this file are defined by the `overlays:patients` configuration section of the `config.json` file. This array contains items with a `cohort` property. Only the values of those properties are allowed in this column. The default configuration provides these values: `COVID-19+, COVID-19-, Influenza+, Influenza-`. If you require additional cohorts, they will need to be added to the `overlays:patients` configuration.

## Medical facilities

> File format: CSV\
> Default location: "/data/medical-facilities.csv"

A list of medical facilities to display as an overlay on the map visualization.

| Field | Type | Description |
|-------|------|-------------|
|ID|numeric|Unique id of the facility within the dataset|
|Name|string|Name of the facility to be used in the UI|
|Date|date|Used to filter facilities based on the date they opened|
|Latitude|numeric|Latitude coordinate for the facility's address|
|Longitude|numeric|Latitude coordinate for the facility's address|
|Type|string|Default supported values are: Hospital/Drive-thru/Testing site*|
|Address|string|Street address of the facility|

### Additional Information

The values allowed in the `TYPE` column of this file are defined by the `overlays:medical_facilities` configuration section of the `config.json` file. This array contains items with a `type` property. Only the values of those properties are allowed in this column. The default configuration provides these values: `Hospital, Drive-thru, Testing site`. If you require additional cohorts, they will need to be added to the `overlays:medical_facilities` configuration.

## Timeline Events

> File format: CSV\
> Default location: "/data/timeline-events.csv"

A file containing a list of events to display in the application UI. These events are shown on the timeline slider and may also be used within various charts.

| Field | Type | Description |
|-------|------|-------------|
|Name|string|Used as the label for the event on the timeline|
|Date|date|Used to display the event at the proper position on the timeline|
