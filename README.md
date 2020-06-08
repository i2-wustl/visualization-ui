# Pandemic Tracker

[Insert project description here]

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

All configuration settings for the application are contained in the `config.json` file. This file conforms to the JSON schema located in the `schemas/configuration.json` file. Technical details and examples of the structure of this JSON configuration can be found in that document.

There are two main configuration sections in this file.

- `data`: contains the `files` object with properties to hold the relative path to the data files
- `overlays`: contains the UI configuration for the medical facility and patient visualizations

### Data

The application requires three data files to enable all features. These files are as follows:

- `timeline_events`: a CSV file containing the events to show on the timeline slider
- `patients`: a TSV file containing the patient data, including their cohort association
- `medical_facilities`: a CSV file containing the information regarding a facility's location and type

Please refer to the [Data Schema Documentation](schemas/data-schema.md) for details on the format of each of these files.

### Overlays

Multiple visual overlays are displayed on the map by the application. Each of these overlays have an independent configuration for things like color, size and various other properties. There are two main types of overlays in the application: `medical_facilities` and `patients`.

#### medical_facilities

Medical facility overlays support the following properties:

- `type`: the category or type of facility such as Hospital, Drive-thru or Testing site. The values available to this property are determined by the values in the `medical_facilities.csv` file.
- `size`: the size in px units of the overlay circle
- `fill`: the CSS color value to the overlay circle

#### patients

Patient overlays support the following properties:

- `cohort`: the cohort to which a patient belongs. The values available to this property are determined by the values in the `patients.tsv` file.
- `size`: the size in px units of the overlay circle
- `fill`: the CSS color value to the overlay circle
- `fill-opacity`: the CSS opacity value to the overlay circle
- `z-order`: the CSS value for the z-order of the overlay circle

> Note: More information regarding the relationship between the available values in the `type` and `cohort` properties and the corresponding data file can be found in the [Data Schema Documentation](schemas/data-schema.md).

### Additional Information

The `config.json` file can also be generated dynamically via a server side technology to support advanced scenarios. An example would be generating a unique `config.json` file for the currently logged in user. This could enable features like user customized overlay colors or loading different data files depending on custom authorization policies.

As long as the response conforms to the `schemas/configuration.json` file, the application should load the dynamic configuration as if it was the static file provided with the application.

The implementation of this scenario will vary depending on server side technologies. However, the concept is to remove the static `config.json` file and intercept the request via some server side logic. In an MVC style application this would mean, adding a route for the `config.json` to a controller that returns a dynamically generated JSON response.

Similarly, dynamic datasets can also be utilized. By using this same pattern, we can leverage a server side technology to intercept the requests for the data files and return dynamically generated CSV and TSV files instead.

Just as the dynamic configuration file must conform to the provided JSON schema, the data files must also conform to the appropriate data schema. The details on these schemas can be the [Data Schema Documentation](schemas/data-schema.md).

An example of this can be seen in the [COVID-19 Visualization repository](https://github.com/i2-wustl/covid19-visualization). The [Patients Function](https://github.com/i2-wustl/covid19-visualization/blob/master/src/Covid19.Web/Controllers/MapController.cs#L31) on the [`MapController`](https://github.com/i2-wustl/covid19-visualization/blob/master/src/Covid19.Web/Controllers/MapController.cs) shows returning demo patient data unless the current user has been enabled.

## Development

To extend or modify this code base, simply use your favorite code editor and local webserver. Open this directory in your editor and launch a webserver pointing to this directory. You should be able to pull up the application at the URL provided by your local webserver.
