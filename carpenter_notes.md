# Carpenter Notes and To-dos

## 12/17

* Got environment up and running on school laptop.
* Working on getting assignment groups and putting a tag on the course in the frontend to trigger the "major" assignments views.
    * api/assignments is returns assignment_group as one of the keys on each assignment. That's good.
    * In frontend, the course.ts model contains assignment_groups?: string[].
    * This is populated when assignments are fetched, so it should be available in all of the relevant views.
* TODO: Found some issues with the Angular dev server (ng serve). There are some version issues to sort out.  Run `ng serve` to see what.


### Views to fix

    [ ] course/outcomes/outcomes-graph (dots) 
        --> this sends assessments to outcome-dot-group 
        --> the outcome-dot-group uses the dot.ts model 
        --> CHANGE! I added a property to dot.ts: icon: string to hold "dot" or "star"
    [ ] course/outcomes/outcomes-graph2
    [ ] ? course/outcomes/outcomes-list
    [ ] course/outcomes/outcomes-key
    [ ] course/outcomes/outcomes-graph-key
    [ ] course/teacher/outcomes-gradebook
    [ ] course/outcomes/outcome-assignment-list
    [ ] course/outcomes/graph-dot-group