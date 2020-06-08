# Pandemic Tracker

Display data related to patient cohorts in a particular region.

## Deployment

### Overview

Running the application on your website can be as simple as copying the contents of this repository to a directory within your website's root directory. Then simply link to the `index.html` page in the new directory to launch the application. You will also need to copy the data files into the `data` directory to enable the application's visualizations to work.

### Details

There are a few things to consider before deploying this application. The purpose of this application is to visualize data that is considered PHI. Steps need to be taken to ensure the deployment of this application is in compliance with your organizations policies and all HIPAA regulations. We highly recommend only hosting this application using HTTPS even if it is hosted internally.

By default, this application provides no authentication, authorization or auditing functionality. These aspects of compliance must be handled outside of the application. For example, this could be done implementing authentication and auditing using features at the webserver level.

We have taken the approach of wrapping this application inside of an aspnet core website that handles authorizing and logging user access. The code for the aspnet site can be found in the [COVID-19 Visualization repository](https://github.com/i2-wustl/covid19-visualization). This same pattern could be implemented using any server side hosting platform such as NodeJS, python, php etc. The implementation of this pattern on each platform will look slightly different and is outside the scope of this document.

Follow these steps to deploy the application to your webserver.

1. Download the application code. This can be done by cloning the repository or downloading the code as a zip file from GitHub. If you downloaded the zip file, you will also need to extract the contents to a local directory.

2. Copy the code to a directory that has been configured to be served via a web server. This can be a dedicated website or a directory under an existing website. The webserver should be configured to allow the following file types: HTML, CSS, JS, JSON, CSV, TSV, PNG

3. Data files will need to be placed either in the `data` directory or in a location that can be accessed via a relative URL such as: `protected-files/patients.tsv`. If the file URLs will not match the default values, the `config.json` file will need to be updated to the new URLs. More information can be found in the Configuration section of this document.

Once these steps have been completed successfully the application should be functional and accessible at the URL corresponding to the directory you copied the application code to.

## Configuration

All configuration for the application is contained in the `config.json` file. There are two main configuration sections in this file.

- `data`: contains the `files` object with properties to hold the path to the data files
- `overlays`: contains the UI configuration for the medical facility and patient visualizations

## Data

The application requires three data files to enable all features. These files are as follows:

- `timeline_events`: a CSV file containing the events to show on the timeline slider
- `patients`: a TSV file containing the patient data, including their cohort association
- `medical_facilities`: a CSV file containing the information regarding a facility's location and type

Please refer to the [Data Schema Documentation](data-schema.md) for details on the format of each of these files.

## Development

