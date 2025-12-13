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

gcloud app deploy ../build-sp/app.yaml --project=canvas-dashboard-avenues-spb --version=$version $promote $stop &
P2=$!

gcloud app deploy ../build-sv/app.yaml --project=canvas-dashboard-avenues-sv --version=$version $promote $stop &
P3=$!

gcloud app deploy ../build-sz/app.yaml --project=canvas-dashboard-avenues-sz --version=$version $promote $stop &
P4=$!

wait $P1 $P2 $P3 $P4