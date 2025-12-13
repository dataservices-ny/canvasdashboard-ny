export interface Outcomes {
  [K: string]: Outcome;
}

export interface Outcome {
  description: string,
  title: string,
  points_possible: number,
  mastery_points: number,
  ratings: Rating[],
  assessments?: Assessment[],
  isCollapsed?: boolean,
  assessment_groups?: { [K: number]: Assessment[] }
}

export interface Rating {
  description: string,
  points: number
}

export interface Assessment {
  assignment_id: number,
  name: string,
  htmlUrl: string,
  dueAt: string,
  comments: string,
  points: number,
  index?: number,
}
