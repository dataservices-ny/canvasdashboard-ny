# Carpenter Notes and To-dos

### Views to fix

    [x] course/outcomes/outcomes-graph (dots) 
        --> this sends assessments to outcome-dot-group 
        --> the outcome-dot-group uses the dot.ts model 
        --> CHANGE! I added a property to dot.ts: icon: string to hold "dot" or "star"
    [x] course/outcomes/graph-dot-group
    [ ] course/outcomes/outcomes-graph2
    [ ] ? course/outcomes/outcomes-list
    [ ] course/outcomes/outcomes-key
    [ ] course/outcomes/outcomes-graph-key
    [ ] course/teacher/outcomes-gradebook
    [ ] course/outcomes/outcome-assignment-list
    


## 12/17

* Got environment up and running on school laptop.
* Working on getting assignment groups and putting a tag on the course in the frontend to trigger the "major" assignments views.
    * api/assignments is returns assignment_group as one of the keys on each assignment. That's good.
    * In frontend, the course.ts model contains assignment_groups?: string[].
    * This is populated when assignments are fetched, so it should be available in all of the relevant views.
* TODO: Found some issues with the Angular dev server (ng serve). There are some version issues to sort out.  Run `ng serve` to see what.

## 12/22
* Got `dot-graph-group` working with star icons




CHANGE LOG
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

** dev/frontend/src/app/course/outcomes/outcomes-graph2/outcomes-graph2.component.html
    * Changed logic for `skinny` badges to look for assignment_groups containing `major` instead of the most recent 3
* dev/frontend/src/app/course/outcomes/outcomes-graph2/outcomes-graph2.component.ts
    * added isMajor method that looks for assignment_group containing `major`