---
title: Using Jekyll on Github Pages with gem themes, SSL and a custom URL
excerpt: This post documents how I set up this blog. My goal was to end up with a git repository full of Markdown files that magically turns into a modern website when I push to Github, using only free software and services.
---

{% include toc %}

## Introduction
This post documents how I set up this blog.
My goal was to end up with a git repository full of Markdown files that magically turns into a modern website when I push to Github, using only free software and services.

The main moving part is the [Jekyll](https://jekyllrb.com) static site generator, which takes a Markdown file per page along with various bits of configuration and theming and compiles it into a static website ready to be hosted somewhere.
I prefer to keep the content and design separate, so I'm using the [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/) theme as a gem[^1].
That way, my repository's history (mostly) only shows changes to the content and it is relatively easy to change the design.

[Github Pages](https://pages.github.com) is a Github feature that lets you serve a Jekyll site (or bare static site) from a Github repository to `yourusername.github.io` or `yourusername.github.io/projectname`.
It's designed to be used to document open source projects, and even provides a set of pre-made project site themes[^5].
It does support using your own domain but only offers SSL on `*.github.io`, so for this site I'm using the [CloudFlare](https://www.cloudflare.com) CDN for SSL termination.

Unfortunately Github Pages only supports Jekyll themes and plugins from [a whitelist](https://pages.github.com/versions/), so if you want to do anything more complicated you have to manage the build yourself.
I decided to use the [Grunt](http://gruntjs.com) task runner to build and deploy the site.
It's probably a bit old-fashioned these days, but I'm familiar with it and it let me easily perform a few optimisations.
Finally, I'm using [Travis CI](https://travis-ci.org) to run my Grunt tasks whenever I push.

The rest of this post goes over each step in more detail.
If you want a template, skip to the end.





## Creating a new Jekyll blog
_This section is based on the Minimal Mistakes [quick-start guide](https://mmistakes.github.io/minimal-mistakes/docs/quick-start-guide/)._

First, create a Gemfile with the following content:
```ruby
source "https://rubygems.org"

gem "jekyll", "~>3.3.0"

gem "minimal-mistakes-jekyll", "~>4.1.1"
```

Run `bundle install` to install Jekyll, Minimal Mistakes and their dependencies.
There are a few bits of the theme that you might want to customise, so you'll need to copy `_config.yml`, `_data/*` and `index.html` from the [repository](https://github.com/mmistakes/minimal-mistakes.git) into your site.
Add `theme: "minimal-mistakes-jekyll"` to `_config.yml` and tweak the rest of the settings to your liking.
To change the links at the top of the page, edit `_data/navigation.yml`.
To create posts, add files named `YEAR-MONTH-DAY-title.md` to the `_posts` folder.
Each post must begin with a [YAML front matter block](https://jekyllrb.com/docs/frontmatter/), like:
```yaml
---
title: Using Jekyll on Github Pages with gem themes, SSL and a custom URL
---
```

The filenames are used to generate the permalink for each post[^6].

Now if you run `bundle exec jekyll serve`, Jekyll will build your site and serve it on `http://localhost:4000`.
You should see something like this:

![A screenshot of a new blog](/assets/img/2016-11-07-screenshot.png)








## Hosting on Github Pages
Github Pages lets you host a static site from a Github repository.
There are two types of Github Pages sites: project pages and user pages.
Project pages can build from the `master` branch, the `gh-pages` branch or a `docs/` folder in the `master` branch, and always publish to `username.github.io/projectname`.
User pages always build from the `master` branch of the `username/username.github.io` repo and publish to `username.github.io`.
You can choose to serve either type of page from a custom domain.
Note that if you use a custom domain for your user page, your project pages will serve from `yourdomain.com/projectname` instead.
That would be fine for a user page domain like `projects.mje.nz`, but might not be ideal for `mje.nz` and certainly wouldn't make much sense for `blog.mje.nz`.
Since I want this site to be at `blog.mje.nz` but don't want any project pages to turn up there too, I'm using a [project page](https://github.com/mje-nz/blog.mje.nz).

There's not really a lot to say about actually hosting a site on Github Pages.
For a simple Jekyll site or a completely static site, just keep your source in the publishing branch and push to publish.
For a manually built Jekyll site you can [juggle things a bit](https://help.github.com/articles/creating-project-pages-using-the-command-line/), or use one of the many easier options as in the next section.






## Building with Grunt
Github Pages supports building Jekyll sites that only use themes and plugins from [the whitelist](https://pages.github.com/versions/).
However, I'd rather have the site layout separated out into a gem theme and don't especially fancy any of theirs, so I'll be building the site manually and just pushing the results.
The approach I'm using is based on the [Yeoman Jekyll generator](https://github.com/robwierzbowski/generator-jekyllrb), which unfortunately seems to be abandoned[^2].
It's based around the [Grunt](http://gruntjs.com) task runner, and changes the project structure to be a bit more like a standard application:

```
.
├── Gemfile
├── Gruntfile.js
├── Readme.md
├── _config.yml
├── package.json
├── app/
│   └── (Jekyll source)
└── dist/
    └── (Jekyll output)
```

Here's a simplified version of my Gruntfile.
This one just has a development server with BrowserSync (to update pages in your browser as they change), a build step with cache busting (to enable long cache TTLs), and a deploy step which commits and pushes the built site (maintaining history).

```js
'use strict';

module.exports = function (grunt) {
  // Show elapsed time after tasks run
  require('time-grunt')(grunt);

  // Load all Grunt tasks (jit-grunt replaces load-grunt-tasks)
  require('jit-grunt')(grunt, {
    buildcontrol: 'grunt-build-control'
  });

  grunt.initConfig({
    // Paths
    dirs: {
      app: 'app',
      dist: 'dist'
    },

    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= dirs.dist %>/*',
          ]
        }]
      },
      server: [
        '.jekyll'
      ]
    },

    jekyll: {
      options: {
        config: '_config.yml,_config.build.yml',
        src: '<%= dirs.app %>'
      },
      dist: {
        options: {
          dest: '<%= dirs.dist %>',
        }
      },
      server: {
        options: {
          config: '_config.yml',
          dest: '.jekyll'
        }
      }
    },

    browserSync: {
      server: {
        bsFiles: {
          src: '.jekyll/**/*'  // Files to sync
        },
        options: {
          server: '.jekyll',  // Folder to serve from
          watchTask: true  // Allow other watch tasks to run after this task
        }
      },
      dist: {
        options: {
          server: '<%= dirs.dist %>'
        }
      }
    },

    watch: {
      jekyll: {
        files: [
          '<%= dirs.app %>/**/*',
          '_config.yml'
        ],
        tasks: ['jekyll:server']
      }
    },

    filerev: {
      options: {
        length: 4
      },
      dist: {
        files: [{
          src: [
            '<%= dirs.dist %>/assets/**/*'
          ]
        }]
      }
    },

    usemin: {
      options: {
        assetsDirs: [
          '<%= dirs.dist %>',  // Need this for absolute URLs
          '<%= dirs.dist %>/assets/css'  // Need this for relative URLs
        ]
      },
      html: ['<%= dirs.dist %>/**/*.html'],
      css: ['<%= dirs.dist %>/assets/css/**/*.css']
    },

    buildcontrol: {
      dist: {
        options: {
          remote: 'git@github.com:mje-nz/blog.mje.nz.git',
          branch: 'gh-pages',
          commit: true,
          push: true,
          connectCommits: false
        }
      }
    }
  });

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'browserSync:dist']);
    }

    grunt.task.run([
      'clean:server',  // Clean .jekyll
      'jekyll:server',  // Build into .jekyll once
      'browserSync:server',  // Start browserSync server
      'watch'  // Trigger jekyll:server on file changes
    ]);
  });

  grunt.registerTask('build', [
    'clean',  // Clean .jekyll and dist
    'jekyll:dist',  // Build into dist
    'filerev',  // Rename assets to include a hash
    'usemin',  // Update references to assets to use new names
    ]);

  grunt.registerTask('deploy', [
    'build',
    'buildcontrol',  // Push to Github
  ]);
};
```

For a full template see [mje-nz/jekyll-blog-template](https://github.com/mje-nz/jekyll-blog-template).
For this site I perform a few optimisations at build time, see [mje-nz/blog.mje.nz)](https://github.com/mje-nz/blog.mje.nz) for more detail.






## Automation with Travis CI
http://ellismichael.com/technical/2015/06/12/using-travis-ci-with-github-pages/

TODO Motivation

[Travis CI](https://travis-ci.org) is a popular hosted Continuous Integration service for Github.
It's free for public repos (as long as you don't mind everyone being able to see your build logs), and available as a paid service for private repos (Travis CI Pro) which you can also get through the Github Education Pack if you're a student.

If your blog is in a private repo then the setup is relatively straightforward.
By default, Travis CI Pro will [quietly add a deploy key](https://blog.travis-ci.com/2012-07-26-travis-pro-update-deploy-keys) to any private repo you activate, which means git pushes will "just work".
If your blog is in a public repo this feature is unavailable, even if you have a Pro subscription.
However, the same effect can be achieved in a slightly less convenient way using the [file encryption](https://docs.travis-ci.com/user/encrypting-files/) feature, as suggested in [their documentation](https://docs.travis-ci.com/user/deployment/custom/#Git).
First, create a new passwordless SSH key:

```
$ ssh-keygen
Generating public/private rsa key pair.
Enter file in which to save the key: .travis-deploy-key
Enter passphrase (empty for no passphrase):
```

Add the key to your repo as a deploy key.
Then, encrypt the key with the `travis` CLI tool:

```
$ gem install travis
$ travis encrypt-file .travis-deploy-key
```

This generates an encrypted file (`.travis-deploy-key.enc`), sets up environment variables in your Travis CI account which you can use to decrypt it, and prints a command to include in your `.travis.yml` file which uses the environment variables to decrypt the file.
That way, only someone with access to your Travis CI account can decrypt the file (as long as you don't print the environment variables in the log and share it) so it's safe to commit.
An alternative is to use a [Github access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/) instead of a deploy key, but the least-powerful scope that would work is "push to all of my public repos" which seems a bit over-the-top.

Aside from that, the Travis CI setup is reasonably simple.
Recent versions of Ruby and Node need to be installed, so I'm using the Ruby image and installing Node 6 manually (the other way round gave me some issues).
Here's the full `.travis.yml` file:

```
language: ruby
rvm:
  - 2.2

cache:
  bundler: true  # Doesn't seem to work
  directories:
  - node_modules

before_install:
  - nvm install 6
install:
  - bundle install
  - npm install

before_script:
  - git config --global user.name "Travis-CI"
  - git config --global user.email "noreply@travis-ci.org"
  # Decrypt and add deploy key (not necessary for private repo)
  - openssl aes-256-cbc -K $encrypted_c9381cfb26bc_key -iv $encrypted_c9381cfb26bc_iv -in .travis-deploy-key.enc -out .travis-deploy-key -d
  - chmod 600 .travis-deploy-key
  - eval "$(ssh-agent -s)"
  - ssh-add .travis-deploy-key

script:
  - grunt deploy
```

Just activate your repo on Travis CI, then commit those two files and watch your site magically build and deploy.
Note that if you're using a user page rather than a project page and therefore publishing to the `master` branch, Travis CI will trigger a build when it successfully pushes your build!
You can disable this behaviour using the "Build only if .travis.yml is present" setting.
The `gh-pages` branch is ignored by default, so project pages do not have this issue.

I have the build set to cache the Ruby and Node package install steps, but I'm not convinced the Bundler cache is doing anything.
It takes about 70s to run `bundle install` whether or not there's a cache, which is the majority of my build time.








## SSL Termination with CloudFlare
_This section is based on [a CloudFlare blog post](https://blog.cloudflare.com/secure-and-fast-github-pages-with-cloudflare/)._

Github Pages only supports SSL for pages served without a custom domain.
CloudFlare's Universal SSL can basically do the job, but there are a few caveats:

* The connection from CloudFlare to the origin _will_ use SSL but the origin certificate _will not_ be verified, so it's still possible to MITM the traffic
* The certificate CloudFlare issues for your site will also have Subject Alternate Names for other sites you don't control, [which might be embarrassing](https://www.troyhunt.com/should-you-care-about-the-quality-of-your-neighbours-on-a-san-certificate/)
* The certificate CloudFlare issues for your site will not work on a certain older browsers[^4]

If any of that is a deal-breaker you'll have to look elsewhere (e.g. hosting on [Amazon S3 behind Cloudfront](https://octoperf.com/blog/2015/06/01/host-jekyll-on-s3-cloudfront/)), but I think it's fine for most applications.
The upside of using CloudFlare is that you also get their caching, DDOS protection, HTTP/2 support etc for free.


To set it up, register with CloudFlare and [add your domain to your CloudFlare account](https://support.cloudflare.com/hc/en-us/articles/201720164-Step-2-Create-a-CloudFlare-account-and-add-a-website).
Set the custom domain on your Github Pages page to the domain (or subdomain) you want to serve it from, and add a CNAME record on CloudFlare pointing from that domain to `yourusername.github.io` (whether you're using a project page or a user page), and you're done!

### HTTPS redirection
You can redirect to HTTPS automatically using a [CloudFlare Page Rule](https://support.cloudflare.com/hc/en-us/articles/200172336-How-do-I-create-a-Page-Rule-).
You'll have to wait a while for CloudFlare to generate an SSL certificate first.

### Caching images etc
By default, CloudFlare will cache [most static filetypes](https://support.cloudflare.com/hc/en-us/articles/200172516-Which-file-extensions-does-CloudFlare-cache-for-static-content) for 4 hours regardless of the cache headers from the origin server (which for Github Pages is a 10 minute TTL).
Since my build process renames assets when they change, it's safe to set a long browser cache expiration time (I use one month).
Note that this is how long your visitors' browsers will wait before requesting a file again from CloudFlare, not how long CloudFlare's edge servers will wait before requesting a file again from Github Pages.
The default edge cache expiration setting seems to be to respect the cache headers from the origin server.
You can only change this setting with a Page Rule.

### Caching HTML files
CloudFlare does not cache HTML files by default.
You can set it to with a Page Rule, but if you're not careful you could end up unable to update your front page and posts!
On this site, I have a page rule that gives HTML files a browser cache TTL of 30 minutes (the shortest setting)
and an edge cache TTL of one day, and I purge the CloudFlare cache using [grunt-cloudflare-purge](https://github.com/ghinda/grunt-cloudflare-purge) whenever the content updates.
That means my whole website can be served from CloudFlare's cache, but visitors might not see updates for up to half an hour.
There's a race condition if I update one post to point at a new part of another and a visitor has both in their browser cache, but I don't think that's too big a deal.









## Wrapping up
To see all this put together, check out [mje-nz/jekyll-blog-template](https://github.com/mje-nz/jekyll-blog-template).
To see how this site is set up (which is a little more involved), see [mje-nz/blog.mje.nz](https://github.com/mje-nz/blog.mje.nz).








[^1]: As of [Jekyll 3.2](https://jekyllrb.com/news/2016/07/26/jekyll-3-2-0-released/), themes can be packaged as Ruby gems -- previously themes were used by forking a repository and carefully merging when the theme changes.
[^2]: As of 2017-01-13 it hasn't been updated in a few years, and I had to choose the HTML5 boilerplate template to get it to run to completion.
[^3]: [Grunt-contrib-imagemin](https://github.com/gruntjs/grunt-contrib-imagemin) packages gifsicle, jpegtran, optipng, and svgo.
[^4]: CloudFlare's free SSL certificates work on most browsers, but notably only on Windows Vista or later, Mac OSX 10.6 or later, iOS 4 or later, and Android 3 or later, see [here](https://support.cloudflare.com/hc/en-us/articles/203041594-What-browsers-work-with-CloudFlare-s-SSL-certificates-).
[^5]: They don't seem to have any intention of supporting community themes but the themes they provide look reasonably nice, see [here](https://help.github.com/articles/creating-a-github-pages-site-with-the-jekyll-theme-chooser/) for documentation.
[^6]: Although not directly, see [here](https://jekyllrb.com/docs/permalinks/).




<!-- Other resources:
https://developer.ubuntu.com/en/blog/2016/02/17/how-host-your-static-site-https-github-pages-and-cloudflare/
https://toddmotto.com/cache-busting-jekyll-github-pages
http://davidensinger.com/2015/01/performant-websites-with-jekyll-grunt-github-pages-and-cloudflare/
-->
