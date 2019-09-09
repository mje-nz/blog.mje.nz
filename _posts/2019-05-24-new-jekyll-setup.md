---
title: Using Jekyll on GitHub Pages (again)
---

In [my previous post on this subject](/2017-01-16-using-jekyll-on-github-pages/), I outlined a very complicated way of setting up a Jekyll blog on GitHub Pages.
When I came back to the blog after a long hiatus I had no idea how anything worked and didn't feel like all the moving parts are good value any more, so I threw it all out and started again.
I copied the posts and assets into a fresh [Minimal Mistakes setup](https://mmistakes.github.io/minimal-mistakes/docs/quick-start-guide/) and tweaked it a bit -- no more Grunt, BrowserSync, cache busting, custom deployment, or Travis.
I'm using Minimal Mistakes as a remote theme rather than a gem theme now, which means it works with the GitHub Pages build process.

I'm still using CloudFlare for SSL termination (and the speed boost), so I followed [Dylan Wolff's instructions](https://dylanwolff.com/posts/using-zapier-to-automate-cloudflare-purges-for-github-pages-sites/) to use [Zapier](https://zapier.com) to clear CloudFlare's cache each time the GitHub Pages build finishes.
Note that since my last post, GitHub Pages has added support for HTTPS on custom domains, so it's now possible to use CloudFlare's "Full (strict)" SSL setting and prevent MITM attacks.
Since I don't have cache busting, I have the browser cache TTL set to 30 minutes for everything now.

The only other point of interest is that in order to keep [the source for this blog](https://github.com/mje-nz/blog.mje.nz) public while keeping my drafts private, I have a private fork of the repo in which I store the drafts and test layout changes.
To release a change I checkout the changed files into the `master` branch, push it upstream, then rebase the `draft` branch back on top.
