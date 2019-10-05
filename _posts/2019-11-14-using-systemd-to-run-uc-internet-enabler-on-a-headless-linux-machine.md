---
title: Using systemd to run UC Internet Enabler on a headless Linux machine
---

This post is a bit UC-specific.
To get Internet access on the UC network, each machine has to authenticate itself to the firewall.
The official Internet Enabler GUI tool for Windows does a fine job of keeping a machine authenticated, as does [John Stowers' cross-platform version](https://github.com/nzjrs/ienabler), but headless Linux machines are a bit trickier.
In the past I've used John's command-line script in a cron job, but it's never been quite as reliable as I'd like.
This post documents a more reliable setup using `systemd`.



## Setup
First, clone and install [John Stowers' `ienabler`](https://github.com/nzjrs/ienabler).
Create a systemd service for `ienabler`:
{: .no-gap}
```bash
# /usr/local/sbin/ienabler
#!/bin/bash
ienabler-cmd.py -u <username> -p <password>
```

```toml
# /etc/systemd/system/ienabler.service
[Unit]
Description=UC Internet Enabler
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/ienabler

[Install]
WantedBy=multi-user.target
```

```bash
# Make script executable and kind-of stop other users from
# reading it
$ sudo chmod 700 /usr/local/sbin/ienabler

# Run ienabler once
$ sudo systemctl start ienabler

# Run ienabler on boot
$ sudo systemctl enable ienabler
```

Now `ienabler` will run on boot once the network is connected.

**Aside.**
It's a bit of a shame to store a password in plain text but there isn't really an alternative: the Internet Enabler service only accepts plain-text passwords over unencrypted HTTP or Telnet, so there's no way to keep UC credentials safe from a mildly-dedicated attacker in any scenario.
It's not hard for another user to get the password out of this script (e.g., wait until `ienabler-cmd.py` runs then grab its command-line arguments from `/proc`), but at least it doesn't show up in the logs or a world-readable file this way.
{: .notice}

Each `ienabler` run seems to give Internet access for 24 hours, so we need a timer to run it every day:
{: .no-gap}
```toml
# /etc/systemd/system/ienabler.timer
[Unit]
Description=Run Internet Enabler every morning

[Timer]
OnCalendar=7:30

[Install]
WantedBy=timers.target
```

```bash
# Start ienabler scheduler
$ sudo systemctl start ienabler.timer

# Start ienabler scheduler on boot
$ sudo systemctl enable ienabler.timer
```

It shouldn't matter what time it runs; 7:30am should be after any scheduled firewall downtime but before I get in in the morning.

Other commands:
{: .no-gap}
```bash
# To check how long until ienabler next runs
$ systemctl status ienabler.timer

# To view logs from last run
$ systemctl status ienabler

# To view all logs
$ journalctl -u "ienabler*"
```



## Extra reliability
It's still possible that ICTS could reset the firewall or something and reset everyone's internet-enabled status.
To prevent this, create another service that tries to ping 1.1.1.1 (CloudFlare's DNS service) every five minutes and runs `ienabler` if the ping fails:
{: .no-gap}
```toml
# /etc/systemd/system/ienabler-failsafe.service
[Unit]
Description=UC Internet Enabler failsafe
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecCondition=bash -c "! ping -q -c1 -w10 1.1.1.1"
ExecStart=/usr/local/sbin/ienabler
```

```toml
# /etc/systemd/system/ienabler-failsafe.timer
[Unit]
Description=Run Internet Enabler failsafe every five minutes

[Timer]
OnCalendar=*:0/5

[Install]
WantedBy=timers.target
```

```bash
# Start ienabler-failsafe scheduler
$ sudo systemctl start ienabler-failsafe.timer

# Start ienabler-failsafe scheduler on boot
$ sudo systemctl enable ienabler-failsafe.timer
```


A side-effect of this service is that its log records a history of Internet connection status:
{: .no-gap}
```bash
$ journalctl -u ienabler-failsafe | grep "1 received"
Nov 14 11:05:14 mje-ci bash[149625]: 1 packets transmitted, 1 received, 0% packet loss, time 0ms
Nov 14 11:10:14 mje-ci bash[149631]: 1 packets transmitted, 1 received, 0% packet loss, time 0ms
Nov 14 11:15:14 mje-ci bash[149636]: 1 packets transmitted, 1 received, 0% packet loss, time 0ms
Nov 14 11:20:14 mje-ci bash[149641]: 1 packets transmitted, 1 received, 0% packet loss, time 0ms
Nov 14 11:25:14 mje-ci bash[149648]: 1 packets transmitted, 1 received, 0% packet loss, time 0ms
Nov 14 11:30:14 mje-ci bash[149653]: 1 packets transmitted, 1 received, 0% packet loss, time 0ms
Nov 14 11:35:14 mje-ci bash[149666]: 1 packets transmitted, 1 received, 0% packet loss, time 0ms
Nov 14 11:40:14 mje-ci bash[149671]: 1 packets transmitted, 1 received, 0% packet loss, time 0ms
Nov 14 11:45:14 mje-ci bash[149676]: 1 packets transmitted, 1 received, 0% packet loss, time 0ms
Nov 14 11:50:14 mje-ci bash[149681]: 1 packets transmitted, 1 received, 0% packet loss, time 0ms
Nov 14 11:55:14 mje-ci bash[149686]: 1 packets transmitted, 1 received, 0% packet loss, time 0ms
...
```
{: .code-small}

The logs seem to confirm that the firewall resets sessions after 24 hours.
Every morning `ienabler` and `ping` both run at 7:30, and the ping fails the first time:
{: .no-gap}
```bash
$ $ journalctl -u "ienabler*" | grep "Enabled"
Nov 04 07:30:14 mje-ci ienabler[116124]: Enabled OK
Nov 05 07:30:14 mje-ci ienabler[117944]: Enabled OK
Nov 06 07:30:14 mje-ci ienabler[119800]: Enabled OK
Nov 07 07:30:14 mje-ci ienabler[121598]: Enabled OK
Nov 08 07:30:14 mje-ci ienabler[128506]: Enabled OK
Nov 09 07:30:14 mje-ci ienabler[133654]: Enabled OK
Nov 10 07:30:14 mje-ci ienabler[135440]: Enabled OK
Nov 11 07:30:14 mje-ci ienabler[137233]: Enabled OK
Nov 12 07:30:14 mje-ci ienabler[139020]: Enabled OK
Nov 13 07:30:14 mje-ci ienabler[140784]: Enabled OK
Nov 14 07:30:14 mje-ci ienabler[148971]: Enabled OK
$ journalctl -u ienabler-failsafe | grep "50%"
Nov 04 07:30:15 mje-ci bash[116123]: 2 packets transmitted, 1 received, 50% packet loss, time 1005ms
Nov 05 07:30:15 mje-ci bash[117942]: 2 packets transmitted, 1 received, 50% packet loss, time 1005ms
Nov 05 15:55:15 mje-ci bash[118626]: 2 packets transmitted, 1 received, 50% packet loss, time 1037ms
Nov 06 07:30:15 mje-ci bash[119798]: 2 packets transmitted, 1 received, 50% packet loss, time 1005ms
Nov 07 07:30:15 mje-ci bash[121597]: 2 packets transmitted, 1 received, 50% packet loss, time 1005ms
Nov 08 07:30:15 mje-ci bash[128504]: 2 packets transmitted, 1 received, 50% packet loss, time 1005ms
Nov 09 07:30:15 mje-ci bash[133653]: 2 packets transmitted, 1 received, 50% packet loss, time 1004ms
Nov 10 07:30:15 mje-ci bash[135439]: 2 packets transmitted, 1 received, 50% packet loss, time 1005ms
Nov 11 07:30:15 mje-ci bash[137232]: 2 packets transmitted, 1 received, 50% packet loss, time 1005ms
Nov 11 13:15:15 mje-ci bash[137650]: 2 packets transmitted, 1 received, 50% packet loss, time 1037ms
Nov 11 13:20:15 mje-ci bash[137656]: 2 packets transmitted, 1 received, 50% packet loss, time 1005ms
Nov 12 07:30:15 mje-ci bash[139018]: 2 packets transmitted, 1 received, 50% packet loss, time 1005ms
Nov 13 07:30:15 mje-ci bash[140783]: 2 packets transmitted, 1 received, 50% packet loss, time 1005ms
Nov 14 07:30:15 mje-ci bash[148970]: 2 packets transmitted, 1 received, 50% packet loss, time 1005ms
```
{: .code-small}
