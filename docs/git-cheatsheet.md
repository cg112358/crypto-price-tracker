# 📝 Git Cheatsheet

A quick reference for the Git workflow used in this project.

---

## 🔁 Workflow Diagram

```text
        +------------+       git add        +-------------+
        |   Working  | ------------------>  |   Staging   |
        | Directory  |   (orange files)     |   Area      |
        +------------+                      +-------------+
               ^                                   |
               |                                   | git commit -m "msg"
               |                                   v
        git pull <---------------------------  +-------------+
        (updates from GitHub)                 |   Local Repo |
                                              +-------------+
                                                     |
                                                     | git push
                                                     v
                                              +-------------+
                                              | Remote Repo |
                                              |  (GitHub)   |
                                              +-------------+
```

## References and Commands

👉 Quick reference:
- **Green** = new (untracked) file
- **Orange/Yellow** = modified file
- **Red** = deleted file
- **White** = unchanged (clean)

Core commands:
- `git add <file>` → stage changes
- `git commit -m "message"` → save snapshot locally
- `git push` → sync with GitHub
- `git pull` → fetch & merge updates from GitHub

```