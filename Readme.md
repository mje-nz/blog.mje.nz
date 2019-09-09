# Blog source

The `master` branch of [mje-nz/blog-private](https://github.com/mje-nz/blog-private) is staging for [mje-nz/blog.mje.nz](https://github.com/mje-nz/blog.mje.nz).
The `draft` branch is rebased on top with my drafts and unpublished changes.

Setup:
```bash
gem install bundler
bundle install
# Or to update gems:
# bundle update
```

Workflow:

* Make a change in `draft`, iterating with a local Jekyll build (`bundle exec jekyll serve --drafts`) until complete
* Switch to `master`, run `git checkout draft <changed file>` and commit
* Rebase `draft` back on top to keep history tidy
* Push `master` to [mje-nz/blog.mje.nz](https://github.com/mje-nz/blog.mje.nz), which will trigger the GitHub Pages build and update the live site

To add a new image, copy it into `assets/_originals` and then resize it into `assets/img`.

TODO:
* Figure out workflow to strip originals and these TODOs from main repo
* Add last_modified_at plugin (after [pages-gem/119](https://github.com/github/pages-gem/pull/119))
* Find a font where smart quotes don't look so bad

Old TODO:
* Run linters, check links etc on builds
* Subset Font Awesome
* Contact page?
* Comments
* Sharing buttons?
