# Carpenter Notes and To-dos

### Views to fix

    [x] course/outcomes/outcomes-graph (dots) 
        --> this sends assessments to outcome-dot-group 
        --> the outcome-dot-group uses the dot.ts model 
        --> CHANGE! I added a property to dot.ts: icon: string to hold "dot" or "star"
    [x] course/outcomes/graph-dot-group
    [x] course/outcomes/outcomes-graph2
    [x] course/outcomes/outcomes-key
    [x] course/outcomes/outcomes-graph-key
    [x] course/teacher/outcomes-gradebook
    [x] course/outcomes/outcome-assignment-list

    [ ] Python update <-- requires testing

    [ ] TODO: These changes should be conditional on courses having "major" assignments, else it should default to the old system

    


## 12/17

* Got environment up and running on school laptop.
* Working on getting assignment groups and putting a tag on the course in the frontend to trigger the "major" assignments views.
    * api/assignments is returns assignment_group as one of the keys on each assignment. That's good.
    * In frontend, the course.ts model contains assignment_groups?: string[].
    * This is populated when assignments are fetched, so it should be available in all of the relevant views.
* TODO: Found some issues with the Angular dev server (ng serve). There are some version issues to sort out.  Run `ng serve` to see what.

## 12/22
* Got `dot-graph-group` working with star icons
+ Got `outcomes-graph-2` working with `skinny` badges for non-major assignments

## 1/7
* Updated deploy-test.sh and deploy.sh to remove deployment to SP, SZ, and SV

## 1/26
* Finished up changes to keys, outcome-graph2, and outcome-gradebook



# CHANGE LOG

* dev/frontend/src/app/core/models/dot.ts
    * added `icon: string property`
* dev/frontend/src/app/course/outcomes/graph-dot-group/graph-dot-group.component.scss
    * added second class for `.star` icon
* dev/frontend/src/app/course/outcomes/graph-dot-group/graph-dot-group.component.html
    * made `class` a varialbe to store `dot` or `star`
* dev/frontend/src/app/course/outcomes/graph-dot-group/graph-dot-group.component.ts
    * added `icon` property to `dot` object
    * used dataService to get assignment_group
    * added `icon: star` to assignments with assignment_groups containing `major`
    * made all `star` assignemnts `size:30` and `opacity: 1`

* dev/frontend/src/app/course/outcomes/outcomes-graph2/outcomes-graph2.component.html
    * Changed logic for `skinny` badges to look for assignment_groups containing `major` instead of the most recent 3
* dev/frontend/src/app/course/outcomes/outcomes-graph2/outcomes-graph2.component.ts
    * added isMajor method that looks for assignment_group containing `major`
* Updated deploy-test.sh and deploy.sh to remove deployment to SP, SZ, and SV

* dev/frontend/tscnfig.json
    * Added "types": [] to fix bug

* dev/frontend/src/app/course/outcomes/outcomes-list/outcomes-list.component.html
    * Added a border around the outcome description for clarity.

* dev/frontend/src/app/core/services/rubric.service.ts
    * Added isMajor() method
* dev/frontend/src/app/course/outcomes/outcomes-graph2/outcomes-graph2.component.ts
    * Removed isMajor() method as it is now imported from rubric.service.ts
* dev/frontend/src/app/course/outcomes/outcomes-graph2/outcomes-graph2.component.html
    * Updated call to isMajor() to call rubricService.isMajor()
* dev/frontend/src/app/course/teacher/outcomes-gradebook/outcomes-gradebook.component.ts
    * Imported rubric.service.ts to access isMajor()
    * Added showMajor() and showMinor() methods to handle badge logic
* dev/frontend/src/app/course/teacher/outcomes-gradebook/outcomes-gradebook.component.html
    * Updated gradebook view to show major assessments large and non-major assessements "skinny"
    * Updated gradebook view to ignore null rubric grades

* dev/frontend/src/app/course/outcomes/outcomes-graph2/outcomes-graph.component.html
    * Added border around outcome description to clear up the ui
* dev/frontend/src/app/course/outcomes/outcomes-graph2/outcomes-graph2.component.html
    * Added border around outcome description to clear up the ui

* dev/frontend/src/app/course/outcomes/outcome-assignment-list/outcome-assignment-list.component.html
    * Added badge sizing for major/minor assessments
* dev/frontend/src/app/course/outcomes/outcome-assignment-list/outcome-assignment-list.component.ts
    * Imported Assignents to provide categories
* dev/frontend/src/app/course/outcomes/outcomes-graph2/outcomes-graph2.component.html
    * Added assignments to call to assignment-list component
* dev/frontend/src/app/course/outcomes/outcomes-list/outcomes-list.component.html
    * Added assignments to call to assignment-list component
* dev/frontend/src/app/shared/rubric-badge/rubric-badge.component.html
    * Added skinny badge with text
* dev/frontend/src/app/shared/rubric-badge/rubric-badge.component.ts
    * Added withText parameter
* dev/frontend/src/app/shared/rubric-badge/rubric-badge.component.scss
    * Style for skinnyb badge with text

* dev/frontend/src/app/core/services/rubric.service.ts
    * Modified isMajor() method to accept a single Assignment
* dev/frontend/src/app/course/outcomes/outcomes-list/outcomes-list.component.html
    * Modified isMajor() method to use a single Assignment
* dev/frontend/src/app/course/outcomes/outcomes-graph2/outcomes-graph2.component.html
    * Modified isMajor() method to use a single Assignment
* dev/frontend/src/app/course/teacher/outcomes-gradebook/outcomes-gradebook.component.ts
    * Modified isMajor() method to use a single Assignment
* dev/frontend/src/app/shared/rubric-component/rubric-component.component.html
    * Added skinny badge with text
* dev/frontend/src/app/shared/rubric-component/rubric-component.component.scss
    * Fixed skinny badge with text font size

* dev/app.yaml
    * Updated to use most recent version of Python as 3.7 is deprecated.
* dev/requirements.txt
    * Updated requirements for new Python version compatibility
* dev/api/secrets.py
    * Updated for new Python version compatibility
* dev/flask_session_patch/sessions.py
    * Updated for new Python version compatibility