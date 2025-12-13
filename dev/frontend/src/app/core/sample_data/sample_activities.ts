import { Activities } from '../models/activities'

export const sample_activities: Activities = {
    event_5541:{
        type: 'event',
        date: "2020-08-31T04:00:00Z",
        _id: "event_5541",
        description: null,
        endAt: "2020-08-31T04:01:00Z",
        htmlUrl: "https://avenues.instructure.com/api/v1/calendar_events/5541",
        name: "Test Crew Event",
        startAt: "2020-08-31T04:00:00Z",
        users: ['4321'],
        sections: ['1234']
    },
    event_5542:{
        type: 'event',
        date: "2020-09-01T04:00:00Z",
        _id: "event_5542",
        description: null,
        endAt: "2020-09-01T04:01:00Z",
        htmlUrl: "https://avenues.instructure.com/api/v1/calendar_events/5541",
        name: "Second Test Crew Event",
        startAt: "2020-09-01T04:00:00Z",
        users: ['4321'],
        sections: ['1234']
    },
    discussion_topic_5542:{
        type: 'discussion_topic',
        date: "2020-09-02T04:00:00Z",
        _id: "discussion_topic_5542",
        description: null,
        htmlUrl: "https://avenues.instructure.com/api/v1/calendar_events/5541",
        name: "Some Discussion Topic",
        users: ['4321'],
        sections: ['1234']
    }
}