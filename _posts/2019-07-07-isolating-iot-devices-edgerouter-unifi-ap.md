---
title: Isolating IoT devices with an EdgeRouter and a Unifi AP
---
I'm starting to get a fair few WiFi-connected "smart home" devices.
Most of them are either fully home-made or have custom firmware on them (thanks to [ESPHome](http://esphome.io)), but there are two I don't trust: an outdated D-Link IP camera I got for free, and a [Broadlink RM Mini](http://s.click.aliexpress.com/e/cD6HjWy0
).
I don't particularly want either of them to be able to access the internet, and there's no need for them to have full access for my network either.

There's a lot of conflicting information online about how to set up an isolated network for IoT devices and none of it was exactly what I wanted, so here's what I did.
I'm using an [Edgerouter X](https://www.ascent.co.nz/productspecification.aspx?itemID=435201) and a [Unifi AP-AC-LR](https://www.ascent.co.nz/productspecification.aspx?itemID=437330), with a few PCs hard-wired to the ER-X and everything else on WiFi.
I want everything untrusted to connect to a separate WiFi network and end up in a separate VLAN with no access to the internet and limited access to my other devices.


### VLAN Setup
_This section is based on a post from [webcodr](https://webcodr.io/2018/02/edgerouter-vlan-isolation/), which is better as it has pictures._

* Create a new VLAN on `switch0` with ID `107`, description `IoT`, and address `10.0.107.1/24`.
* Add a DHCP server with name `IoT`, subnet `10.0.107.0/24`, a sensible range, and router and DNS server `10.0.107.1`.
* In the DNS server listen interfaces list, add `switch0.107`.

Now any new device on VLAN 107 will be able to join the isolated network.
When they do, they can access the internet, the main network, and the router.
To lock it down:

* In firewall policies, add a new ruleset called `IOT_IN` with default action `reject`, interface `switch0.107` and direction `in`.  This will block traffic from the VLAN to the internet or the main network.
* Add a rule to `IOT_IN` to accept established and related packets.
* Add a new ruleset called `IOT_LOCAL` with default action `reject`, interface `switch0.107` and direction `local`.  This will block traffic from the VLAN to the router.
* Add a rule to `IOT_LOCAL` to accept UDP traffic to port 53 (DNS).
* Add a rule to `IOT_LOCAL` to accept UDP traffic to port 67 (DHCP).

Now devices in the isolated network have no access to the internet[^1], minimal access to the router, and can only respond to (not connect to) devices on the main network.
Poke just enough holes to make everything work:
* Add a rule to `IOT_IN` to accept UDP traffic to port 123 (NTP).
* Add a rule to `IOT_IN` to accept TCP traffic to port 1883 on the server hosting your MQTT broker.

There are a few important caveats:

* MDNS isn't forwarded between networks, so (for example) you have to connect to the isolated network to upload firmware to ESPHome devices.  This is probably a deal-breaker if you put a Chromecast, Echo, or Apple TV etc in the isolated network but doesn't bother me; you can fix it by setting up MDNS reflection on the router.
* Occasionally having no internet access on the isolated network is inconvenient (e.g., updating firmware); you can temporarily unblock it by changing the default action for `IOT_IN` to `accept`.
* When you connect to the isolated network you have all the same restrictions, which is also inconvenient.  You can fix this by adding a rule to accept all from your MAC address.


### WiFi setup
To allow wireless clients to join the new isolated network, just go into the UniFi controller settings and add a new wireless network with the VLAN set to `107` (in advanced settings).[^2]
Some devices throw a tantrum during setup if you use a 5GHz network; you can disable the 5GHz band for the IoT wireless network in the config for each AP, in the "WLANS" section, by overriding it in the "WLAN 5G" subsection and disabling it.


[^1]: Technically devices on the isolated network can access the internet using DNS and DHCP; if you care then limit the rules to `10.0.107.1`.
[^2]: The "Networks" tab does nothing unless you have a USG or USW.
