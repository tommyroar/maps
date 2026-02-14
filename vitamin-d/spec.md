# Gemini Deployment Specification for a React Single Page Application (SPA)

This document outlines the automated steps for Gemini to create a basic "Hello World" React Single Page Application and deploy it to GitHub Pages.

## Gemini Deployment Steps

1.  **Initialize a new React project:**
    *   Execute `npx create-react-app <project-name>` in the desired directory.
    *   Navigate into the created project directory: `cd <project-name>`.

2.  **Install `gh-pages` for deployment:**
    *   Execute `npm install --save-dev gh-pages`.

3.  **Configure `package.json` for GitHub Pages:**
    *   Add a `homepage` property to `package.json` (e.g., `"homepage": "https://<your-username>.github.io/<project-name>"`).
    *   Add `predeploy` and `deploy` scripts to the `scripts` section of `package.json`:
        ```json
        "predeploy": "npm run build",
        "deploy": "gh-pages -d build"
        ```

4.  **Build the React application:**
    *   Execute `npm run build`. This creates an optimized `build` directory.

5.  **Deploy the application to GitHub Pages:**
    *   Execute `npm run deploy`. This pushes the content of the `build` directory to a `gh-pages` branch on your GitHub repository.

6.  **GitHub Pages Activation (Manual Step for User):**
    *   **Note:** This step requires human intervention if not already configured.
    *   Go to your GitHub repository settings.
    *   Navigate to "Pages".
    *   Under "Branch", select the `gh-pages` branch as the source and save.
    *   Your deployed application will be available at the URL specified in the `homepage` field of `package.json` after a few minutes.

7.  **Clean up local build artifacts:**
    *   Execute `rm -rf build` (optional, to remove the local build folder after deployment).
