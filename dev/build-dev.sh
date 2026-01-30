#!/usr/bin/env bash

# No need to run this script on its own.  This is used by build-servers.sh to 
# move Angular files into the proper places to be accessed by Flask.

# Run this from /frontend directory

# Move files from frontend/dist to dev directories accessed by Flask
if [ -f "./dist/index.html" ]; then
  mkdir -p ../static/img
  mkdir -p ../templates
  cp ./dist/*.js ./dist/*.css ./dist/static/img/favicon.ico ../static
  cp ./dist/static/img/* ../static/img
  cp ./dist/index.html ../templates
else
  echo "Skipping dev build copy: ./dist/index.html not found."
fi
