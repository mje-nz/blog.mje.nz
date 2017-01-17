---
title: Proof-of-concept UAV tree pruner
---

Here's a milestone for the tree pruning project: today we managed to prune our simulated branch in the lab without needing an expert pilot!
In the video, I'm piloting the UAV (off-camera to the left) while Jamie is operating the pruner using a separate controller (off-camera to the right).
The "branch" is a 10&thinsp;mm dowel taped to a step ladder, and the enormous backpack unit for the pruner is just sitting on the ground.

<iframe width="560" height="315" src="https://www.youtube.com/embed/hs4E5Ec8LFM" frameborder="0" allowfullscreen></iframe>&nbsp;

We've run a similar setup to this before, but manoeuvring line of sight with sufficient precision from a distance away outside the safety net was only just achievable with Kelvin (our most experienced pilot) flying, and even then it was pretty borderline.
The issue is that the pilot has to place the head of the pruning tool with about 1&thinsp;cm accuracy, but the pruning tool is mounted 30&thinsp;cm or so away from the centre of gravity.
There's no way to do that and still correct for disturbances (without adding extra degrees of freedom), so the only way to do it with this setup is to fly a trajectory where the pruning tool intersects the branch and then trigger the pruner before anything bad happens!

After working on it for a month or so, Jamie's managed to get altitude hold working well enough indoors that we could pull this off on our own.
He found that the Lightwave SF10 we're using is delicate enough that having a Frsky receiver on board with telemetry active was enough to mess with the distance measurements.
After quite a bit of troubleshooting (separate voltage regulators, extra decoupling, ferrites, a completely separate battery, and shielded cabling) which made things better but not perfect, we just gave up and switched to radios without telemetry.
There's still plenty of room for improvement---the controls are twitchy for pitch/roll and sluggish for altitude, and the cable for the pruner messes with the altitude controller a bit---but it's good enough to prove it's possible.
