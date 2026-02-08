import { Course } from './course';

export interface User {
  id: string,
  name: string,
  email: string,
  avatar_url: string,
  mode: string,
  admin: boolean,
  teacher?: Course[],
  student?: Course[],
  observer?: Observee[],
  student_list?: Student[]
}

export interface Student {
  id: string,
  email?: string,
  name?: string,
  short_name?: string,
  sortable_name?: string,
  grade?: string,
  courses?: { [course_id: string]: Course}
}

export interface Observee {
  email: string,
  id: string,
  name: string,
  short_name: string,
  sortable_name: string,
  grade?: string,
  courses: Course[],
}
