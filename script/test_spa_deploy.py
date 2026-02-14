import subprocess
import json
import time
import requests
import os
from bs4 import BeautifulSoup # Import BeautifulSoup

REPO_OWNER = "tommyroar"
REPO_NAME = "maps"
WORKFLOW_NAME = "Deploy Vitamind SPA to GitHub Pages"
EXPECTED_DEPLOY_PATH = "vitamind" # Relative path within the GitHub Pages site
GITHUB_PAGES_BASE_URL = f"https://{REPO_OWNER}.github.io/{REPO_NAME}/"
SPA_DEPLOY_URL = f"{GITHUB_PAGES_BASE_URL}{EXPECTED_DEPLOY_PATH}"
EXPECTED_SPA_TITLE = "Vite + React" # Expected title of the React SPA

def run_gh_command(command_parts):
    """Runs a gh CLI command and returns its JSON output."""
    try:
        result = subprocess.run(
            ['gh'] + command_parts,
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error running gh command: {' '.join(e.cmd)}")
        print(f"Stderr: {e.stderr}")
        print(f"Stdout: {e.stdout}")
        return None
    except json.JSONDecodeError:
        print(f"Error decoding JSON from gh command output: {result.stdout}")
        return None

def get_workflow_id(workflow_name):
    """Gets the ID of a workflow by its name."""
    workflows = run_gh_command(['workflow', 'list', '--repo', f"{REPO_OWNER}/{REPO_NAME}", '--json', 'name,id'])
    if workflows:
        for workflow in workflows:
            if workflow['name'] == workflow_name:
                return workflow['id']
    return None

def get_latest_successful_deployment_run(workflow_id):
    """Finds the latest successful run for a given deployment workflow."""
    print(f"Searching for latest successful run for workflow ID: {workflow_id}")
    runs = run_gh_command([
        'run', 'list',
        '--workflow', str(workflow_id),
        '--status', 'success',
        '--branch', 'main', # Assuming main branch triggers the deploy
        '--json', 'status,conclusion,databaseId,url,displayTitle,databaseId,event',
        '--limit', '5' # Check the last few runs
    ])
    if runs:
        # Filter for runs that specifically match the deployment workflow's conclusion (success)
        for run in runs:
            if run['conclusion'] == 'success' and run['status'] == 'completed' and run['event'] == 'push':
                return run
    return None

def verify_deployed_content(url):
    """Fetches the deployed URL and checks for expected content."""
    print(f"\nAttempting to verify content at: {url}")
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)

        print(f"Successfully fetched {url}. Status: {response.status_code}")
        
        soup = BeautifulSoup(response.text, 'html.parser')
        title_tag = soup.find('title')

        if title_tag and title_tag.string == EXPECTED_SPA_TITLE:
            print(f"Content verification: Found expected title '{EXPECTED_SPA_TITLE}'.")
            return True
        else:
            print(f"Content verification: Title '{EXPECTED_SPA_TITLE}' not found or incorrect.")
            print(f"Actual title found: {title_tag.string if title_tag else 'None'}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return False

def main():
    print(f"Starting deployment test for '{WORKFLOW_NAME}' in {REPO_OWNER}/{REPO_NAME}")

    workflow_id = get_workflow_id(WORKFLOW_NAME)
    if not workflow_id:
        print(f"Error: Could not find workflow '{WORKFLOW_NAME}'.")
        return

    print(f"Found workflow ID: {workflow_id}")

    latest_successful_run = None
    # Give some time for the GitHub Pages to propagate, especially if run just finished
    # Max wait for about 5 minutes (10 retries * 30 seconds) for propagation
    for i in range(1, 11):
        latest_successful_run = get_latest_successful_deployment_run(workflow_id)
        if latest_successful_run:
            print(f"Found latest successful run: {latest_successful_run['url']}")
            break
        else:
            print(f"No successful deployment run found yet. Retrying in 30 seconds... (Attempt {i}/10)")
            time.sleep(30)
    
    if not latest_successful_run:
        print("No successful deployment run found after multiple retries. Cannot verify content.")
        return

    print(f"Latest successful deployment run URL: {latest_successful_run['url']}")
    print(f"Expected SPA URL: {SPA_DEPLOY_URL}")

    if verify_deployed_content(SPA_DEPLOY_URL):
        print("\nSPA Deployment Test: PASSED")
    else:
        print("\nSPA Deployment Test: FAILED (Content verification failed)")

if __name__ == "__main__":
    main()
