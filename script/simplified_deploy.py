import subprocess
import json
import time
import sys
import os
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.prompt import Confirm
from rich.text import Text
from rich.live import Live
import requests
from bs4 import BeautifulSoup

# Initialize Rich Console
console = Console()

# --- Configuration ---
# These can be dynamically determined if needed, but for simplicity, use fixed for now
REPO_OWNER = "tommyroar"
REPO_NAME = "maps"
WORKFLOW_NAME = "Deploy Vitamind SPA to GitHub Pages"
SPA_DIR = "vitamind"
EXPECTED_SPA_URL = f"https://{REPO_OWNER}.github.io/{REPO_NAME}/{SPA_DIR}"
EXPECTED_SPA_TITLE = "vitamind"

# --- Report Class ---
class DeploymentReport:
    def __init__(self):
        self.results = []

    def add_step(self, name, success, message=""):
        self.results.append({"name": name, "success": success, "message": message})

    def print_report(self):
        console.rule("[bold]Deployment Summary[/bold]")
        all_passed = True
        for result in self.results:
            status = Text("PASSED", style="bold green") if result["success"] else Text("FAILED", style="bold red")
            console.print(f"- {result['name']}: {status} {result['message']}")
            if not result["success"]:
                all_passed = False
        console.rule(Text("ALL STEPS PASSED", style="bold green") if all_passed else Text("SOME STEPS FAILED", style="bold red"))
        return all_passed

# --- Helper Functions ---
def run_command(command, cwd=None, capture_output=True, check=True, spinner_text="Running command..."):
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
        console=console,
    ) as progress:
        task = progress.add_task(f"[cyan]{spinner_text}", total=None)
        try:
            result = subprocess.run(
                command,
                cwd=cwd,
                capture_output=capture_output,
                text=True,
                check=check,
                shell=True # Use shell=True for convenience with strings
            )
            progress.update(task, completed=True, description=f"[green]{spinner_text} [bold]SUCCESS[/bold]")
            return result
        except subprocess.CalledProcessError as e:
            progress.update(task, completed=True, description=f"[red]{spinner_text} [bold]FAILED[/bold]")
            console.print(f"[red]Error executing command: {command}[/red]")
            console.print(f"[yellow]Stderr:[/yellow]\n{e.stderr}")
            console.print(f"[yellow]Stdout:[/yellow]\n{e.stdout}")
            raise
        except Exception as e:
            progress.update(task, completed=True, description=f"[red]{spinner_text} [bold]FAILED[/bold]")
            console.print(f"[red]An unexpected error occurred: {e}[/red]")
            raise

def run_gh_command(command_parts, spinner_text="Running gh CLI command...", check_json=True):
    try:
        result = run_command(['gh'] + command_parts, spinner_text=spinner_text, check=True)
        if check_json:
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                console.print(f"[red]Error parsing JSON from gh command. Raw stdout:[/red]\n{result.stdout}")
                return None
        return result.stdout
    except subprocess.CalledProcessError as e:
        console.print(f"[red]Failed to run gh command: {e}[/red]")
        return None

def get_workflow_id(workflow_name):
    workflows = run_gh_command(['workflow', 'list', '--repo', f"{REPO_OWNER}/{REPO_NAME}", '--json', 'name,id'])
    if workflows:
        for workflow in workflows:
            if workflow['name'] == workflow_name:
                return workflow['id']
    return None

def poll_for_workflow_completion(workflow_id, commit_sha):
    with Live(console=console, screen=False, auto_refresh=True) as live:
        live.console.print(f"Polling for successful run of workflow ID [cyan]{workflow_id}[/cyan] for commit [yellow]{commit_sha[:8]}[/yellow]...")
        for i in range(1, 13): # Retry for up to 6 minutes (12 * 30s)
            live.console.print(f"[yellow]Attempt {i}/12: Checking for run...[/yellow]")
            try:
                runs = run_gh_command(
                    ['run', 'list',
                     '--workflow', str(workflow_id),
                     '--status', 'success',
                     '--branch', 'main',
                     '--json', 'status,conclusion,databaseId,url,headSha,event',
                     '--limit', '5'],
                    spinner_text=f"Searching for run {commit_sha[:8]}",
                    check_json=True
                )
                
                if runs:
                    for run in runs:
                        if run['conclusion'] == 'success' and run['status'] == 'completed' and run['event'] == 'push' and run['headSha'] == commit_sha:
                            live.console.print(f"[green]Found successful run: [link={run['url']}]{run['url']}[/link][/green]")
                            return run
                
                live.console.print(f"[yellow]No successful run found yet for commit {commit_sha[:8]}. Retrying in 30 seconds...[/yellow]")
                time.sleep(30)
            except Exception as e:
                live.console.print(f"[red]Error while searching for runs: {e}[/red]")
                live.console.print("[yellow]Retrying in 30 seconds...[/yellow]")
                time.sleep(30)
        
        live.console.print("[red]No successful workflow run found after multiple retries.[/red]")
        return None

def verify_deployed_content(url, expected_title):
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
        console=console,
    ) as progress:
        task = progress.add_task(f"[cyan]Verifying content at [link={url}]{url}[/link]...", total=None)
        try:
            response = requests.get(url, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            title_tag = soup.find('title')

            if title_tag and title_tag.string == expected_title:
                progress.update(task, completed=True, description=f"[green]Content verification: Found expected title '{expected_title}' [bold]PASSED[/bold][/green]")
                return True
            else:
                progress.update(task, completed=True, description=f"[red]Content verification: Title '{expected_title}' not found or incorrect [bold]FAILED[/bold][/red]")
                console.print(f"[yellow]Actual title found: {title_tag.string if title_tag else 'None'}[/yellow]")
                # console.print(f"[yellow]Fetched HTML content: {response.text}[/yellow]") # Uncomment for verbose debugging
                return False

        except requests.exceptions.RequestException as e:
            progress.update(task, completed=True, description=f"[red]Error fetching content: {e} [bold]FAILED[/bold][/red]")
            return False
        except Exception as e:
            progress.update(task, completed=True, description=f"[red]An unexpected error occurred during verification: {e} [bold]FAILED[/bold][/red]")
            return False

# --- Main Deployment Logic ---
def main():
    report = DeploymentReport()
    console.rule("[bold green]Vitamind SPA Deployment Workflow[/bold green]")
    
    current_commit_sha = None

    try:
        # 1. Run Unit Tests
        console.print("\n[bold yellow]Step 1: Running Unit Tests...[/bold yellow]")
        try:
            run_command(f"npm test", cwd=SPA_DIR, spinner_text="Running npm test in vitamind")
            report.add_step("Unit Tests", True, "All tests passed.")
        except subprocess.CalledProcessError:
            report.add_step("Unit Tests", False, "Tests failed. Aborting deployment.")
            raise

        # 2. Check Git Status & Commit
        console.print("\n[bold yellow]Step 2: Checking Git Status & Committing Changes...[/bold yellow]")
        git_status_result = run_command("git status --porcelain", capture_output=True, check=False)
        if git_status_result.stdout.strip():
            console.print("[yellow]Uncommitted or unstaged changes detected:[/yellow]")
            console.print(git_status_result.stdout)
            
            # Generate commit message automatically based on context
            commit_message = "chore: Automated deployment with latest changes"
            if "vitamind/src/App.jsx" in git_status_result.stdout and "zoom" in git_status_result.stdout: # Simple heuristic
                commit_message = "fix: Update Mapbox zoom level and deploy SPA"
            elif "vitamind/src/App.test.jsx" in git_status_result.stdout:
                commit_message = "fix: Update Vitest zoom assertion and deploy"
            elif ".gitignore" in git_status_result.stdout:
                commit_message = "fix: Ignore secrets and deploy"
            
            console.print(f"[cyan]Automatically generating commit message: '{commit_message}'[/cyan]")

            run_command("git add .", spinner_text="Staging changes")
            run_command(f"git commit -m '{commit_message}'", spinner_text="Committing changes")
            report.add_step("Commit Changes", True, f"Changes committed with message: '{commit_message}'.")
        else:
            console.print("[green]No uncommitted or unstaged changes.[/green]")
            report.add_step("Commit Changes", True, "No changes to commit.")

        # Get current commit SHA after potential commit
        latest_commit_sha_result = run_command("git rev-parse HEAD", capture_output=True)
        current_commit_sha = latest_commit_sha_result.stdout.strip()
        console.print(f"Current commit SHA: [yellow]{current_commit_sha[:8]}[/yellow]")

        # 3. Git Push
        console.print("\n[bold yellow]Step 3: Pushing to Remote...[/bold yellow]")
        if Confirm.ask("[cyan]Do you want to push your changes to GitHub?[/cyan]"):
            run_command("git push", spinner_text="Pushing commits to GitHub")
            report.add_step("Push to GitHub", True, "Push successful.")
        else:
            raise ValueError("Deployment aborted. Changes not pushed.")

        # 4. Monitor GitHub Actions Workflow
        console.print("\n[bold yellow]Step 4: Monitoring GitHub Actions Workflow...[/bold yellow]")
        workflow_id = get_workflow_id(WORKFLOW_NAME)
        if not workflow_id:
            raise ValueError(f"Could not find workflow '{WORKFLOW_NAME}'.")

        successful_run_info = poll_for_workflow_completion(workflow_id, current_commit_sha)
        
        if successful_run_info:
            report.add_step("Monitor Workflow", True, f"Workflow ([link={successful_run_info['url']}]{successful_run_info['url']}[/link]) completed successfully.")
        else:
            raise ValueError("Could not find a successful workflow run for the pushed commit.")

        # 5. Verify Deployed Content
        console.print("\n[bold yellow]Step 5: Verifying Deployed Content...[/bold yellow]")
        if verify_deployed_content(EXPECTED_SPA_URL, EXPECTED_SPA_TITLE):
            report.add_step("Verify Deployed Content", True, f"Content matches expected title '{EXPECTED_SPA_TITLE}'.")
        else:
            raise ValueError(f"Content verification failed. Deployed URL: {EXPECTED_SPA_URL}")

    except ValueError as ve:
        console.print(f"[red]Deployment failed: {ve}[/red]")
    except subprocess.CalledProcessError:
        console.print("[red]A command failed during execution. Please check logs above.[/red]")
    except Exception as e:
        console.print(f"[red]An unhandled error occurred: {e}[/red]")
    finally:
        final_status = report.print_report()
        sys.exit(0 if final_status else 1)

if __name__ == "__main__":
    main()
