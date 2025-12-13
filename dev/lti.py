import requests
from pprint import pprint

from api import canvas_api

domains = {
    'nyc': 'avenues.instructure.com',
    'sp': 'avenuessp.instructure.com',
    'sv': 'avenuessv.instructure.com',
    'sz': 'canvas.avenueschina.cn'
}
feedback_urls = {
    'nyc': 'https://feedback-ny.avenues.org',
    'sp': 'https://feedback-sp.avenues.org',
    'sv': 'https://feedback-sv.avenues.org',
    'sz': 'https://feedback-sz.avenues.org'

}

consumer_key = 'KT6YYDIJRJ9S37LJ168H3W1WYBJ6KV4Z9W91RWFO'
shared_secret = '7SfYqqWDBCSMH0dv5iSTQpwLj6VsxgCPDRzMjrlABqxqOjPkKExVberqLOACy6DkSsa4veBK43ab1iFx'

def edit_tool(campus, tool_id, access_token):
    """ Edit an existing tool.

        Parameters:
                    campus (str): 'NY', 'SP', 'SZ' or 'SV'
                    tool_id (int|str): Existing tool id
                    access_token (str): You need an access token for this.  Easiest thing to do
                                        is grab a token from your Canvas profile page.
    """
    
    url = f'http://{domains[campus]}/api/v1/accounts/1/external_tools/{tool_id}'
    headers = {"Authorization": "Bearer %s" % access_token}
    tool_data = get_tool_data(campus)
    tool_data['id'] = id

    resp = requests.put(url, headers=headers, data=tool_data)
    print(resp)
    print(pprint(resp.json()))

def create_tool(campus, access_token):
    """POST a new external tool to the Canvas domain.
        
        Parameters:
                    campus (str): 'NY', 'SP', 'SZ' or 'SV'
                    access_token (str): You need an access token for this.  Easiest thing to do
                                        is grab a token from your Canvas profile page.
    """

    url = f'http://{domains[campus]}/api/v1/accounts/1/external_tools/'
    headers = {"Authorization": "Bearer %s" % access_token}
    tool_data = get_tool_data(campus)
    tool_data['shared_secret'] = shared_secret

    resp = requests.post(url, headers=headers, data=tool_data)
    print(resp)
    print(pprint(resp.json()))


def get_tool_data(campus):
    """Create the tool data dictionary"""
    return {
        "domain": domains[campus],
        "url": feedback_urls[campus],
        "consumer_key": consumer_key,
        "name": "Avenues Feedback Dashboard",
        "description": "",
        "privacy_level": "public",
        "workflow_state": "public",
        "course_navigation": {
            "display_type": "full_width",
            "enabled": True,
            "icon_url": f"{feedback_urls[campus]}/static/img/feedback-icon.svg",
            "text": "Feedback",
            "windowTarget": "_selfpost",
            "url": f"{feedback_urls[campus]}/lti/course",
            "label": "Feedback",
            "custom_fields": {
                "custom_canvas_course_id": "$Canvas.course.id",
                "custom_canvas_user_id": "$Canvas.user.id",
                "roles": "$Canvas.membership.roles"
            }
        },
        "global_navigation": {
            "canvas_icon_class": "icon-lti",
            "display_type": "full_width",
            "enabled": True,
            "icon_url": f"{feedback_urls[campus]}/static/img/feedback-icon.svg",
            "text": "Feedback Dashboard",
            "windowTarget": "_self",
            "url": f"{feedback_urls[campus]}/lti/dashboard",
            "label": "Feedback Dashboard",
        }
    }

if __name__ == "__main__":
    pass