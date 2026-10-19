# FE Prep

A personal, offline study app for the NCEES FE Electrical and Computer exam. Runs on iPhone as a Home Screen web app. Nothing is published to an app store, and nothing leaves your phone.

## Put it on your iPhone (GitHub Pages, about 5 minutes)

1. On github.com, create a **new repository** (for example `fe-prep`). Public is simplest. GitHub Pages on a private repo needs a paid plan.
2. In the new repo, choose **Add file → Upload files**. Drag in **everything inside this folder**: `index.html`, `manifest.webmanifest`, `sw.js`, `.nojekyll`, and the `css`, `js`, `fonts`, `icons`, and `tools` folders. Commit.
   - Drag the *contents*, not the outer folder, so `index.html` sits at the top level of the repo.
3. Go to **Settings → Pages**. Under *Build and deployment*, set Source to **Deploy from a branch**, Branch to **main**, folder **/ (root)**. Save.
4. Wait a minute. The page shows your site address: `https://<your-username>.github.io/fe-prep/`.
5. On your iPhone, open that address in **Safari**, tap **Share → Add to Home Screen**, then **Add**.
6. Open FE Prep from the Home Screen icon once while online. After that it works offline.

**Updating later:** upload the changed files to the repo. The app picks up the new version the next time it opens while online. Close and reopen it once more to see the changes.

**Your data:** progress is stored on the phone, inside the Home Screen app. Use **More → Backup and restore → Export backup** every week or two and save the file to Files or iCloud Drive. Deleting the Home Screen app deletes its data.

## What's inside

| Path | What it is |
|---|---|
| `js/content.js` | The 17 NCEES knowledge areas with question ranges, and the 85 problem sets from your Asghar book (titles and page numbers only) |
| `js/templates-a.js`, `js/templates-b.js` | 103 generated-problem templates. Each starts **unverified** and enters study only after you approve it in the app |
| `js/drills.js` | 15 TI-36X Pro drills. Each must be confirmed on your calculator before it enters practice |
| `js/engine.js` | Seeded random generator, number formatting, multiple-choice assembly |
| `js/verify-report.js` | Results of the independent auto-check, shown on each template in the Verify screen |
| `js/app.js` | The app: spaced repetition, sessions, stats, XP and levels, backup |
| `tools/` | The verification pipeline (not used by the phone) |

## Re-running the auto-check (optional, on a computer)

```
pip install numpy scipy sympy numpy-financial matplotlib networkx IPython property_cached
pip install --no-deps lcapy
node tools/export-variants.js 300 > variants.jsonl
python3 tools/verify.py variants.jsonl js/verify-report.js
```

The export uses the app's exact generator code. The verifier recomputes every answer with separate tools: lcapy circuit solving, SciPy simulation and root-finding, SymPy, numpy-financial, Python's `ipaddress`, and direct simulation. It also checks that every wrong choice is clearly wrong and every label matches its value. This catches formula and arithmetic bugs. It doesn't replace your own check, which is why the app still asks for it.
