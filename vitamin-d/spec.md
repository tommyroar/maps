# Gemini Deployment Specification for a React Single Page Application (SPA) via GitHub Actions

This document outlines the automated steps for Gemini to create a "Hello World" React SPA and configure its deployment to GitHub Pages using a GitHub Actions workflow.

## Gemini Deployment Steps

1.  **Initialize a new React project:**
    *   Execute `npx create-react-app <project-name>` in the desired directory.
    *   Navigate into the created project directory: `cd <project-name>`.

2.  **Configure `package.json` for GitHub Pages:**
    *   Add a `homepage` property to `package.json`. The URL should follow the format `https://<your-username>.github.io/<project-name>`. For example:
        ```json
        "homepage": "https://tommydoerr.github.io/hello-world-spa",
        ```

3.  **Create the GitHub Actions workflow file:**
    *   Create a new file at `.github/workflows/deploy.yml`.
    *   Add the following content to the file:
        ```yaml
        name: Deploy to GitHub Pages

        on:
          push:
            branches:
              - main

        jobs:
          deploy:
            runs-on: ubuntu-latest
            steps:
              - name: Checkout repository
                uses: actions/checkout@v3

              - name: Set up Node.js
                uses: actions/setup-node@v3
                with:
                  node-version: '18'

              - name: Install dependencies
                run: npm install

              - name: Build React application
                run: npm run build

              - name: Deploy to GitHub Pages
                uses: peaceiris/actions-gh-pages@v3
                with:
                  github_token: ${{ secrets.GITHUB_TOKEN }}
                  publish_dir: ./build
        ```

4.  **Commit and push the changes:**
    *   Execute `git add .`
    *   Execute `git commit -m "ci: add GitHub Actions workflow for deployment"`
    *   Execute `git push origin main`. This will trigger the first deployment.

5.  **GitHub Pages Activation (Manual Step for User):**
    *   **Note:** This step requires human intervention if not already configured.
    *   Go to your GitHub repository settings.
    *   Navigate to the "Pages" section.
    *   Under "Build and deployment", set the **Source** to **Deploy from a branch**.
    *   Under "Branch", select `gh-pages` and `/ (root)` folder, then click **Save**.
    *   Your deployed application will be available at the URL specified in the `homepage` field of `package.json` after the workflow completes.
