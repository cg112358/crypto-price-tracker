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