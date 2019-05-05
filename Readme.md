# Blog source [![Build Status](https://travis-ci.org/mje-nz/blog.mje.nz.svg?branch=master)](https://travis-ci.org/mje-nz/blog.mje.nz)

The `master` branch of [mje-nz/blog-private](https://github.com/mje-nz/blog-private) is staging for [mje-nz/blog.mje.nz](https://github.com/mje-nz/blog.mje.nz).
The `draft` branch is rebased on top with my drafts and unpublished changes.
Note that the Travis badge above is for the live site; there are no Travis builds here.

Setup:
```bash
gem install bundler
bundle install
# Or to update gems:
# bundle update
```

Workflow:

* Make a change in `draft`, iterating with a local Jekyll build (`bundle exec jekyll serve`) until complete
* Switch to `master`, run `git checkout draft <changed file>` and commit
* Rebase `draft` back on top to keep history tidy
* Push `master` to [mje-nz/blog.mje.nz](https://github.com/mje-nz/blog.mje.nz), which will trigger the Github Pages build and update the live site

TODO:
* Add last_modified_at plugin (after [pages-gem/119](https://github.com/github/pages-gem/pull/119))
* Clear Cloudflare cache on update

Old TODO:
* Subset Font Awesome
* Use Jekyll Picture Tag for hero images, cache generated images
* Tweak visual style
* Run linters, check links etc on builds
* 404 page
* Contact page?
* Fix smart quotes
* Comments
* Sharing buttons?
