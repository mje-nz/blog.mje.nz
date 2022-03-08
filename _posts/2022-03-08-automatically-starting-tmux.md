---
title: Maintaining persistent tmux sessions for remote work
---

A lot of people have complicated ways of keeping a `tmux` session going on a remote machine and automatically connecting to it, but all you really need is `tmux new -A`.
This will attach to the default session if it is running, or create it if it is not.

A simple way of doing this automatically is to create an SSH alias like this in `~/.ssh/config`:

```
Host work
    Hostname <work PC IP>
    ForwardAgent yes
    RequestTTY yes
    RemoteCommand tmux -u new -A -s remote
```

Now when you run `ssh work` it will connect to your work PC, forwarding your local SSH agent for convenience, and start/attach to a `tmux` session called "remote".

The only catch is that if you have an up-to-date `tmux` installed using Homebrew (with the default Homebrew settings), it will be in `~/linuxbrew/.linuxbrew/bin`, so the SSH daemon will run the outdated system `tmux` for you, and then any `tmux` command in your session will fail with `tmux server version is too old for client`!
To fix this, just symlink `tmux` into `/usr/local/bin`.
