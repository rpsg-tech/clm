---
description: Deploy changes to staging and production (main) after local verification
---

1.  **Verify Locally**
    Ensure the project builds successfully before committing.
    ```bash
    npm run build --workspace=apps/user-app
    # Add other build commands if necessary, e.g., for backend
    ```

2.  **Commit Changes**
    Stage and commit your changes to the current feature branch.
    ```bash
    git add .
    git commit -m "your commit message"
    ```

3.  **Deploy to Staging**
    Switch to staging, merge the feature branch, and push.
    ```bash
    git checkout staging
    git merge <your-feature-branch>
    git push origin staging
    ```

4.  **Deploy to Production (Main)**
    Switch to main, merge staging (or the feature branch), and push.
    ```bash
    git checkout main
    git merge staging
    git push origin main
    ```

5.  **Return to Work**
    Switch back to your feature branch to continue development.
    ```bash
    git checkout <your-feature-branch>
    ```
