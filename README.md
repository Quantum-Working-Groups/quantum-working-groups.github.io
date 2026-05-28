# Quantum Technical Working Groups

A website that lists the IBM Quantum Technical Working Groups, their committee members, and published resources.

## Updating the Data

All working group content lives in the `data/working-groups/` folder. Each file is a plain-text YAML file that corresponds to one working group. You can edit these files directly on GitHub without any technical setup.

### Fields

See [`data/working-groups/hcls.yaml`](data/working-groups/hcls.yaml) as a reference example. The available fields are:

| Field              | Required | Description                                                        |
| ------------------ | -------- | ------------------------------------------------------------------ |
| `id`               | yes      | Unique identifier — lowercase, no spaces, matches the filename     |
| `order`            | no       | Display order on the site (lower number = appears first)           |
| `title`            | yes      | Full name shown on the site                                        |
| `acronym`          | yes      | Short label shown on the card                                      |
| `shortDescription` | yes      | One-line summary shown on the card                                 |
| `longDescription`  | yes      | Full description shown when clicking on a group                    |
| `committeeMembers` | yes      | List of `name` + `institution` pairs                               |
| `resources`        | yes      | List of `title` + `url` pairs (URL must start with `https://`)     |
| `status`           | no       | Set to `pending` for groups not yet active; omit for active groups |
| `acknowledgements` | no       | Free-text acknowledgements                                         |

### Editing an existing working group

1. Open the corresponding file in `data/working-groups/` (e.g. `hcls.yaml`)
2. Edit the fields you want to change
3. Open a pull request — the site will rebuild automatically when the PR is merged to `main`

### Adding a new working group

1. Create a new `.yaml` file in `data/working-groups/` (e.g. `my-group.yaml`)
2. Fill in all required fields: `id`, `title`, `acronym`, `shortDescription`, `longDescription`, `committeeMembers`, `resources`
3. Open a pull request

> **Note:** Every URL in `resources` must be a complete URL starting with `https://`. If a URL is invalid, the build will fail and the error message will tell you which file to fix.

---

## Development

```bash
npm install        # install dependencies
npm run dev        # start dev server at http://localhost:3000
npm run build      # production build (also validates all data files)
npm run lint       # run ESLint
```

Data files are read and validated at build time. If a YAML file has a missing required field or an invalid URL, `npm run build` will print an error pointing to the problem.

---

## Deployment

The site is a static export — `npm run build` produces a folder of plain HTML, CSS, and JavaScript files with no server required.

Deployment is fully automatic: a GitHub Actions workflow triggers on every commit to `main`, builds the static site, and publishes it.
