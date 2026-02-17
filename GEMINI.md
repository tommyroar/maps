# Project Indexing and Registration

**Objective:** Ensure all new applications and documentation sites are correctly registered with the central index.

**Gemini Task:**
Whenever a new application is added or the site structure is modified, you must read and follow the instructions in **`INDEX.md`**.

```
read_file(file_path="INDEX.md")
```

Follow the process outlined in that document:
1.  **Create an App Stub**: Create or update the relevant JSON file in the `apps/` directory.
2.  **Local Verification**: If necessary, run the local indexing script as described.

---

# Deployment Tasks for Vitamind Redirect

This document outlines the repeatable steps for deploying the Vitamind redirect to GitHub Pages using Gemini CLI.

## Process Overview

To perform a deployment, follow these steps in order:
1.  **Check and Commit Git Changes**
2.  **Push Changes to GitHub**
3.  **Monitor and Verify GitHub Actions Workflow**

---

## Step 1: Check and Commit Git Changes

**Objective:** Review local Git changes, stage them, and commit before pushing.

**Gemini Task:**
1.  Check for uncommitted or unstaged changes:
    ```
    run_shell_command(
        command="git status --porcelain",
        description="Check for uncommitted or unstaged Git changes."
    )
    ```
2.  **Action Required:** If changes are present, Gemini CLI will prompt you to stage and commit them.
    *   **To proceed:** If you agree, Gemini CLI will stage all changes (`git add .`) and ask for a commit message. Provide a concise, descriptive message.
    *   **To abort:** If you decline, deployment will be aborted.

---

## Step 2: Push Changes to GitHub

**Objective:** Push the committed changes to the remote GitHub repository, triggering the GitHub Actions workflow.

**Gemini Task:**
Gemini CLI will prompt you to push your local commits to GitHub.

```
run_shell_command(
    command="git push",
    description="Push local commits to the remote GitHub repository."
)
```

---

## Step 3: Monitor and Verify GitHub Actions Workflow

**Objective:** Monitor the GitHub Actions workflow triggered by your push and verify the successful deployment of the redirect to GitHub Pages.

**Gemini Task:**
Always monitor the deployment with `gh cli`. For example, to monitor the latest run for a workflow named "combined-deploy.yaml" on the "main" branch, you would use:
```
gh run list --workflow="combined-deploy.yaml" --branch="main" --json databaseId,status,conclusion --limit 1
# Then, to watch a specific run:
# gh run watch <RUN_DATABASE_ID>
```

Gemini CLI will perform the following actions automatically:
1.  Retrieve the SHA of your latest commit.
2.  Identify the workflow ID for the "Combined App and Docs Deployment" workflow.
3.  Continuously monitor for the latest successful workflow run associated with your commit. This includes waiting for the run to appear and complete.
4.  Once a successful run is found, it will attempt to fetch and verify the content of your deployed redirect at `https://tommyroar.github.io/maps/vitamind/`. It will check for the expected title "Redirecting to Vitamind...".

```
# Internal Logic of Gemini CLI
# latest_commit_sha = run_shell_command(command="git rev-parse HEAD", ...)
# workflow_id = get_workflow_id("Combined App and Docs Deployment")
# get_latest_successful_deployment_run(workflow_id, commit_sha=latest_commit_sha)
# verify_deployed_content("https://tommyroar.github.io/maps/vitamind/", "Redirecting to Vitamind...")
```
---
