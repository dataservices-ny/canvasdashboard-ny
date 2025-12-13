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
mkdir ../../build-nyc/static
mkdir ../../build-nyc/static/img
mkdir ../../build-nyc/templates
cp ./dist-ny/*.js ./dist-ny/*.css ../../build-nyc/static
cp ./dist-ny/static/img/* ../../build-nyc/static/img
cp ./dist-ny/index.html ../../build-nyc/templates
cp ./dist-ny/lti_redirect.html ../../build-nyc/templates
cp ./dist-ny/safari_redirect.html ../../build-nyc/templates

## NY Backend
rm -rf ../../build-nyc/api
cp -R ../api ../../build-nyc/api
cp ../main.py ../../build-nyc/main.py
cp ../templates/lti_redirect.html ../../build-nyc/templates
cp ../templates/safari_redirect.html ../../build-nyc/templates
cp ../requirements.txt ../../build-nyc/requirements.txt
cp ../.gcloudignore ../../build-nyc/.gcloudignore
cp -R ../flask_session_patch ../../build-nyc/flask_session_patch

## SP Frontend
rm -rf ../../build-sp/static
rm -rf ../../build-sp/templates
mkdir ../../build-sp/static
mkdir ../../build-sp/static/img
mkdir ../../build-sp/templates
cp ./dist-sp/*.js ./dist-sp/*.css ../../build-sp/static
cp ./dist-sp/static/img/* ../../build-sp/static/img
cp ./dist-sp/index.html ../../build-sp/templates
cp ./dist-sp/lti_redirect.html ../../build-sp/templates
cp ./dist-sp/safari_redirect.html ../../build-sp/templates

## SP Backend
rm -rf ../../build-sp/api
cp -R ../api ../../build-sp/api
cp ../main.py ../../build-sp/main.py
cp ../templates/lti_redirect.html ../../build-sp/templates
cp ../templates/safari_redirect.html ../../build-sp/templates
cp ../requirements.txt ../../build-sp/requirements.txt
cp ../.gcloudignore ../../build-sp/.gcloudignore
cp -R ../flask_session_patch ../../build-sp/flask_session_patch

## SV Frontend
rm -rf ../../build-sv/static
rm -rf ../../build-sv/templates
mkdir ../../build-sv/static
mkdir ../../build-sv/static/img
mkdir ../../build-sv/templates
cp ./dist-sv/*.js ./dist-sv/*.css ../../build-sv/static
cp ./dist-sv/static/img/* ../../build-sv/static/img
cp ./dist-sv/index.html ../../build-sv/templates
cp ./dist-sv/lti_redirect.html ../../build-sv/templates
cp ./dist-sv/safari_redirect.html ../../build-sv/templates

## SV Backend
rm -rf ../../build-sv/api
cp -R ../api ../../build-sv/api
cp ../main.py ../../build-sv/main.py
cp ../templates/lti_redirect.html ../../build-sv/templates
cp ../templates/safari_redirect.html ../../build-sv/templates
cp ../requirements.txt ../../build-sv/requirements.txt
cp ../.gcloudignore ../../build-sv/.gcloudignore
cp -R ../flask_session_patch ../../build-sv/flask_session_patch

## SZ Frontend
rm -rf ../../build-sz/static
rm -rf ../../build-sz/templates
mkdir ../../build-sz/static
mkdir ../../build-sz/static/img
mkdir ../../build-sz/templates
cp ./dist-sz/*.js ./dist-sz/*.css ../../build-sz/static
cp ./dist-sz/static/img/* ../../build-sz/static/img
cp ./dist-sz/index.html ../../build-sz/templates
cp ./dist-sz/lti_redirect.html ../../build-sz/templates
cp ./dist-sz/safari_redirect.html ../../build-sz/templates

## SZ Backend
rm -rf ../../build-sz/api
cp -R ../api ../../build-sz/api
cp ../main.py ../../build-sz/main.py
cp ../templates/lti_redirect.html ../../build-sz/templates
cp ../templates/safari_redirect.html ../../build-sz/templates
cp ../requirements.txt ../../build-sz/requirements.txt
cp ../.gcloudignore ../../build-sz/.gcloudignore
cp -R ../flask_session_patch ../../build-sz/flask_session_patch