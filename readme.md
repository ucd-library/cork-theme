# Cork Theme

- [Upsteam SASS](https://bitbucket.org/ietwebdev/sitefarm-pattern-lab-one/src/redesign/)
- [Patternlab](http://dev.webstyleguide.ucdavis.edu/redesign/)

## Local Development

### Merging Campus (IET) Styles

Our styles are built on top of [IET's SiteFarm styles](https://bitbucket.org/ietwebdev/sitefarm-pattern-lab-one/src/master/). When there are upstream changes, follow these steps to bring IET's changes into ours.

#### 1. Check for updates

```bash
git switch main
git pull
./devops/cmds/check-upstream-styles.sh
```

This saves any new campus changes to the dedicated vendor branch (`upstream-styles`) and prints a report. It is safe to run as often as you like, and it never changes our own code.

If it says **Up to date**, you're done.

#### 2. Read the report

- **Campus updates**: what campus changed, in their own words.
- **Files campus changed**: pay extra attention to anything renamed or deleted.
- **Files we customised that campus also changed**: make sure our edits still make sense.
- **Merge preview**: which files, if any, will need fixing by hand.

#### 3. Share the update

```bash
git push origin upstream-styles
```

This simply updates the vendor branch in Github. 

#### 4. Merge

```bash
./devops/cmds/merge-upstream-styles.sh
```

If some files need fixing by hand, the script tells you which ones and how. To back out at any point before finishing, run `git merge --abort`.

#### 5. Rebuild and review

Rebuild everything generated from the styles, such as the compiled CSS and the Lit `css.js` modules. The local dev container must be running.

```bash
./devops/cmds/run-package-tool.sh styles run-all
```

You can verify what changed with:
```bash
git status
git diff --stat
```
Look over what changed in `services/package/styles/` before committing. This is where problems the merge can't detect show up, such as a renamed class or a new rule that overrides one of ours. 

#### 6. Add, Commit, and Push

Now, commit and push the generated content to the main branch, e.g.
```bash
git add --all
git commit -m 'generated files from upstream merge (e039219)'
git push
```


#### Notes

- When we change a campus style file, we wrap our edit in comments so it's easy to spot:

  ```scss
  // ucdlib-edit-start: why we changed this
  ...
  // ucdlib-edit-end
  ```

- Every campus update is recorded in [docs/upstream-styles-log.md](docs/upstream-styles-log.md).

### Generating Docs

The element and util reference pages in [docs/reference](docs/reference/readme.md) are generated from the JSDoc in `services/package`. Don't edit them by hand. After changing an element or util's JSDoc, rebuild them. The local dev container must be running.

```bash
./devops/cmds/run-package-tool.sh docs jsdoc
```

This rebuilds every page and clears out pages for deleted sources. To rebuild only some pages, name the elements or util folders:

```bash
./devops/cmds/run-package-tool.sh docs jsdoc cork-header controllers
```

The index, `docs/reference/readme.md`, is rebuilt every time. To run every docs build, use `docs run-all`.
