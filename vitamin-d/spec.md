# Bootstrapping a "Hello World" Single Page Application

This document outlines the steps to create a simple "Hello World" single-page application (SPA) and deploy it to GitHub Pages.

## Steps

1.  **Create a new GitHub repository:**
    *   Go to [github.com/new](https://github.com/new).
    *   Name the repository (e.g., `hello-world-spa`).
    *   Initialize it with a `README.md` file.

2.  **Clone the repository locally:**
    ```bash
    git clone https://github.com/<your-username>/hello-world-spa.git
    cd hello-world-spa
    ```

3.  **Create the application files:**
    *   Create an `index.html` file:
        ```html
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hello World SPA</title>
            <link rel="stylesheet" href="style.css">
        </head>
        <body>
            <h1>Hello World!</h1>
            <script src="app.js"></script>
        </body>
        </html>
        ```
    *   Create a `style.css` file:
        ```css
        body {
            font-family: sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        ```
    *   Create an `app.js` file:
        ```javascript
        console.log("Hello from app.js!");
        ```

4.  **Commit and push the files:**
    ```bash
    git add .
    git commit -m "Initial Hello World application"
    git push origin main
    ```

5.  **Enable GitHub Pages:**
    *   In your repository on GitHub, go to "Settings" -> "Pages".
    *   Under "Branch", select `main` and `/ (root)`.
    *   Click "Save".
    *   Your site will be deployed at `https://<your-username>.github.io/hello-world-spa/`. It might take a few minutes to become available.
