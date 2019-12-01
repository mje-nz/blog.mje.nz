---
title: Unblocking ZeroTier on Windows 10
---
I don't understand why no-one else seems to have this problem: when I set up [ZeroTier One](https://www.zerotier.com) on a Windows 10 machine, everything looks fine but things don't work seemingly at random.
Outbound connections are fine, and inbound FTP and a few other services work, but I can't ping it or use SMB!

It turns out that a lot of the default Windows firewall rules (e.g., for allowing incoming ICMP and SMB) are scoped to "Local subnets", which is supposed to mean the subnets of all the NICs on the machine ([source](https://serverfault.com/a/361206)).
For whatever reason that doesn't seem to include the ZeroTier adaptor, so the firewall rules I'd added myself (for FTP etc) applied but the default ones didn't.
Modifying the default rules to add my ZeroTier subnet didn't work at all.

To fix it by allowing incoming pings and file sharing connections from ZeroTier peers:

* Open Control Panel > Windows Defender Firewall.
* In the left panel, click "Advanced Settings".
* In the left panel, click "Inbound Rules".
* Create a rule with name "ZeroTier ICMPv4-In", type "Custom", and protocol "ICMPv4", and add your ZeroTier subnet under "remote IP addresses".
* Create a rule with name "ZeroTier SMB-In", type "Custom", protocol "TCP", and local port "Specific ports" and "445", and add your ZeroTier subnet under "remote IP addresses".


Or to fix it lazily by allowing incoming connections from ZeroTier peers on any port:

* Open Control Panel > Windows Defender Firewall.
* In the left panel, click "Advanced Settings".
* In the left panel, click "Inbound Rules".
* In the right panel, click "New Rule...".
* Choose the "Custom" rule type, all programs, and all ports and any protocols.
* In the "Scope" step, add your ZeroTier subnet to the remote IP address list.
* Choose "Allow the connection" and all of "Domain/Private/Public".
* Give it a sensible name and description and click "Finish".

<small>
Source: [Doug A.K. on Stack Exchange](https://superuser.com/a/231363)
</small>
