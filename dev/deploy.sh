#!/usr/bin/env bash

# This script handles deploying the current build of the application
# to a new (or old) version on App Engine.  Defaults to promoting the 
# new build to live and stopping previous versions.

# IMPORTANT - Always run deploy-test.sh and check the test server 
# Before running this script.

# Example use: `bash deploy.sh beta34`
# Example with optional arguments `bash deploy.sh beta34 --no-promote --no-stop-previous-version`

# Arguments
# $1  version: string
# $2 --promote or --no-promote
# $3 --stop-previous-version or --no-stop-previous-version

version=$1
promote=${2:---promote}  
stop=${3:---stop-previous-version}  

gcloud app deploy ../build-nyc/app.yaml --project=canvas-dashboard-avenues-nyc --version=$version $promote $stop &
P1=$!

wait $P1 && echo "Deployment to live successful" || echo "Deployment to live failed"