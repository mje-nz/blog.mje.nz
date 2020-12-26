---
title: Automatic DNS resolution for ZeroTier virtual networks
---
With the release of [ZeroTier One 1.6](https://github.com/zerotier/ZeroTierOne/releases/tag/1.6.0) last month came an essential new feature: centralised DNS configuration.
Setting a DNS server and search domain for the network in [ZeroTier Central](https://my.zerotier.com/network) makes the client set up split DNS when it connects, as long as the client has the "Allow DNS" box checked in "Network Details".
That makes [mje-nz/zerotier-dns](https://github.com/mje-nz/zerotier-dns), an old side project of mine which automatically sets up a DNS server for ZeroTier member names, much more useful!
Just set it up on a machine on the network and use that machine's address in the network configuration, then every client will be able to refer to the others by name under the domain of your choice.

There are a few caveats:

* ZeroTier Central will not accept top-level domains: "membername.yourdomain.com" is valid but "membername.zt" is not.
* On macOS, some command-line troubleshooting tools like `dig` and `nslookup` use their own DNS resolution logic which won't use the split DNS configuration (see [this Stack Exchange answer](https://superuser.com/a/1177211)).
