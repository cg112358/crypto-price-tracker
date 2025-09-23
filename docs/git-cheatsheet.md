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

```👉 Quick reference:
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

## 🌳 Repo Tree Diagram (for git-cheatsheet.md)

```text
crypto-price-tracker/
├─ README.md
├─ requirements.txt
├─ dev-requirements.txt
├─ crypto_price_tracker.py
├─ sample_data/
│  └─ Crypto_Investment_Tracker_template.xlsx
├─ out/
│  └─ Updated_Crypto_Investment_Tracker.xlsx (generated)
├─ tests/
│  └─ test_smoke.py
└─ docs/
   ├─ README.md
   ├─ git-cheatsheet.md
   ├─ excel-schema.md
   ├─ notes.md
   └─ docker.md
   ```

# ✅ Git Workflow (Clean Commit & Push)

Use this sequence to safely commit changes and push them to GitHub:

---

## 1. Check what changed
```bash
git status
```

## 2. Stage files
- Add only what you want:
```bash
git add crypto_price_tracker.py docs/git-cheatsheet.md
```
- Or add all tracked changes (safe once `.gitignore` is configured):
```bash
git add .
```

## 3. Commit with a clear message
```bash
git commit -m "Add Holdings & Summary patch and update git-cheatsheet with repo tree"
```

## 4. Push to remote (main branch)
```bash
git push origin main
```

---

# 📌 .gitignore Tips

Add these entries to `.gitignore` so junk files never clutter your repo:

```
# Office temp files
~$*.xlsx
*.tmp
*._UL
*.bak

# OS cruft
.DS_Store
Thumbs.db

# Python cache
__pycache__/
*.pyc
```


