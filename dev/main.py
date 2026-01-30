import asyncio
import requests
import os
import json
from functools import wraps
import werkzeug
from flask import Flask, session, render_template, request, redirect, send_from_directory, abort, make_response
from flask_cors import CORS, cross_origin
from flask_session import Session
import redis
from datetime import datetime, timedelta, timezone

# Using a locally patched version of flask-session library
# until flask-session releases support for SameSite argument
from flask_session_patch import Session

from api import (canvas_oauth, canvas_api, secrets)
from api.exceptions import (MissingTokenError, InvalidOAuthStateError,
                             InvalidOAuthReturnError)


# Import environment variables
base_url = os.environ["CANVAS_BASE_URL"]
redis_host = os.environ.get('REDISHOST', 'localhost')
redis_port = int(os.environ.get('REDISPORT', 6379))

# Setup Redis to handle Flask sessions
SESSION_TYPE = 'redis'
SESSION_REDIS = redis.Redis(host=redis_host, port=redis_port, db=0)

# Create Flask app
app = Flask(__name__)
app.config.from_object(__name__)
app.config.setdefault("SESSION_COOKIE_NAME", "session")
# Backward-compat for older Flask-Session patches expecting this attribute.
app.session_cookie_name = app.config["SESSION_COOKIE_NAME"]
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
)

Session(app)
app.permanent_session_lifetime = timedelta(hours=12)

flask_session_key = os.environ.get("FLASK_SESSION_KEY")
if not flask_session_key:
    secret_id = os.environ.get("FLASK_SESSION_KEY_SECRET_ID", "flask_session_key")
    flask_session_key = secrets.get_secret(secret_id)
app.secret_key = flask_session_key.encode('utf-8')

if not os.getenv('GAE_ENV', '').startswith('standard'):
    app.config['CORS_HEADERS'] = 'Content-Type'
    cors = CORS(app, resources={r"/api/*": {"origins": "http://localhost:4200"}}, supports_credentials=True, methods="GET", allow_headers=["Content-Type", "Access-Control-Allow-Origin"])
    
#
# DECORATORS
#
def check_lti_for_session_cookie(f):
    """ Check for browser and version, and handle cookie behavior
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.path.split('/')[1] == 'lti' or request.args.get('lti') == 'true':
            if request.user_agent.browser == 'safari':
                if request.url.split('/')[-1] == 'dashboard':
                    url =  f'{request.url_root}'
                    return render_template('lti_redirect.html', url=url)
                elif request.url.split('/')[-1] == 'course':
                    course_id = request.form.get('custom_canvas_course_id')
                    canvas_user_id = request.form.get('custom_canvas_user_id')
                    roles = request.form.get('roles')
                    if course_id and canvas_user_id and roles:
                        url = f'{request.url_root}course/{course_id}'
                        if roles == 'Learner':
                            url = url + f'/student/{canvas_user_id}/'
                        return render_template('lti_redirect.html', url=url)
            app.config.update(SESSION_COOKIE_SAMESITE='None')
        else:
            app.config.update(SESSION_COOKIE_SAMESITE='Lax')
            
        return f(*args, **kwargs)
    return decorated_function

def check_login(f):
    """ Check for access_token and for 'user' stored in session. Handle if missing.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        access_token = canvas_oauth.get_oauth_token(request, session)
        if not access_token:
            return canvas_oauth.handle_missing_token(request, session)
        if not session.get('user', None): 
            session['user'] = asyncio.run(canvas_api.user(base_url, access_token)) 
        return f(*args, **kwargs)
    return decorated_function


#
# ROUTES
#
@app.route('/')
@app.route('/directory/')
@app.route('/dashboard/<path:path>')
@app.route('/course/<path:path>')
@app.route('/admin/')
@app.route('/admin/<path:path>')
@check_lti_for_session_cookie
@check_login
def root(path=''):
    """ Route to all frontend endpoints provided by Angular
    """
    return render_template('index.html')


@app.route('/lti/course', methods=['POST', 'GET'])
@check_lti_for_session_cookie
def lti_course(path=''):
    """ Route LTI to course
    """

    course_id = request.form.get('custom_canvas_course_id')
    canvas_user_id = request.form.get('custom_canvas_user_id')
    roles = request.form.get('roles')
    
    path = f'/course/{course_id}'
    if roles == 'Learner':
        path = path + f'/student/{canvas_user_id}'
    
    path = path + '?lti=true'

    resp = make_response(redirect(path))

    return resp


@app.route('/lti/dashboard', methods=['POST', 'GET'])
@check_lti_for_session_cookie
def lti_dashboard(path=''):
    """ Route LTI to Dashboard
    """
    path = '/'

    path = path + '?lti=true'

    resp = make_response(redirect(path))

    return resp

@app.route('/lti/admin', methods=['POST', 'GET'])
@check_lti_for_session_cookie
def lti_admin(path=''):
    """ Route LTI to Dashboard
    """
    path = '/admin'

    path = path + '?lti=true'

    resp = make_response(redirect(path))

    return resp

#
# API Routes
#
@app.route('/api/user/')
@cross_origin(origin='https://localhost:4200')
@check_login
def user():
    """ Return Canvas user object.
    """
    r = make_response(session['user'])
    r.mimetype = 'application/json'
    return r

@app.route('/api/terms/')
@cross_origin(origin='https://localhost:4200')
@check_login
def terms():
    """ Get list of terms.
    """
    terms = asyncio.run(canvas_api.terms(base_url, canvas_oauth.get_oauth_token(request, session)))
    if terms:
        r = make_response(json.dumps(terms))
        r.mimetype = 'application/json'
    else:
        r = make_response("Terms not found.", 404)
    return r

@app.route('/api/student/<student_id>/')
@cross_origin(origin='https://localhost:4200')
@check_login
def student(student_id):
    """ Get a student.
    """
    student = asyncio.run(canvas_api.get_student(base_url, canvas_oauth.get_oauth_token(request, session), student_id))
    if student:
        r = make_response(json.dumps(student))
        r.mimetype = 'application/json'
    else:
        r = make_response("Student not found.", 404)
    return r

@app.route('/api/get_multiple_students/<students_ids>/')
@cross_origin(origin='https://localhost:4200')
@check_login
def get_multiple_students(students_ids):
    """ Get multiple students available to current user 
    """
    students = asyncio.run(canvas_api.get_multiple_students(base_url, canvas_oauth.get_oauth_token(request, session), students_ids))
    if students:
        r = make_response(json.dumps(students))
        r.mimetype = 'application/json'
    else:
        r = make_response("No students available.", 404)
    return r

@app.route('/api/get_students/')
@cross_origin(origin='https://localhost:4200')
@check_login
def get_students():
    """ Get all students available to current user 
    """
    students = asyncio.run(canvas_api.get_all_students(base_url, canvas_oauth.get_oauth_token(request, session)))
    if students:
        r = make_response(json.dumps(students))
        r.mimetype = 'application/json'
    else:
        r = make_response("No students available.", 404)
    return r

@app.route('/api/course/<course_id>/')
@cross_origin(origin='https://localhost:4200')
@check_login
def course(course_id):
    """ Call canvas_api.course() and return response
    """
    student_id = request.args.get('student', None)
    get_sections = request.args.get('get_sections', None) == 'true'
    course = asyncio.run(canvas_api.course(base_url, canvas_oauth.get_oauth_token(request, session), course_id, student_id, session['user']['admin'], get_sections=get_sections))
    if course:
        r = make_response(json.dumps(course))
        r.mimetype = 'application/json'
    else:
        r = make_response("Data not found.", 404)
    return r
    
@app.route('/api/assignments/')
@cross_origin(origin='https://localhost:4200')
@check_login
def assignments():
    """ Call canvas_api.assignments() and return response
    """
    course = request.args.get('course')
    student = request.args.get('student', None)
    assignment_id = request.args.get('assignment', None)
    number = int(request.args.get('number', 9999999))
    
    assignments = asyncio.run(canvas_api.assignments(base_url, canvas_oauth.get_oauth_token(request, session), course, student, session['user']['mode'], assignment_id, number))
    r = make_response(assignments, 200)
    r.mimetype = 'application/json'
        
    return r

@app.route('/api/activities/')
@cross_origin(origin='https://localhost:4200')
@check_login
def activities():
    """ Call canvas_api.activities() and return response
    """
    course = request.args.get('course')
    section = request.args.get('section')
    student = request.args.get('student')
    
    events = asyncio.run(canvas_api.activities(base_url, canvas_oauth.get_oauth_token(request, session), course, student, section, session['user']))
    r = make_response(events, 200)
    r.mimetype = 'application/json'
        
    return r

@app.route('/api/submissions/')
@cross_origin(origin='https://localhost:4200')
@check_login
def submissions():
    """ Call canvas_api.submissions() and return response
    """
    students = request.args.getlist('student[]')
    course = request.args.get('course')

    submissions = asyncio.run(canvas_api.submissions(base_url, canvas_oauth.get_oauth_token(request, session), course, students))

    r = make_response(submissions, 200)
    r.mimetype = 'application/json'
        
    return r


@app.route('/api/assignment/courses/<course_id>/student/<student_id>/assignment/<assignment_id>')
@cross_origin(origin='https://localhost:4200')
@check_login
def assignment(course_id, student_id, assignment_id):
    """ Call canvas_api.courses_assignments() and return response
    """

    assignments = asyncio.run(canvas_api.assignment(base_url, canvas_oauth.get_oauth_token(request, session), course_id, student_id, assignment_id))
    r = make_response(assignments, 200)
    r.mimetype = 'application/json'

    return r


@app.route('/api/outcomes/student/<student_id>/course/<course_id>/')
@cross_origin(origin='https://localhost:4200')
@check_login
def outcomes(course_id, student_id):
    """ Call canvas_api.outcomes_report() and return response
    """
    outcomes = asyncio.run(canvas_api.outcomes_report(base_url, canvas_oauth.get_oauth_token(request, session), int(course_id), int(student_id), session['user']['mode']))
    r = make_response(outcomes)
    r.mimetype = 'application/json'
    return r

@app.route('/api/outcomes/course/<course_id>/students/<students_ids>')
@cross_origin(origin='https://localhost:4200')
@check_login
def outcomesalt(course_id, students_ids):
    """ Call canvas_api.outcomes_report() and return response
    """
    outcomes = asyncio.run(canvas_api.outcomes_report_alt(base_url, canvas_oauth.get_oauth_token(request, session), int(course_id), str(students_ids), session['user']['mode']))
    r = make_response(outcomes)
    r.mimetype = 'application/json'
    return r

@app.route('/api/outcome_results/course/<course_id>')
@cross_origin(origin='https://localhost:4200')
@check_login
def outcome_results(course_id):
    """ Call canvas_api.outcome_results() and return response
    """
    course_id = int(course_id)
    student_ids = [int(s) for s in request.args.getlist('student[]')]
    outcomes_results = asyncio.run(canvas_api.outcome_results(base_url, canvas_oauth.get_oauth_token(request, session), course_id, student_ids))
    r = make_response(outcomes_results)
    r.mimetype = 'application/json'
    return r

#
# Utility routes
#
@app.route('/api/canvas_oauth_redirect/')
@cross_origin(origin='https://localhost:4200')
def canvas_oauth_complete():
    """ Endpoint for the redirect from Canvas OAuth2 Flow.
        Calls the oauth_callback method to store the access token
        and expriation in session. Then redirects back to the page
        that originated the auth flow."""

    try:
        initial_uri = canvas_oauth.oauth_callback(request, session)
    except InvalidOAuthReturnError:
        return redirect(base_url)
    
    resp = make_response(redirect(initial_uri))

    return resp


@app.route('/api/signout/')
def canvas_logout():
    """Clear session and delete Canvas oauth token"""
    session.pop('canvas_oauth2_token', None)
    session.pop('user', None)
    session.pop('canvas_oauth_initial_url', None)
    session.pop('canvas_oauth_request_state', None)
    requests.delete(base_url + '/login/oauth2/token')
    return redirect(base_url)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=9000, debug=True)
