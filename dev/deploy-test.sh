#!/usr/bin/env bash

# This script handles deploying the current build of the application
# to the "test" version on App Engine.  Should be run and the live
# test servers should be checked before deploying to live site.

gcloud app deploy ../build-nyc/app.yaml --project=canvas-dashboard-avenues-nyc --version=test --no-stop-previous-version --no-promote &
P1=$!

wait $P1 && echo "Deployment to test successful" || echo "Deployment to test failed"