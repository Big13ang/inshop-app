# Git Remote Configuration

This document describes how to synchronize code between the GitHub repository and the local Gitea instance.

## Current Setup

You have configured the default `origin` remote to push to two destinations simultaneously:
1. GitHub: `https://github.com/Big13ang/inshop-app.git`
2. Gitea: `http://git.dev.inshop.internal/inshop-admin/inshop-app.git`

To verify the setup, run:
```bash
git remote -v
```

The output should show two `(push)` URLs under `origin`:
```text
origin  https://github.com/Big13ang/inshop-app.git (fetch)
origin  https://github.com/Big13ang/inshop-app.git (push)
origin  http://git.dev.inshop.internal/inshop-admin/inshop-app.git (push)
```

---

## How to Push

### 1. Push to Both GitHub and Gitea Simultaneously
Since both URLs are registered under `origin`, you can push to both with a single command:

```bash
git push origin <branch-name>
```

For example, to push the `master` branch:
```bash
git push origin master
```

---

### 2. Push to Gitea Individually
If you want to push specifically to Gitea without pushing to GitHub, we can set up a separate, dedicated remote.

#### Step 1: Add a dedicated Gitea remote
Run this command to add Gitea under its own remote name (e.g., `gitea`):
```bash
git remote add gitea http://git.dev.inshop.internal/inshop-admin/inshop-app.git
```

#### Step 2: Push to Gitea individually
Now, you can push to Gitea independently:
```bash
git push gitea master
```

---

### 3. Push to GitHub Individually
If you ever want to push to GitHub individually, add a separate `github` remote:
```bash
git remote add github https://github.com/Big13ang/inshop-app.git
```
Then run:
```bash
git push github master
```
