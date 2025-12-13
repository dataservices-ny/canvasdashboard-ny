export interface Submissions {
  [student_id: string]: { [a_id: string]: Submission }
}

export interface Submission {
  _id: string, // the assignment id
  comments: Comment[],
  dueAt: string,
  excused: boolean,
  grade: string | number,
  gradedAt: string,
  submitted_at: string,
  late: boolean,
  missing: boolean,
  rubric?: { [key: string]: SubmissionRubric },
  score: number,
  assignment_visible: boolean,
  complete: boolean,
  student_id?: string,
}

export interface Comment {
  author_name: string,
  comment: string,
  updatedAt: string,
  attachment?: {
    display_name: string,
    url: string
  }
  video_url?: string
}

export interface SubmissionRubric {
  comments: string,
  points: number
}

export interface Rating {
  description: string,
  long_description: string,
  points: number
}