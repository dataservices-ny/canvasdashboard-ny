import { Term } from './term';
import { Student } from './user';
import { Assignments } from './assignments';
import { Outcomes } from './outcomes';
import { Submissions } from './submissions';
import { Activities } from './activities';

export interface Courses {
    [C: string]: Course
}

export interface Course {
    course_id: string,
    course_name?: string,
    sections?: {
        [s: string]: Section
    },
    assignments?: Assignments,
    assignments_groups?: string[],
    submissions?: Submissions,
    activities?: Activities,
    outcomes?: {
        [s: string]: Outcomes
    },
    role: string,
    all_assignments_loaded?: boolean,
    assignments_loaded_for?: string[],
    activities_loaded_for?: string[],
    periods?: [{
        start_date: string,
        end_date: string,
        name: string,
      }]
}

export interface Section {
    section_id: string,
    section_name?: string,
    students: Student[]
}