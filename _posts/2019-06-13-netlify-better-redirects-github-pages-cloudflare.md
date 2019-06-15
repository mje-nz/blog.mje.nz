---
title: Using Netlify for better redirects on a GitHub Pages/CloudFlare site
---

As I write this post, the blog is on [blog.mje.nz](https://blog.mje.nz) and [mje.nz](https://mje.nz) itself just hosts shortlinks (e.g. [mje.nz/ref](https://mje.nz/ref)).
Both have been hosted as GitHub Pages sites behind CloudFlare.
The only problem is that GitHub Pages can't server a proper HTTP redirect.
I've been using an HTML redirect instead, but it's not scaling well:

```html
<!-- ref/index.html -->
<html>
<head>
  <meta http-equiv="refresh" content="0; url=https://blog.mje.nz/2019-06-09-reference-material/" />
</head>

<body>
  <p><a href="https://blog.mje.nz/2019-06-09-reference-material/">
    Click here if you are not redirected
  </a></p>
</body>
</html>
```

GitLab Pages also doesn't support redirects, but [Netlify does](https://www.netlify.com/docs/redirects/).
I like having the blog platform-agnostic, but the front page doesn't matter as much so I've given it a go.

Unlike what I've read, you can switch from GitHub Pages to Netlify without any downtime.
First, I configured Netlify to build the site and serve it at `mje.netlify.com` and `mje.nz`.
Then in the CloudFlare DNS panel, I set the CNAME for `mje.nz` to point at `mje.netlify.com`.
Since CloudFlare is still in front there's no need to wait for DNS to propagate; the site will continue to resolve to CloudFlare's anycast network and the edge nodes will rapidly switch origins from GitHub Pages to Netlify (which at this point are serve identical content).
CloudFlare continues to serve everything over HTTPS, and Full (Strict) SSL continues to work.[^1]
Netlify complains about the DNS configuration because they want you to use their CDN, but it works just fine.

After setting it up, I turned Github Pages off and switched to using Netlify redirects:
```bash
# _redirects
/ref https://blog.mje.nz/2019-06-09-reference-material/
```

Easy!

[^1]: If you want Netlify in front then you have to disable CloudFlare's caching and wait for the DNS to propagate before Netlify can issue an SSL certificate, which means there'll be a period where your site isn't accessible over HTTPS.
