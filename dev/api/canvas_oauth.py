from random import choice
import os
import logging
import string
import json
import requests
from api import secrets
from datetime import datetime, timedelta
from flask import redirect
from api.exceptions import (MissingTokenError, InvalidOAuthStateError,
                             InvalidOAuthReturnError, MismatchTokenError)

CANVAS_BASE_URL = os.environ["CANVAS_BASE_URL"]
CANVAS_CLIENT_ID = os.environ["CANVAS_DEV_KEY_CLIENT_ID"]
PROFILE_URL = "%s/api/v1/users/self/profile" % CANVAS_BASE_URL
AUTHORIZE_URL = "%s/login/oauth2/auth" % CANVAS_BASE_URL
ACCESS_TOKEN_URL = "%s/login/oauth2/token" % CANVAS_BASE_URL
REDIRECT_URL_PATTERN = "%sapi/canvas_oauth_redirect"


def get_oauth_token(request, session):
    """Check for a stored Canvas OAuth2 access token from session for the
    currently logged in user.  If the token has expired (or has exceeded an
    expiration threshold), a fresh token is generated via the saved refresh token.
    If the user does not have a stored token, the method raises a
    MissingTokenError exception.
    """
    if not session.get('canvas_oauth2_token'):
        return None
    
    # Check to see if we're within the expiration threshold of the access token
    if session["canvas_oauth2_token"]["expires"] - datetime.now() <= timedelta(seconds=3000):
        return refresh_oauth_token(request, session)
    return session["canvas_oauth2_token"]["access_token"]

def handle_missing_token(request, session):
    """
    Redirect user to Canvas with a request for token.
    """
    # Store where the user came from so they can be redirected back there
    # at the end.
    session["canvas_oauth_initial_uri"] = request.url
    # The request state is a random string that is a recommended security
    # check on the callback, so store in session for later
    oauth_request_state = ''.join([choice(string.ascii_letters + string.digits)
                                  for n in range(24)])
    session["canvas_oauth_request_state"] = oauth_request_state

    # Build url encoded login url with parameters
    login_url = get_oauth_login_url(
        client_id=CANVAS_CLIENT_ID,
        redirect_uri=REDIRECT_URL_PATTERN % request.url_root,
        state=oauth_request_state)
    
    # Redirect to the Canvas login url: /login/oauth2/auth
    return redirect(login_url)


def refresh_oauth_token(request, session):
    """ Makes refresh_token grant request with Canvas to get a fresh
    access token.  Update the oauth token stored in session with the new token
    and new expiration date.
    """

    # Get the new access token and expiration date via
    # a refresh token grant
    access_token, expires, _ = get_access_token(
        grant_type='refresh_token',
        client_id=os.environ["CANVAS_DEV_KEY_CLIENT_ID"],
        client_secret=secrets.get_secret('canvas_secret'),
        redirect_uri=REDIRECT_URL_PATTERN % request.url_root,
        refresh_token=session['canvas_oauth2_token']['refresh_token'])

    session['canvas_oauth2_token']['access_token'] = access_token
    session['canvas_oauth2_token']['expires'] = expires

    return access_token


def get_oauth_login_url(client_id, redirect_uri, response_type='code',
                        state=None, scopes=None, purpose=None,
                        force_login=None):
    """Builds an OAuth request url for Canvas.
    """

    auth_request_params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': response_type,
        'state': state,
        'scopes': scopes,
        'purpose': purpose,
        'force_login': force_login,
    }
    # Use requests library to help build our url
    auth_request = requests.Request('GET', AUTHORIZE_URL,
                                params=auth_request_params)
    
    # Prepared request url uses urlencode for encoding and scrubs any None
    # key-value pairs
    return auth_request.prepare().url


def oauth_callback(request, session):
    """ Receives the callback from canvas and saves the token to the database.
        Redirects user to the page they came from at the start of the oauth
        procedure. """

    error = request.args.get('error')
    if error:
        raise InvalidOAuthReturnError("OAuth Request returned error: %s" % error)

    code = request.args.get('code')
    state = request.args.get('state')

    if state != session['canvas_oauth_request_state']:
        raise InvalidOAuthStateError("OAuth Request state mismatch")

    session.pop('canvas_oauth_request_state', None)
    
    # Make the `authorization_code` grant type request to retrieve a token
    access_token, expires, refresh_token = get_access_token(
        grant_type='authorization_code',
        client_id=os.environ["CANVAS_DEV_KEY_CLIENT_ID"],
        client_secret=secrets.get_secret('canvas_secret'),
        redirect_uri=REDIRECT_URL_PATTERN % request.url_root,
        code=code)

    session['canvas_oauth2_token'] = {
        "access_token": access_token,
        "expires": expires,
        "refresh_token": refresh_token
    }

    return session.pop('canvas_oauth_initial_uri', '/')


def get_access_token(grant_type, client_id, client_secret, redirect_uri,
                     code=None, refresh_token=None):
    """Performs one of the two grant types supported by Canvas' OAuth endpoint
    to retrieve an access token.  Expect a `code` kwarg when performing an
    `authorization_code` grant; otherwise, assume we're doing a `refresh_token`
    grant.
    Return a tuple of the access token, expiration date as a datetime,
    and refresh token (returned by `authorization_code` requests only).
    """
    oauth_token_url = ACCESS_TOKEN_URL
    post_params = {
        'grant_type': grant_type,  # Use 'authorization_code' for new tokens
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri,
    }

    # Need to add in code or refresh_token, depending on the grant_type
    if grant_type == 'authorization_code':
        post_params['code'] = code
    else:
        post_params['refresh_token'] = refresh_token
    
    r = requests.post(oauth_token_url, post_params)
    if r.status_code != 200:
        raise InvalidOAuthReturnError("%s request failed to get a token: %s" % (
            grant_type))
    # Parse the response for the access_token, expiration time, and (possibly)
    # the refresh token
    response_data = r.json()
    access_token = response_data['access_token']
    seconds_to_expire = response_data['expires_in']
    # Convert the expiration time in seconds to a DateTime
    expires = datetime.now() + timedelta(seconds=seconds_to_expire)
    # Whether a refresh token is included in the response depends on the
    # grant_type - it only appears to be returned for 'authorization_code',
    # but to be safe check the response_data for it
    refresh_token = None
    if 'refresh_token' in response_data:
        refresh_token = response_data['refresh_token']

    return (access_token, expires, refresh_token)