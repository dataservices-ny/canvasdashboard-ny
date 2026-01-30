# Setup

##  Starting the Angular Frontend Development Server 
The Angular frontend developlent server will allow you to run the app locally with 
mock data.  All API calls are intercepted by src/app/core/services/in-memory-data-service.ts
1. Make sure the that `use_in_memory_data_service = true` in dev/frontend/src/app/core/services/core.module.ts
2. Go to the `dev/frontend` directory
3. Run `ng serve`
4. Navigate to localhost:4200


To run the full app in development mode with real API calls...

## Build the Angular project
1. Make sure the that `use_in_memory_data_service = false` in dev/frontend/src/app/core/services/core.module.ts
2. Go to the `dev/frontend` directory
3. Run `npm run build`
Note that `ng build` will not build correctly.  `npm run build` moves files to the appropriate
directories for Flask to access.
4. Make sure that the Flask server is running (see below)
5. Navigate to http://127.0.0.1:9000/...


## Starting Flask Backend Development Server
This can be used to test api calls or run the Frontend locally with full api calls.
You will need to have some App Engine stuff set up.  See below.
1. Start redis server with `redis-server`
2. Set Google Application Credential with `export GOOGLE_APPLICATION_CREDENTIALS="<path_to_json_application_credential>"`
3. Create a self signed ssl certificate and key
    `openssl genrsa 2048 > host.key`
    `chmod 400 host.key`
    `openssl req -new -x509 -nodes -sha256 -days 365 -key host.key -out host.cert`
4. Start server `gunicorn -b :9000 --workers=4 --certfile=host.cert --keyfile=host.key main:app`
5. Navigate to https://127.0.0.1:9000/...

## App Engine Setup
1. Get app engine service account key as json and place in dev folder for local access to apis.
2. Enable Redis for Memorystore API and create a redis instance.  Fill in redis info in app.yaml.
3. Enable Serverless VPC Access API, create a connector.  Fill in VPC connector info in app.yaml
4. Enable Secret Manager API, create a secret for the Canvas dev key called "canvas_secret"


# Deploying to App Engine
1. Create the folders `build-nyc` in the root directory
1. Go to the `dev/frontend` directory
2. Run `npm run buildprod`.  This will build the Angular project and then run `build-servers.sh` to move the build files to the appropriate directories to be used in the Flask aplication for the dev, NY, SP and SV builds.
3. Copy the file `app.yaml` to the `build-nyc` folder. The env_variables and vpc_access_connector need to be entered for each instance:
`CANVAS_DEV_KEY_CLIENT_ID` is available within Canvas (Admin > Developer Keys)
`REDISHOST` and `REDISPORT` can be found on the Google Cloud Console, under the product Redis Memorystore
3. Go to the `dev` directory.
4. Run `bash deploy-test.sh`.  This will deploy the application to a test version on App Engine.
5. Confirm application on https://test-dot-canvas-dashboard-avenues-nyc.appspot.com is working as expected.
6. Run `bash deploy.sh _version_` (ex. `bash deploy.sh beta35`).  This will deploy the application to the live server and migrate traffic to the updated version.  For a slower approach, see the comments in `dev/deply.sh`
    - You can check the currently deployed version