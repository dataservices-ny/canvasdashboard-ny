export interface Activities {
  [id: string]: Activity
}

export interface Activity {
  type: string,
  date: string,
  dueAt?: string,
  description: string,
  startAt?: string,
  endAt?: string,
  htmlUrl: string,
  _id: string,
  users: string[],
  name: string,
  isCollapsed?: boolean,
  sections: string[]
}