export interface CourseOutcomeResults {
    [outcome_id: string]: {
        title: string,
        results: result[]
    }
}

interface result {
    assignment_id: string,
    date: string,
    points: number
}