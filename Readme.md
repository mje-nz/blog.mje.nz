# Blog source [![Build Status](https://travis-ci.org/mje-nz/blog.mje.nz.svg?branch=master)](https://travis-ci.org/mje-nz/blog.mje.nz)

The `master` branch is staging for [mje-nz/blog.mje.nz](https://github.com/mje-nz/blog.mje.nz).
The `draft` branch is rebased on top with my drafts and unpublished changes.
Note that the Travis badge above is for the live site; there are no Travis builds here.

Workflow:

* Make a change in `draft`, iterating with a local Jekyll build until complete
* Switch to `master`, run `git checkout draft <changed file>` and commit
* Rebase `draft` back on top to keep history tidy
* Push `master` to [mje-nz/blog.mje.nz](https://github.com/mje-nz/blog.mje.nz), which will trigger the Travis build and update the live site

TODO:
* Subset Font Awesome
* Use Jekyll Picture Tag for hero images, cache generated images
* Tweak visual style
* Run linters, check links etc on builds
* 404 page
* Contact page?
* Fix smart quotes
* Comments
* Analytics
* Sharing buttons?
