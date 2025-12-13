#!/usr/bin/env bash

# This script handles deploying the current build of the application
# to the "test" version on App Engine.  Should be run and the live
# test servers should be checked before deploying to live site.

gcloud app deploy ../build-nyc/app.yaml --project=canvas-dashboard-avenues-nyc --version=test --no-stop-previous-version --no-promote &
P1=$!

gcloud app deploy ../build-sp/app.yaml --project=canvas-dashboard-avenues-spb --version=test --no-stop-previous-version --no-promote &
P2=$!

gcloud app deploy ../build-sv/app.yaml --project=canvas-dashboard-avenues-sv --version=test --no-stop-previous-version --no-promote &
P3=$!

gcloud app deploy ../build-sz/app.yaml --project=canvas-dashboard-avenues-sz --version=test --no-stop-previous-version --no-promote &
P4=$!

wait $P1 $P2 $P3 $P4