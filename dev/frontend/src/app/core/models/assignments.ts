export interface Assignments{
  [id: string]: Assignment
}

export interface Assignment {
  description: string,
  dueAt: {
    section: string,
    date: string
  }[],
  gradingType: string,
  submittable: boolean,
  htmlUrl: string,
  _id: string,
  name: string,
  pointsPossible: number,
  users: string[]
  rubric?: {[id: string]: Rubric },
  isCollapsed?: boolean,
  descriptionIsCollapsed?: boolean,
  published: boolean,
  assignment_group?: string
}

export interface Rubric {
  description: string,
  longDescription: string,
  outcome_id: string,
  points: number,
  ratings: Rating[]
}

export interface Rating {
  description: string,
  long_description: string,
  points: number
}