import os
from google.cloud import secretmanager


def get_secret(secret_id, version_id='latest'):
    """
    Access the payload for the secret stored in Google Cloud Platform's Secret Manager . 
    The version can be a version number as a string (e.g. "5") or an alias (e.g. "latest").
    """

    # Create the Secret Manager client.
    client = secretmanager.SecretManagerServiceClient()
    
    # Build the resource name of the secret version.
    project_id = os.environ.get("GCP_PROJECT")
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"

    # Access the secret version.
    try:
        response = client.access_secret_version(request={"name": name})
    except TypeError:
        # Compatibility with older google-cloud-secret-manager clients.
        response = client.access_secret_version(name)

    # Print the secret payload.
    #
    # WARNING: Do not print the secret in a production environment - this
    # snippet is showing how to access the secret material.
    payload = response.payload.data.decode('UTF-8')
    return payload
