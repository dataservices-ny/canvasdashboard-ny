import { Student } from './user';
import { Submission } from './submissions'
import { CourseOutcomeResults } from './course-outcome-results';

export class AdminStudent {

    public id: string;
    public email: string;
    public name: string;
    public short_name: string;
    public sortable_name: string;
    public grade: string;
    public total_submissions: number;
    public total_complete: number ;
    public total_incomplete: number;
    public total_non_graded: number;
    public total_missing: number;
    public total_late: number;
    public total_proficient_advanced: number;
    public total_developing_not_yet: number;
    public percent_complete: number;
    public percent_incomplete: number;
    public percent_non_graded: number;
    public percent_missing: number;
    public percent_late: number;
    public percent_proficient_advanced: number;
    public courses: { [course_id: string]: AdminCourse};
    public courses_loaded: boolean = false;
    
    constructor(student: Student){
        this.id = student.id;
        this.email = student.email;
        this.name = student.name;
        this.short_name = student.short_name;
        this.sortable_name = student.sortable_name;
        this.grade = student.grade;
        this.total_submissions = null;
        this.total_complete = null ;
        this.total_incomplete = null;
        this.total_non_graded = null;
        this.total_missing = null;
        this.total_late = null;
        this.total_proficient_advanced = null;
        this.total_developing_not_yet = null;
        this.courses = {};
    } 
}

export interface AdminCourse {
    course_id: string,
    course_name?: string,
    total_submissions: number,
    complete: number,
    incomplete: number,
    missing: number,
    non_graded: number,
    late: number,
    proficient_advanced: number,
    developing_not_yet: number,
    recent_submissions: Submission[],
    course_loaded: boolean,
    outcome_results: CourseOutcomeResults
}
