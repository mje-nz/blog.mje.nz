---
title: Using GitHub Actions to automate CloudFlare cache purges for GitHub Pages sites
---

In [my previous post about this blog](/2019-05-24-new-jekyll-setup/) I mentioned using [Zapier](https://zapier.com) to clear CloudFlare's cache each time the GitHub Pages build finishes.
Since then, [GitHub Actions](https://github.com/features/actions) hit beta and [CloudFlare API Tokens](https://blog.cloudflare.com/api-tokens-general-availability/) were released.
Here is a method for clearing CloudFlare's cache without any extra services, and without giving a third party the ability to do anything untoward to your CloudFlare account.


From the CloudFlare dashboard for your site, click "Get your API token" (bottom right) then "Create Token".
Create an API token with the "Cache Purge: Edit" permission for the zone containing the site.
Leave the success page open so you can copy the token into the next step.

![A screenshot of the process for creating a CloudFlare API token.](/assets/img/2019-09-29-cloudflare-api-token.png)


Next, go to the "Secrets" page for your GitHub repo (in "Settings") and create a secret called `CLOUDFLARE_TOKEN` containing the CloudFlare API token.
Finally, create a file `.github/workflows/clear-cloudflare-cache.yml` with this content:

```yaml
{% raw %}
name: Clear CloudFlare cache
on: [deployment]
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
    - name: Call CloudFlare API
      env:
        CLOUDFLARE_TOKEN: ${{ secrets.CLOUDFLARE_TOKEN }}
      run: |
        [[ -n "$CLOUDFLARE_TOKEN" ]] || \
          ( echo "Error: Must set CLOUDFLARE_TOKEN secret"; exit 1 )
        curl -sS -X POST \
          "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/purge_cache" \
          -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
          -H "Content-Type: application/json" \
          --data '{"purge_everything": true}'
{% endraw %}
```
{: .code-small}

where `<ZONE_ID>` is the Zone ID for your site (from the CloudFlare Dashboard).
Now whenever the GitHub Pages build finishes, the action will run and clear the CloudFlare cache for the site.
