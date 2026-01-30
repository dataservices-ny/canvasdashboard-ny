#!/usr/bin/env bash

# This script takes the Angular build files and adds them to the 
# directories where they will be accessed by Flask for dev, NY, and SP.
# This script is called automatically with `npm run build` from the 
# dev/frontend directory, so this should rarely need to be run on its own.

# Run this from /frontend directory

# Move files from dist to dev directories accessed by Flask
bash ../build-dev.sh

## NY Frontend
rm -rf ../../build-nyc/static
rm -rf ../../build-nyc/templates
mkdir -p ../../build-nyc/static/img
mkdir -p ../../build-nyc/templates
cp ./dist-ny/*.js ./dist-ny/*.css ../../build-nyc/static
cp ./dist-ny/static/img/* ../../build-nyc/static/img
cp ./dist-ny/index.html ../../build-nyc/templates

## NY Backend
rm -rf ../../build-nyc/api
cp -R ../api ../../build-nyc/api
cp ../main.py ../../build-nyc/main.py
cp ../templates/lti_redirect.html ../../build-nyc/templates
cp ../templates/safari_redirect.html ../../build-nyc/templates
cp ../requirements.txt ../../build-nyc/requirements.txt
cp ../.gcloudignore ../../build-nyc/.gcloudignore
cp -R ../flask_session_patch ../../build-nyc/flask_session_patch
