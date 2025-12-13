import asyncio
from re import L
import aiohttp
from aiohttp import ClientSession
import requests
import json
import logging
import time
from datetime import datetime, timezone, timedelta
from copy import deepcopy
import math

api_quota = 700

async def user(base_url: str, access_token: str):
    """Get user profile and course enrollement information."""

    semaphore = asyncio.Semaphore(100)

    profile_url = base_url + '/api/v1/users/self/profile'

    permissions_url = base_url + '/api/v1/accounts/self/permissions'
    permissions_params = [
        ('permissions[]', 'become_user')
    ]

    courses_url = base_url + '/api/v1/courses'
    courses_params = [
        ('enrollment_state', 'active'),
        ('state[]', 'available'),
        ('include[]', 'observed_users'),
        ('include[]', 'sections'),
        ('include[]', 'concluded'),
        ('include[]', 'grading_periods'),
        ('per_page', 100)
    ]
    enrollments_url = base_url + '/api/v1/users/self/enrollments'
    enrollments_params = [
        ('include[]', 'observed_users'),
    ]
    sections_url = base_url + '/api/v1/courses/%s/sections'
    sections_params = [
        ('include[]', 'students'),
        ('per_page', 100)
    ]

    async with ClientSession() as client:
        
        async def get_profile_admin():
            profile = await canvas_get(semaphore, profile_url, access_token, client)
            
            admin = False
            try:
                permissions = await canvas_get(semaphore, permissions_url, access_token, client, params=permissions_params)
                if permissions['become_user'] == True:
                    admin = True
            except:
                pass
            return profile, admin
        
        profile, admin = await get_profile_admin()
        courses, enrollments = await asyncio.gather( 
                                        canvas_get(semaphore, courses_url, access_token, client, params=courses_params),
                                        canvas_get(semaphore, enrollments_url, access_token, client, params=enrollments_params)
                                        )

    teacher = []
    student = []
    observer = []
    observer_oids = [] # Index of observee ids
    
    for enrollment in [e for e in enrollments if 'observed_user' in e]:
        if enrollment['observed_user']['id'] not in observer_oids:
            observer.append({
                                'email': enrollment['observed_user']['email'] if 'email' in enrollment['observed_user'] else enrollment['observed_user']['login_id'] if 'login_id' in enrollment['observed_user'] else None,
                                'id': str(enrollment['observed_user']['id']),
                                'name': enrollment['observed_user']['name'],
                                'short_name': enrollment['observed_user']['short_name'],
                                'sortable_name': enrollment['observed_user']['sortable_name'],
                                'courses': [],
                            })
            observer_oids.append(enrollment['observed_user']['id'])

    for course in [c for c in courses if not c['concluded']]:
        # Get gradind periods
        course_periods = []
        if 'grading_periods' in course and course['grading_periods'] != None:
            if len(course['grading_periods']) > 0:
                for p in course['grading_periods']:
                    course_periods.append({
                        'id': p['id'],
                        'start_at': p['start_date'],
                        'end_at': p['end_date'],
                        'name': p['title']
                    })
        # If user is enrolled as a teacher, ignore other enrollments
        if [e for e in course['enrollments'] if e['type'] == 'teacher']:
            # Get course sections and roster
            teacher_course = {
                'course_id': str(course['id']),
                'course_name': course['name'],
                'periods': course_periods
            }
            async with ClientSession() as client:
                sections = await canvas_get(semaphore, sections_url % course['id'], access_token, client, params=sections_params)
                if sections:
                    teacher_course['sections'] = {
                        'all': {
                            'section_id': 'all',
                            'section_name': 'all sections',
                            'students': []
                        }
                    }
                for section in sections:
                    if section['students']:
                        students = [
                            {  'id': str(s['id']), 
                                'email': s['email'] if 'email' in s else s['login_id'] if 'login_id' in s else None,
                                'name': s['name'],
                                'short_name': s['short_name'],
                                'sortable_name': s['sortable_name'],
                            } for s in section['students'] 
                        ]
                        students = sorted(students, key=lambda k: k['sortable_name'])
                        teacher_course['sections'][str(section['id'])] = {
                            'section_id': str(section['id']),
                            'section_name': section['name'],
                            'students': students
                        }
                        #teacher_course['sections']['all']['students'].extend(students)
                        for s in students:
                            if s not in teacher_course['sections']['all']['students']:
                                teacher_course['sections']['all']['students'].append(s)
                
                teacher_course['sections']['all']['students'] = sorted(teacher_course['sections']['all']['students'], key=lambda k: k['sortable_name'])

                teacher.append(teacher_course)

            continue
        
        # Else if user is enrolled as an observer, ignore enrollments not associated with a student
        elif [e for e in course['enrollments'] if e['type'] == 'observer' and 'associated_user_id' in e]:
            for i, e in enumerate(course['enrollments']):
                if e['type'] == 'observer' and 'associated_user_id' in e:
                    observer[observer_oids.index(e['associated_user_id'])]['courses'].append({
                        'course_id': str(course['id']),
                        'course_name': course['name'],
                        'sections': {
                            str(course['sections'][i]['id']): {
                                'section_id': str(course['sections'][i]['id']),
                                'section_name': course['sections'][i]['name'],
                                'students': [ { 'id': e['associated_user_id'] } ]
                            }
                        },
                        'periods': course_periods
                    })

        # Else if user is enrolled as a student, ignore other enrollments
        elif [e for e in course['enrollments'] if e['type'] == 'student']:
            for i, e in enumerate(course['enrollments']):
                student.append({
                    'course_id': str(course['id']),
                    'course_name': course['name'],
                    'sections': {
                        str(course['sections'][i]['id']): {
                            'section_id': str(course['sections'][i]['id']),
                            'section_name': course['sections'][i]['name'],
                            'students': [ { 'id': str(profile['id']) } ]
                        }
                    },
                    'periods': course_periods
                })

    user = {
        'id': str(profile['id']),
        'name': profile['name'],
        'email': profile['email'] if 'email' in profile else profile['login_id'] if 'login_id' in profile else None,
        'avatar_url': profile['avatar_url'],
        'admin': admin
    }
    if teacher: user['teacher'] = teacher
    if student: user['student'] = student
    if observer: user['observer'] = observer
    
    if user['admin']:
        user['mode'] = 'admin'
    elif 'teacher' in user:
        user['mode'] = 'teacher'
    elif 'observer' in user:
        user['mode'] = 'observer'
    else:
        user['mode'] = 'student'

    return user
   
async def terms(base_url: str, access_token):
    
    semaphore = asyncio.Semaphore(20)

    terms_url = f'{base_url}/api/v1/accounts/1/terms'
    terms_params = [
        ('workflow_state[]', 'active'), 
        ('per_page', 100)
    ]

    async with ClientSession() as client:
        terms_resp = await canvas_get(semaphore, terms_url, access_token, client, params=terms_params)
    
    now = datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')
    terms = []
    for t in terms_resp['enrollment_terms']:
        if t['start_at'] and t['end_at'] and t['start_at'] < now and t['end_at'] > now:
            terms.append({
                'id': str(t['id']),
                'name': t['name'],
                'start_at': t['start_at'],
                'end_at': t['end_at']
            })

    return terms
    

async def get_student(base_url: str, access_token: str, student_id: str):
    
    semaphore = asyncio.Semaphore(100)

    user_url = f'{base_url}/api/v1/users/{student_id}/profile'

    courses_url = f'{base_url}/api/v1/users/{student_id}/enrollments'

    async with ClientSession() as client:
        student_resp, terms_resp = await asyncio.gather( 
                                        canvas_get(semaphore, user_url, access_token, client),
                                        terms(base_url, access_token)
                                        )
    
        course_params = [
            ('type[]', 'StudentEnrollment'),
            ('enrollment_state', 'current_and_invited'),
            ('per_page', 100)
        ]

        courses_responses = await asyncio.gather(*[
            canvas_get(semaphore, courses_url, access_token, client, params= course_params + [('enrollment_term_id', t['id'])]) 
            for t in terms_resp
        ])

    student = {
        'id': str(student_resp['id']),
        'name': student_resp['name'],
        'sortable_name': student_resp['sortable_name'],
        'email': student_resp['email'] if 'email' in student_resp 
                 else student_resp['primary_email'] if 'primary_email' in student_resp 
                 else student_resp['login_id'] if 'login_id' in student_resp 
                 else None,
        'courses': []
    }
    
    for courses_resp in courses_responses:
        
        for course in [c for c in courses_resp]:
            
            student['courses'].append({
                'course_id': str(course['course_id']),
            })

    return student

async def get_multiple_students(base_url: str, access_token: str, students_ids: str):

    semaphore = asyncio.Semaphore(40)

    s_ids = students_ids.split(',')

    user_url = base_url + '/api/v1/users/%s/profile'

    courses_url = base_url + '/api/v1/users/%s/enrollments'

    async with ClientSession() as client:
        terms_resp = await asyncio.gather( 
            terms(base_url, access_token)
        )

        student_resp = await asyncio.gather(*[  
            asyncio.create_task(canvas_get(semaphore, user_url % id, access_token, client))
            for id in s_ids
        ])                        

        course_params = [
            ('type[]', 'StudentEnrollment'),
            ('enrollment_state', 'current_and_invited'),
            ('per_page', 100)
        ]

        all_course_responses = []
        for t in terms_resp[0]:
            course_params.append(('enrollment_term_id', t['id']))
            courses_responses = await asyncio.gather(*[  
                asyncio.create_task(canvas_get(semaphore, courses_url % id, access_token, client, params = course_params))
                for id in s_ids
            ])
            all_course_responses = all_course_responses + courses_responses

    students = []
    for student in student_resp:
        student_data = {
            'id': str(student['id']),
            'name': student['name'],
            'sortable_name': student['sortable_name'],
            'email': student['email'] if 'email' in student 
                    else student['primary_email'] if 'primary_email' in student 
                    else student['login_id'] if 'login_id' in student 
                    else None,
            'courses': []
        }
        students.append(student_data)
    
    for response in all_course_responses:
        for course in response:
            for student in students:
                if student['id'] == str(course['user_id']):
                    student['courses'].append({'course_id': str(course['course_id'])})

    return students

async def get_all_students(base_url: str, access_token: str):
    
    semaphore = asyncio.Semaphore(100)

    users_url = f'{base_url}/api/v1/accounts/self/users/'
    users_params = [
        ('per_page', '100'),
        ('enrollment_type', 'student')
    ]

    resp = None

    async with ClientSession() as client:
        try:
            resp = await canvas_get(semaphore, users_url, access_token, client, params=users_params)
        except:
            pass
        
    students = []
    if resp:
        now = datetime.now()
        if now.month > 7:
            current_grad_year = int(str(now.year + 1)[-2:])
        else:
            current_grad_year = int(str(now.year)[-2:])
            
        for s in resp:
            
            # Student login ids must be their email address and all student email
            # addresses have graduation year before the @
            
            if 'login_id' in s and '@' in s['login_id'] and s['login_id'].split('@')[0][-2:].isdigit():
                
                grad_year = int(s['login_id'].split('@')[0][-2:])
                grade = 12 - ( grad_year - current_grad_year)
                if grade >= 6 and grade <= 12:
                    students.append(
                        {
                            'id': str(s['id']),
                            'name': s['name'],
                            'sortable_name': s['sortable_name'],
                            'email': s['login_id'],
                            'grade': str(grade)
                        }
                    )
    return students


async def course(base_url: str, access_token: str, course: str, student: str, admin: bool, get_sections: bool = False):
    """Get course information."""
    semaphore = asyncio.Semaphore(30)

    course_url = f"{base_url}/api/v1/courses/{course}"
    course_params = [
        ('include[]', 'observed_users'),
        ('include[]', 'grading_periods'),
        ('include[]', 'sections'),
    ]

    async with ClientSession() as client:
        course = await canvas_get(semaphore, course_url, access_token, client, params=course_params)

    course_return = {
        'course_id': course['id'],
        'course_name': course['name'],
        'sections': {},
        'periods': []
    }

    # gradind periods
    if "grading_periods" in course:
        if course["grading_periods"] != "None" and course["grading_periods"] != None:
            if len(course["grading_periods"]) > 0: 
                for p in course['grading_periods']:
                    course_return['periods'].append({
                        'id': p['id'],
                        'start_at': p['start_date'],
                        'end_at': p['end_date'],
                        'name': p['title']
                    })

    # If user is enrolled as a student
    if [e for e in course['enrollments'] if e['type'] == 'student']:
        course_return['role'] = 'student'
        for i, e in enumerate(course['enrollments']):
            if str(course['sections'][i]['id']) not in course_return['sections']:
                course_return['sections'][str(course['sections'][i]['id'])] = {
                    'section_id': str(course['sections'][i]['id']),
                    'section_name': course['sections'][i]['name'],
                    'students': [ student ]
                }
    
    # If user is enrolled as a observer
    if [e for e in course['enrollments'] if e['type'] == 'observer' and 'associated_user_id' in e]:
        course_return['role'] = 'observer'
        for i, e in enumerate(course['enrollments']):
            if e['type'] == 'observer' and 'associated_user_id' in e:
                if str(course['sections'][i]['id']) not in course_return['sections']:
                    course_return['sections'][str(course['sections'][i]['id'])] = {
                        'section_id': str(course['sections'][i]['id']),
                        'section_name': course['sections'][i]['name'],
                        'students': [ { 'id': e['associated_user_id'] } ]
                    }
                else:
                    course_return['sections'][str(course['sections'][i]['id'])]['students'].append( { 'id': e['associated_user_id'] } )

    # If user is enrolled as a teacher, ignore other enrollments
    # or if enrollments is empty --> user has admin access
    if [e for e in course['enrollments'] if e['type'] == 'teacher'] or admin:
        course_return['role'] = 'teacher'
        if admin:
            course_return['role'] = 'admin'
        if get_sections:
            # Get course sections and roster
            sections_url = base_url + '/api/v1/courses/%s/sections'
            sections_params = [
                ('include[]', 'students'),
                ('per_page', 100)
            ]
            async with ClientSession() as client:
                sections = await canvas_get(semaphore, sections_url % course['id'], access_token, client, params=sections_params)
                if sections:
                    course_return['sections'] = {
                        'all': {
                            'section_id': 'all',
                            'section_name': 'all sections',
                            'students': []
                        }
                    }
                    if type(sections) != list:
                        sections = [sections]
                    for section in sections:
                        if section['students']:
                            students = [
                                {   'id': str(s['id']), 
                                    'email': s['email'] if 'email' in s else s['login_id'] if 'login_id' in s else None,
                                    'name': s['name'],
                                    'short_name': s['short_name'],
                                    'sortable_name': s['sortable_name'],
                                } for s in section['students'] 
                            ]
                            students = sorted(students, key=lambda k: k['sortable_name'])
                            course_return['sections'][section['id']] = {
                                'section_name': section['name'],
                                'section_id': section['id'],
                                'students': students
                            }
                            #course_return['sections']['all']['students'].extend(students)
                            for s in students:
                                if s not in course_return['sections']['all']['students']:
                                    course_return['sections']['all']['students'].append(s)
                    course_return['sections']['all']['students'] = sorted(course_return['sections']['all']['students'], key=lambda k: k['sortable_name'])

    return course_return


async def assignments(base_url: str, access_token: str, course: str, student: str, mode: str, assignment_id: str, number: int):
    """Get a given number of assignments for a course """
    
    semaphore = asyncio.Semaphore(20)

    assignments_url = f'{base_url}/api/v1/courses/{course}/assignments'
    if assignment_id:
        assignments_url = assignments_url + f'/{assignment_id}'
        assignments_params = []
    else:
        assignments_params = [
            ('include[]', 'all_dates'),
            ('include[]', 'assignment_visibility'),
            ('per_page', '100')
        ]

    # if mode in ['teacher', 'admin']:
    #     assignments_params += [('as_user_id', student)]

    async with ClientSession() as client:
        assignments_resp = await canvas_get(semaphore, assignments_url, access_token, client, params=assignments_params)

        # get assignment groups
        assignments_groups_url = f'{base_url}/api/v1/courses/{course}/assignment_groups'
        assignments_groups = await canvas_get(semaphore, assignments_groups_url, access_token, client, params=[('per_page', '100')])


    if assignment_id:
        assignments_resp = [assignments_resp]
    assignments = {}
    for a in assignments_resp:
        assignment = make_assignment(a, student, assignments_groups)
        assignments[str(a['id'])] = assignment

    return assignments


async def activities(base_url: str, access_token: str, course: str, student: str, section: str, user):
    
    semaphore = asyncio.Semaphore(20)

    today = datetime.now(timezone.utc)
    # Need to get the past day to pull in any new announcements
    start_date = today - timedelta(days=1)
    end_date =  today + timedelta(days=14)


    # OK Get announcements
    # OK Get calendar events
    # XX Get discussion topics <-- Unable to get discussion topic todo status
    # XX Get wiki pages <-- Unable to get discussion topic todo status
    # XX Get planner notes <-- Unable to get discussion topic todo status

    announcements_url = f'{base_url}/api/v1/announcements'
    announcements_params = [
        ('start_date', start_date.strftime('%Y-%m-%dT%H:%M:%SZ')),
        ('end_date', end_date.strftime('%Y-%m-%dT%H:%M:%SZ')),
        ('context_codes[]', f'course_{course}'),
        ('active_only', 'true'),
        ('include[]', 'sections'),
        ('per_page', 100)
    ]

    calendar_url = f'{base_url}/api/v1/calendar_events'
    calendar_params = [
        # start_date defaults to today
        ('end_date', end_date.strftime('%Y-%m-%dT%H:%M:%SZ')),
        ('context_codes[]', f'course_{course}'),
        ('per_page', 100)
    ]

    planner_url = f'{base_url}/api/v1/planner/items'
    planner_params = [
        ('start_date', start_date.strftime('%Y-%m-%dT%H:%M:%SZ')),
        ('end_date', end_date.strftime('%Y-%m-%dT%H:%M:%SZ')),
        ('context_codes[]', f'course_{course}'),
        ('per_page', 100)
    ]

    if user['admin']:
        planner_params += [('as_user_id', student)]
    
    async def empty():
        return []

    async with ClientSession() as client:
        announcements_resp, calendar_resp, planner_resp = await asyncio.gather(
            canvas_get(semaphore, announcements_url, access_token, client, params=announcements_params),
            canvas_get(semaphore, calendar_url, access_token, client, params=calendar_params),
            canvas_get(semaphore, planner_url, access_token, client, params=planner_params) if user['id'] == student else empty()
        )

    activities = {}
    for a in announcements_resp:
        if ( 'sections' not in a ) or ( section in [str(s['id']) for s in a['sections']] ):
            activities[f"announcement_{a['id']}"] = {
                'type': 'announcement',
                'date': a['posted_at'],
                'description': a['message'],
                'htmlUrl': a['html_url'],
                'name': a['title'],
                '_id': f"announcement_{a['id']}",
                'users': [student],
                'sections': [section]
            }

    
    parent_events_ids = []
    for a in calendar_resp:
        if a['parent_event_id']:
            parent_events_ids.append(f"calendar_event_{a['parent_event_id']}")
        if a['context_code'].split('_')[1] == 'section' and a['context_code'].split('_')[-1] != section:
            continue
        
        activities[f"calendar_event_{a['id']}"] = {
            'type': 'event',
            'date': a['start_at'],
            'description': a['description'],
            'startAt': a['start_at'],
            'endAt': a['end_at'],
            'htmlUrl': a['html_url'],
            'name': a['title'],
            '_id': f"calendar_{a['id']}",
            'users': [student],
            'sections': [section]
        }
    for p in parent_events_ids:
        activities.pop(p, None)

    for a in planner_resp:
        activity_id = f"{a['plannable_type']}_{a['plannable_id']}"
        if a['plannable_type'] == 'discussion_topic':
            activities[activity_id] = {
                'type': 'discussion_topic',
                'date': a['plannable_date'],
                'description': None,
                'htmlUrl': f"{base_url}{a['html_url']}",
                'name': a['plannable']['title'],
                '_id': activity_id,
                'users': [student],
                'sections': [section]
            }
        if a['plannable_type'] == 'wiki_page':
            activities[activity_id] = {
                'type': 'page',
                'date': a['plannable_date'],
                'description': None,
                'htmlUrl': f"{base_url}{a['html_url']}",
                'name': a['plannable']['title'],
                '_id': activity_id,
                'users': [student],
                'sections': [section]
            }
        if a['plannable_type'] == 'planner_note':
            activities[activity_id] = {
                'type': 'planner_note',
                'date': a['todo_date'],
                'description': None,
                'htmlUrl': a['html_url'],
                'name': a['plannable']['title'],
                '_id': activity_id,
                'users': [student],
                'sections': [section]
            }

    return activities


async def submissions(base_url: str, access_token: str, course: str, student_ids: list):

    """Get a given number of student submissions for a course """
    
    sem_num = 20
    semaphore = asyncio.Semaphore(sem_num)

    ######### Regular API #############
    
    submissions_url = base_url + f'/api/v1/courses/{course}/students/submissions'
    
    submissions_params = [
        ('include[]', 'submission_comments'),
        ('include[]', 'rubric_assessment'),
        ('include[]', 'total_scores'),
        ('include[]', 'visibility'),
        ('per_page', '100')
    ]

    s_groups = []
    num_groups = math.ceil(len(student_ids) / (sem_num-1))
    for i in range(num_groups):
        s_groups.append(student_ids[i*(sem_num-1):(i+1)*(sem_num-1)])

    async with ClientSession() as client:
        submissions_resp_parts = []
        for s_group in s_groups:
            resp = await asyncio.gather(*[
                asyncio.create_task(canvas_get(semaphore, submissions_url, access_token, client, params=submissions_params + [('student_ids[]', id)], key=id))
                for id in s_group
            ])
            submissions_resp_parts.append(resp)
        
    submissions = {}

    for part in submissions_resp_parts:
        for student in part:
            submissions[student[0]] = {}
            for s in student[1]:
                submissions[student[0]][s['assignment_id']] = make_submission(s)

    return submissions


async def submissions_graphql(base_url: str, access_token: str, course: str, student_ids: list):
    """Get a given number of student submissions for a course """
    
    semaphore = asyncio.Semaphore(20)

    ######### GraphQL API #############

    submissions_query = """query Submissions {
        course(id: "%s") {
            submissionsConnection(studentIds: "%s") {
            edges {
                node {
                submittedAt
                gradedAt
                grade
                score
                missing
                late
                excused
                user {
                    _id
                    enrollments(courseId: "%s") {
                    section {
                        name
                    }
                    }
                }
                assignment {
                    _id
                    dueAt
                    assignmentOverrides {
                    nodes {
                        dueAt
                        title
                    }
                    }
                }
                rubricAssessmentsConnection {
                    edges {
                    node {
                        assessmentRatings {
                        comments
                        points
                        criterion {
                            _id
                        }
                        }
                    }
                    }
                }
                submissionHistoriesConnection {
                    edges {
                    node {
                        rubricAssessmentsConnection {
                        edges {
                            node {
                            assessmentRatings {
                                criterion {
                                _id
                                }
                                points
                            }
                            }
                        }
                        }
                    }
                    }
                }
                commentsConnection {
                    edges {
                    node {
                        comment
                        author {
                        name
                        }
                        createdAt
                        updatedAt
                        mediaObject {
                        mediaSources {
                            url
                        }
                        mediaType
                        }
                        attachments {
                        displayName
                        url
                        }
                    }
                    }
                }
                }
            }
            }
        }
        }"""

    async with ClientSession() as client:
        tasks = []
        for id in student_ids:
            tasks.append(asyncio.create_task(canvas_graphql(semaphore, base_url, access_token, client, query=submissions_query % (course, id, course))))

        responses = await asyncio.gather(*tasks, return_exceptions=False)
    
    submissions = {}

    for student in responses:
        for submission in student['data']['course']['submissionsConnection']['edges']:
            user_id = submission['node']['user']['_id']
            assignment_id = submission['node']['assignment']['_id']
            if int(user_id) not in submissions:
                submissions[int(user_id)] = {}
            submissions[int(user_id)][int(assignment_id)] = make_submission_graphql(submission)    

    return submissions


async def assignment(base_url: str, access_token: str, course_id: str, student_id: str, assignment_id: str):
    
    semaphore = asyncio.Semaphore(20)

    assignments_url = base_url + f'/api/v1/courses/{course_id}/assignments/{assignment_id}/submissions/{student_id}'
    assignments_params = [
        ('include[]', 'assignment'),
        ('include[]', 'submission_comments'),
        ('include[]', 'rubric_assessment'),
        ('include[]', 'total_scores'),
        ('include[]', 'visibility'),
    ]

    async with ClientSession() as client:
        assignment_response = await canvas_get(semaphore, assignments_url, access_token, client, params=assignments_params)

        # get assignment groups
        assignments_groups_url = f'{base_url}/api/v1/courses/{course_id}/assignment_groups'
        assignments_groups = await canvas_get(semaphore, assignments_groups_url, access_token, client)

    return make_assignment(assignment_response, student_id, assignments_groups)


async def outcomes_report(base_url: str, access_token: str, course_id: int, student_id: int, mode: str):
    """Get assignments and submissions with outomes for a student"""
    semaphore = asyncio.Semaphore(20)

    outcomes_url = base_url + '/api/v1/courses/%s/outcome_rollups'
    outcomes_params = [
        ('aggregate', 'course'),
        ('include[]', 'outcomes'),
        ('user_ids[]', student_id)
    ]

    # GRAPHQL ONLY WORKS FOR SUBMISSIONS FOR TEACHER ACCOUNTS
    # AND IS NOT ABLE TO GET OUTCOMES MARKINGS OF UNGRADED ASSIGNMENTS 

    # if mode in ['teacher']:
        
    #     submissions_query = """query Submissions {
    #         course(id: "%s") {
    #             id
    #             submissionsConnection(studentIds: "%s") {
    #             edges {
    #                 node {
    #                 id
    #                 assignment {
    #                     _id
    #                     name
    #                     htmlUrl
    #                     dueAt
    #                 }
    #                 rubricAssessmentsConnection {
    #                     edges {
    #                     node {
    #                         assessmentRatings {
    #                         comments
    #                         outcome {
    #                             _id
    #                         }
    #                         points
    #                         }
    #                     }
    #                     }
    #                 }
    #                 submittedAt
    #                 gradedAt
    #                 }
    #             }
    #             }
    #         }
    #     }""" % (course_id, student_id)

    #     # Get outcomes and submissions
    #     async with ClientSession() as client:
    #         outcomes_resp, submissions_resp = await asyncio.gather(
    #             canvas_get(semaphore, outcomes_url % course_id, access_token, client, params=outcomes_params),
    #             canvas_graphql(semaphore, base_url, access_token, client, query=submissions_query))

    #     outcomes = {}
    #     for outcome in outcomes_resp['linked']['outcomes']:
    #         outcomes[outcome['id']] = {
    #             'title': outcome['title'],
    #             'description': outcome['description'].replace('\n', '<br/>') if outcome['description'] else '',
    #             'points_possible': outcome['points_possible'],
    #             'mastery_points': outcome['mastery_points'],
    #             'ratings': outcome['ratings'],
    #             'assessments': [],
    #         }
        
    #     for submission in submissions_resp['data']['course']['submissionsConnection']['edges']:
    #         if submission['node']['rubricAssessmentsConnection']['edges']:
    #             for rating in submission['node']['rubricAssessmentsConnection']['edges'][0]['node']['assessmentRatings']:
    #                 dueAt = submission['node']['assignment']['dueAt']
    #                 if not dueAt: dueAt = submission['node']['submittedAt']
    #                 if not dueAt: dueAt = submission['node']['gradedAt']
    #                 try:
    #                     outcomes[int(rating['outcome']['_id'])]['assessments'].append({
    #                         'assignment_id': int(submission['node']['assignment']['_id']),
    #                         'name': submission['node']['assignment']['name'],
    #                         'htmlUrl': submission['node']['assignment']['htmlUrl'],
    #                         'dueAt': dueAt,
    #                         'comments': rating['comments'].replace('\n','<br/>') if 'comment' in rating and type(rating['comments']) == str else '',
    #                         'points': rating['points']
    #                     })
    #                 except TypeError:
    #                     pass

    # else: # mode == 'observer' or 'student' or 'admin'
        
    submissions_url = base_url + "/api/v1/courses/%s/students/submissions"
    submissions_params = [
        ('student_ids[]', student_id),
        ('include[]', 'rubric_assessment'),
        ('include[]', 'assignment'),
        ('per_page', '100')
    ]
    # Get outcomes and submissions
    async with ClientSession() as client:
        outcomes_resp, submissions_resp = await asyncio.gather(
            canvas_get(semaphore, outcomes_url % course_id, access_token, client, params=outcomes_params),
            canvas_get(semaphore, submissions_url % course_id, access_token, client, params=submissions_params))
    
    outcomes = {}
    for outcome in outcomes_resp['linked']['outcomes']:
        outcomes[outcome['id']] = {
            'title': outcome['title'],
            'description': outcome['description'].replace('\n', '<br/>') if outcome['description'] else '',
            'points_possible': outcome['points_possible'],
            'mastery_points': outcome['mastery_points'],
            'ratings': outcome['ratings'],
            'assessments': [],
        }
    for submission in submissions_resp:
        if 'rubric_assessment' in submission:
            for rating in submission['rubric_assessment']:
                dueAt = submission['assignment']['due_at']
                if not dueAt: dueAt = submission['submitted_at']
                if not dueAt: dueAt = submission['graded_at']
                if not dueAt: dueAt = submission['assignment']['created_at']
                if 'rubric' in submission['assignment']:
                    rubric = {c['id']:c for c in submission['assignment']['rubric']} 
                    try:
                        outcomes[int(rubric[rating]['outcome_id'])]['assessments'].append({
                            'assignment_id': int(submission['assignment']['id']),
                            'name': submission['assignment']['name'],
                            'htmlUrl': submission['assignment']['html_url'],
                            'dueAt': dueAt,
                            'comments': submission['rubric_assessment'][rating]['comments'].replace('\n','<br/>') if 'comments' in submission['rubric_assessment'][rating] and type(submission['rubric_assessment'][rating]['comments']) == str else '',
                            'points': submission['rubric_assessment'][rating]['points'] if 'points' in submission['rubric_assessment'][rating] else None
                        })
                    except KeyError:
                        pass

    for id in outcomes:
        outcomes[id]['assessments'] = sorted(outcomes[id]['assessments'], key=lambda k: k['dueAt'], reverse=True)
    return outcomes

async def outcomes_report_alt(base_url: str, access_token: str, course_id: int, student_ids: str, mode: str):
    """Get assignments and submissions with outomes for a student"""

    time_start = time.perf_counter()
    semaphore = asyncio.Semaphore(40)
    
    student_ids = str(student_ids).split(',')
    student_ids = list(filter(None, student_ids))
    #student_ids = []
    #student_ids = ["161","505","533","535","3114","320","1395","1531","3384","1639","539","246"]

    # GRAPHQL IS NOT ABLE TO GET OUTCOMES MARKINGS OF UNGRADED ASSIGNMENTS
        
    submissions_query = """query Submissions {
        course(id: "%s") {
            id
            submissionsConnection(studentIds: "%s") {
                edges {
                    node {
                        id
                        assignment {
                            _id
                            name
                            htmlUrl
                            dueAt
                        }
                        rubricAssessmentsConnection {
                            edges {
                                node {
                                    assessmentRatings {
                                        comments
                                        outcome {
                                            _id
                                            title
                                            description
                                        }
                                        points
                                        criterion {
                                            masteryPoints
                                            points
                                            ratings {
                                                description
                                                points
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        submittedAt
                        gradedAt
                        user {
                            _id
                        }
                    }
                }
            }
        }
    }"""

    # Get outcomes and submissions
    async with ClientSession() as client:
        tasks = []
        for id in student_ids:
            tasks.append(asyncio.create_task(canvas_graphql(semaphore, base_url, access_token, client, query=submissions_query % (course_id, id))))

        responses = await asyncio.gather(*tasks, return_exceptions=False)

    print(time.perf_counter() - time_start)

    outcomes = {}
    for student in student_ids:
        outcomes[student] = {}

    # outcomes
    for student in responses:
        for submission in student['data']['course']['submissionsConnection']['edges']:
            if submission['node']['rubricAssessmentsConnection']['edges']:
                for rating in submission['node']['rubricAssessmentsConnection']['edges'][0]['node']['assessmentRatings']:
                    try:
                        outcomes[submission['node']['user']['_id']][int(rating['outcome']['_id'])] = {
                            'title': rating['outcome']['title'],
                            'description': rating['outcome']['description'],
                            'points_possible': rating['criterion']['points'],
                            'mastery_points': rating['criterion']['masteryPoints'],
                            'ratings': rating['criterion']['ratings'],
                            'assessments': [],
                        }
                    except TypeError:
                        pass

    # submissions
    for student in responses:
        for submission in student['data']['course']['submissionsConnection']['edges']:
            if submission['node']['rubricAssessmentsConnection']['edges']:
                for rating in submission['node']['rubricAssessmentsConnection']['edges'][0]['node']['assessmentRatings']:
                    dueAt = submission['node']['assignment']['dueAt']
                    if not dueAt: dueAt = submission['node']['submittedAt']
                    if not dueAt: dueAt = submission['node']['gradedAt']
                    try:
                        outcomes[submission['node']['user']['_id']][int(rating['outcome']['_id'])]['assessments'].append({
                            'assignment_id': int(submission['node']['assignment']['_id']),
                            'name': submission['node']['assignment']['name'],
                            'htmlUrl': submission['node']['assignment']['htmlUrl'],
                            'dueAt': dueAt,
                            'comments': rating['comments'].replace('\n','<br/>') if 'comment' in rating and type(rating['comments']) == str else '',
                            'points': rating['points']
                        })
                    except TypeError:
                        pass
    
    print(time.perf_counter() - time_start)
    print(outcomes)
    for student in outcomes:     
        for id in outcomes[student]:
            outcomes[student][id]['assessments'] = sorted(outcomes[student][id]['assessments'], key=lambda k: k['dueAt'], reverse=True)
    return outcomes

async def outcome_results(base_url: str, access_token: str, course_id: int, student_ids: list):
    """Get outcome results and outcomes for a list of students"""
    
    semaphore = asyncio.Semaphore(20)
    
    outcomes_results_url = base_url + '/api/v1/courses/%s/outcome_results'

    async with ClientSession() as client:
        
        outcomes_results_params = [
            ('include[]', 'outcomes'),
            ('per_page', 100)
        ]

        outcomes_results_responses = await asyncio.gather(*[
            asyncio.create_task(canvas_get(semaphore, outcomes_results_url % course_id, access_token, client, params=outcomes_results_params + [('user_ids[]', str(id))]))
            for id in student_ids
        ])
    
    # Get dict of outcomes from the first response
    outcomes = {}
    if outcomes_results_responses:
        for outcome in outcomes_results_responses[0]['linked']['outcomes']:
            outcomes[str(outcome['id'])] = {
                'title': outcome['title'],
                'results': []
            }

    outcome_results = {}
    for outcomes_results_resp in outcomes_results_responses:
        for result in outcomes_results_resp['outcome_results']:
            if result['links']['user'] not in outcome_results:
                outcome_results[result['links']['user']] = deepcopy(outcomes)
            outcome_results[result['links']['user']][result['links']['learning_outcome']]['results'].append({
                'points': result['score'],
                'date': result['submitted_or_assessed_at'],
                'asssignment_id': result['links']['assignment'].split('_')[-1]
            })
    
    for student in outcome_results:
        for outcome in outcome_results[student]:
            outcome_results[student][outcome]['results'] = sorted(outcome_results[student][outcome]['results'], key=lambda k: k['date'], reverse=True)

    return outcome_results


async def canvas_get(sem, url: str, access_token: str, client: ClientSession, params=None, resp_data=[], key=None, one_page=False):
    """Perorm a GET request to the Canvas API.
    
    Keyword arguments:
    params -- any request parameters
    resp_data -- Initially an empty list that will be concatenated asynchonously if the response has
                multiple pages;
                if response is a string or dictionary it will not be paginated, so resp_data is 
                overwritten.
    """

    global api_quota

    async with sem:

        headers = {"Authorization": "Bearer %s" % access_token}

        if api_quota < 150:
            while api_quota < 620:
                print("API limit reached...")
                time.sleep(1)
                async with client.get(url=url, headers=headers, params=params, ssl=True) as resp:
                    new_resp_data = await resp.json()
                    api_quota = float(resp.headers['X-Rate-Limit-Remaining'])

        async with client.get(url=url, headers=headers, params=params, ssl=True) as resp:
            resp.raise_for_status()
            new_resp_data = await resp.json()
            api_quota = float(resp.headers['X-Rate-Limit-Remaining'])
            
            print(url)
            #print(resp.headers['X-Request-Cost'])
            #print(resp.headers['X-Rate-Limit-Remaining'])
            #print(resp.links)

            # Handle type of response.
            resp_data = append_response(resp_data, new_resp_data)            
            
            # Handle pagination
            if not one_page and 'next' in resp.links.keys():
                # If this is the first page
                if resp.links['current']['url'] == resp.links['first']['url']:
                    if 'last' in resp.links:
                        last_page_url = str(resp.links['last']['url'])
                        num_pages = int(last_page_url[
                            last_page_url.find("page=") + len("page="):last_page_url.rfind("&per_page")
                        ])

                        urls = []
                        for page in range(num_pages-1):
                            url = last_page_url
                            if '?page=' in url:
                                url = url.replace("?page=" + str(num_pages), "?page=" + str(page+2))
                            else:
                                url = url.replace("&page=" + str(num_pages), "&page=" + str(page+2))
                            urls.append(url)
                        pgs_data = await asyncio.gather(*[
                            asyncio.create_task(canvas_get(sem, page_url, access_token, client, resp_data=[], key=key, one_page=True)) for page_url in urls
                        ])
                        for new_resp_data in pgs_data:
                            resp_data = append_response(resp_data, new_resp_data)
                        return resp_data
                    elif '?page=1&' in str(resp.links['current']['url']) or '&page=1&' in str(resp.links['current']['url']):
                        repeat = True
                        counter = 0

                        while repeat:
                            urls = []
                            for x in range(counter*10,(counter*10)+10):
                                next_page = str(resp.links['first']['url']).replace("page=1&", "page=" + str(x+2) + "&") 
                                urls.append(next_page)
                            
                            pgs_data = await asyncio.gather(*[
                                asyncio.create_task(canvas_get(sem, page_url, access_token, client, resp_data=[], key=key, one_page=True)) for page_url in urls
                            ])

                            for new_resp_data in pgs_data:
                                resp_data = append_response(resp_data, new_resp_data)
                                if len(new_resp_data) == 0:
                                    repeat = False
                            counter += 1

                        return resp_data                  
                    else:
                        return await canvas_get(sem, resp.links['next']['url'], access_token, client, resp_data=resp_data, key=key)
                else:
                    return await canvas_get(sem, resp.links['next']['url'], access_token, client, resp_data=resp_data, key=key)  
            # There are no more pages
            else:
                if key:
                    return (key, resp_data)
                else:
                    return resp_data  

async def canvas_get_links(sem, url: str, access_token: str, client: ClientSession, params=None, resp_data=[], key=None, one_page=False):
    async with sem:
        headers = {"Authorization": "Bearer %s" % access_token}
        async with client.head(url=url, headers=headers, params=params, ssl=True) as resp:
            #print(url)
            #print(resp.links)
            print(resp.headers['X-Rate-Limit-Remaining'])
            if(resp.links != None):
                if('next' in resp.links):
                    print('test')
                    print(resp.links['next']['url'])
                    asyncio.create_task(canvas_get_links(sem, resp.links['next']['url'], access_token, client))

                return resp.links
            # #print(params)
            # resp.raise_for_status()
            # new_resp_data = await resp.json()
            # #print(resp.headers['X-Request-Cost'])
            # print(resp.headers['X-Rate-Limit-Remaining'])
            # #print(resp.links)

async def canvas_get_alt(sem, url: str, access_token: str, client: ClientSession, params=None, resp_data=[], key=None, one_page=False):
    """Perorm a GET request to the Canvas API.
    
    Keyword arguments:
    params -- any request parameters
    resp_data -- Initially an empty list that will be concatenated asynchonously if the response has
                multiple pages;
                if response is a string or dictionary it will not be paginated, so resp_data is 
                overwritten.
    """
        
    async with sem:
        headers = {"Authorization": "Bearer %s" % access_token}
        async with client.get(url=url, headers=headers, params=params, ssl=True) as resp:
            print(url)
            #print(params)
            resp.raise_for_status()
            new_resp_data = await resp.json()
            #print(resp.headers['X-Request-Cost'])
            print(resp.headers['X-Rate-Limit-Remaining'])
            #print(resp.links)
            
            # Handle type of response.
            resp_data = append_response(resp_data, new_resp_data)            
            
            # Handle pagination
            if not one_page and 'next' in resp.links.keys():
                # If this is the first page
                if resp.links['current']['url'] == resp.links['first']['url']:
                    # if 'last' in resp.links:
                    #     page_url = str(resp.links['last']['url'])
                    #     #print(last_page_url)
                    #     num_pages = int(page_url[
                    #         page_url.find("page=") + len("page="):page_url.rfind("&per_page")
                    #     ])
                    # else:
                    page_url = str(resp.links['current']['url'])
                    num_pages = 5

                    urls = []
                    for page in range(num_pages-1):
                        url = page_url
                        print(url)
                        if '&page=first' in url:
                            url = url.replace("&page=first", "&page=" + str(page+2))
                        else:
                            url = url.replace("&page=1", "&page=" + str(page+2))
                        urls.append(url)
                    pgs_data = await asyncio.gather(*[
                        asyncio.create_task(canvas_get(sem, page_url, access_token, client, resp_data=resp_data, key=key, one_page=True)) for page_url in urls
                    ])
                    for new_resp_data in pgs_data:
                        resp_data = append_response(resp_data, new_resp_data)
                    return resp_data
                    #else:                      
                    #    return await canvas_get(sem, resp.links['next']['url'], access_token, client, resp_data=resp_data, key=key)
                else:
                    return await canvas_get(sem, resp.links['next']['url'], access_token, client, resp_data=resp_data, key=key)
            # There are no more pages
            else:
                if key:
                    return (key, resp_data)
                else:
                    return resp_data


def append_response(resp_data, new_resp_data):
    """Returns combination of prior pages' data and the current page's data."""
    if type(new_resp_data) == list:
        resp_data = resp_data + new_resp_data
    else:
        resp_data = new_resp_data  
    return resp_data

async def canvas_graphql(sem, base_url: str, access_token: str, client: ClientSession, query: str, variables: str = None, key = None):
    """Perorm a POST request to the Canvas GraphQL API.
    
    Keyword arguments:
    variables -- any query variables
    """

    async with sem:
        headers = {"Authorization": "Bearer %s" % access_token}
        data = {
            'query': query,
            'variables': variables
        }
        resp = await client.post(url=base_url+'/api/graphql', headers=headers, json=data, ssl=False)
        resp.raise_for_status()
        resp_data = await resp.json()
        print(resp.headers['x-rate-limit-remaining'])
        print(resp.headers['x-request-cost'])
        
        # Handle pagination ???

        if key: 
            return (key, resp_data)
        else: 
            return resp_data


def make_assignment(a, student, groups=None):
    """Build the assignment dictionary from a Canvas assignment response."""
    assignment = {
        'description': a['description'],
        #'dueAt': a['due_at'],
        'gradingType': a['grading_type'],
        'htmlUrl': a['html_url'],
        'name': a['name'],
        'dueAt': [],
        'pointsPossible': a['points_possible'],
        'submittable': set(a['submission_types']).isdisjoint(['none', 'on_paper']),
        '_id': str(a['id']),
        'published': a['published']
    }
    if len(a['all_dates']) > 1:
        for d in a['all_dates']:
            if 'set_type' in d:
                if d['set_type'] == 'CourseSection':
                    assignment['dueAt'].append({ 'section': d['set_id'], 'date': d['due_at'] })
    else:
        assignment['dueAt'].append({ 'section': 'everyone', 'date': a['due_at'] })

    if student:
        assignment['users'] = [student]
    else:
        assignment['users'] = a['assignment_visibility'] if 'assignment_visibility' in a else None
    if 'rubric' in a:
        rubric = {}
        for c in a['rubric']:
            rubric[c['id']] = {
                'description': c['description'],
                'longDescription': c['long_description'],
                'outcome_id': str(c['outcome_id']) if 'outcome_id' in c else None,
                'points': c['points'],
                'ratings': [ {key: rating[key] for key in rating if key != 'id'} for rating in c['ratings'] ]
            }
        assignment['rubric'] = rubric
    for assignment_group in groups:
        if a['assignment_group_id'] == assignment_group['id']:
            assignment['assignment_group'] = assignment_group['name']

    return assignment


def make_submission(s):
    """Add the student submission information to an assignment dictionary from a Canvas submission response."""
    submission = {
        '_id': str(s['assignment_id']),
        'student_id': str(s['user_id']),
        'comments': [ { 
            'author_name': comment['author_name'],
            'comment': comment['comment'],
            'updatedAt': comment['edited_at'] if 'edited_at' in comment and comment['edited_at'] else comment['created_at'],
            'video_url': comment['media_comment']['url'] if 'media_comment' in comment and comment['media_comment']['media_type'] == 'video' else None,
            'attachments': [ { k: a[k] for k in ['display_name', 'url'] } for a in comment['attachments'] ] if 'attachments' in comment else None
            } for comment in s['submission_comments'] ],
        'excused': s['excused'],
        'grade': s['grade'] if 'grade' in s else None,
        'dueAt': s['cached_due_date'],
        'gradedAt': s['gradedAt'] if 'gradedAt' in s else None,
        'submitted_at': s['submitted_at'],
        'late': s['late'],
        'missing': s['missing'],
        'score': s['score'] if 'score' in s else None,
        'assignment_visible': s['assignment_visible'],
    }
    
    if 'rubric_assessment' in s:
        submission['rubric'] = {}
        for key, rating in s['rubric_assessment'].items():
            submission['rubric'][key] = {
                'comments': rating['comments'] if 'comments' in rating and type(rating['comments']) == str else '',
                'points': rating['points']  if 'points' in rating else None
            }

    submission['complete'] = complete(s)

    return submission

def make_submission_graphql(s):
    """Add the student submission information to an assignment dictionary from a Canvas submission response."""
    submission = {
        '_id': str(s['node']['assignment']['_id']),
        'student_id': str(s['node']['user']['_id']),
        'comments': [ { 
            'author_name': comment['node']['author']['name'],
            'comment': comment['node']['comment'],
            'updatedAt': comment['node']['updatedAt'] if 'updatedAt' in comment['node'] and comment['node']['updatedAt'] else comment['node']['createdAt'],
            'video_url': None,
            'video_url': comment['node']['mediaObject']['mediaSources']['url'] if 'mediaObject' in comment['node'] and comment['node']['mediaObject'] and 'mediaSources' in comment['node']['mediaObject'] and 'mediaType' in comment['node']['mediaObject'] and comment['node']['mediaObject']['mediaType'] == 'video' else None,
            'attachments': [ { k: a[k] for k in ['displayName', 'url'] } for a in comment['node']['attachments'] ] if 'attachments' in comment['node'] and len(comment['node']['attachments']) > 0 else None
            } for comment in s['node']['commentsConnection']['edges'] ],
        'excused': s['node']['excused'],
        'grade': s['node']['grade'] if 'grade' in s['node'] else None,
        'dueAt': s['node']['assignment']['dueAt'],
        'gradedAt': s['node']['gradedAt'] if 'gradedAt' in s['node'] else None,
        'submitted_at': s['node']['submittedAt'],
        'late': s['node']['late'],
        'missing': s['node']['missing'],
        'score': s['node']['score'] if 'score' in s['node'] else None,
        'assignment_visible': True,
    }

    # get dueAt for assignments with multiple dates
    if submission['dueAt'] is None and len(s['node']['assignment']['assignmentOverrides']['nodes']) > 0:
        user_sections = []
        for section in s['node']['user']['enrollments']:
            if section['section']['name'] is not None and section['section']['name'] != '':
                user_sections.append(section['section']['name'])
        for due_at in s['node']['assignment']['assignmentOverrides']['nodes']:
            if due_at['title'] in user_sections:
                submission['dueAt'] = due_at['dueAt']
        if submission['dueAt'] is None:
            submission['dueAt'] = s['node']['assignment']['assignmentOverrides']['nodes'][0]['dueAt']

    # adjust assignment visibility
    user_sections = []
    for section in s['node']['user']['enrollments']:
        if section['section']['name'] is not None and section['section']['name'] != '':
            user_sections.append(section['section']['name'])
    if len(user_sections) == 0 and submission['grade'] is None:
        submission['assignment_visible'] = False
    
    if len(s['node']['rubricAssessmentsConnection']['edges']) > 0:
        submission['rubric'] = {}
      
        for rating in s['node']['rubricAssessmentsConnection']['edges'][0]['node']['assessmentRatings']:
            if 'criterion' in rating and rating['criterion'] and '_id' in rating['criterion'] and rating['criterion']['_id']:
                submission['rubric'][rating['criterion']['_id']] = {
                    'comments': rating['comments'] if 'comments' in rating and type(rating['comments']) == str else '',
                    'points': rating['points']  if 'points' in rating else None
                }

    submission['complete'] = complete(s['node'])

    return submission

def complete(submission):
    """ Handle messy completion, missing, grade, etc"""
    if 'grade' not in submission: return None
    if submission['grade'] == None: return None
    if submission['grade'] == 'complete': return True
    if submission['grade'] == 'incomplete': return False
    if submission['missing'] == True: return False
    if submission['grade'] == 0: return False
    if submission['grade'] == "0%": return False
    if submission['grade'] == "": return None
    if type(submission['grade']) == str: return True