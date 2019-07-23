---
title: Coloured latexmk output
---

The LaTeX community is a bit different to other software communities in that it mostly consists of grey-bearded academics with work to do and PhD students procrastinating from writing their theses (ahem).
As such, LaTeX packages and tools fall into one of two categories: relics of a bygone age that nevertheless do basically everything you want, and trendy projects on GitHub that die off after their authors graduate.

An example of the former is `latexmk`, the most popular LaTeX build tool.
It's a single 10,000-line Perl script maintained by a semi-retired [particle physics wizard](https://www.phys.psu.edu/people/jcc8)[^1] which still contains bits of the [original 1992-era `go-make`](https://ctan.org/pkg/go-make), but the only thing it's really missing is coloured output.


### Colouring latexmk run messages
To colour the "Run number 1 of rule 'pdflatex'" messages, add this to `latexmkrc`:

```perl
{
    no warnings 'redefine';
    use Term::ANSIColor;
    my $old_warn_running = \&main::warn_running;
    sub color_warn_running {
        print STDERR color('green');
        $old_warn_running->(@_);
        print STDERR color('reset');
    }
    if (-t STDERR) {
        # Only use color if a terminal is attached
        *main::warn_running = \&color_warn_running;
    }
}
```

This wraps the subroutine `latexmk` uses to print important messages with `print` statements which change the terminal colour to green and back, as long as stderr is going to a terminal.
The `print` statements have to be to stderr for two reasons.
Firstly, `warn_running` prints to stderr and `print` is line buffered, so `print color('green')` wouldn't take effect until something else prints a line to stdout (or `STDOUT->flush()` is called).
More importantly, for the colours to still work with stdout redirected (`latexmk > log`) the color escape sequences have to go to stderr anyway.


### Colouring and filtering pdflatex output
There are many tools for doing all manner of clever things to the output of `pdflatex`, but I just want to hide the flood of files being loaded so I can see the errors and warnings.
This Python script does the bare minimum:

* Hides file loading messages
* Colours warnings and errors
* Keeps the output coming line-by-line
* Doesn't mess with anything it doesn't understand


```python
#!/usr/bin/env python3
"""Filter output of pdflatex.

Usage: filter.py <latex engine> <options> <file>
"""
import os
import subprocess
import sys

import colorama
from colorama import Fore, Style
colorama.init()


def main(cmd):
    # Disable pdflatex line wrap (where possible)
    env = dict(os.environ, max_print_line="1000000000")

    # Run pdflatex and filter/colour output
    pdflatex = subprocess.Popen(
        cmd, env=env, 
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT
    )
    for line in iter(pdflatex.stdout.readline, b''):
        line = line.decode('utf8').strip()
        if line.startswith('(/') or line.startswith('(./'):
            # Start loading file
            pass
        elif line.startswith(')'):
            # Finish loading file
            pass
        elif line.startswith('!'):
            # Error
            print(Fore.RED + line + Style.RESET_ALL)
        elif line.startswith('Overfull') or \
                line.startswith('Underfull') or \
                'warning' in line.lower() or \
                'missing' in line.lower() or \
                'undefined' in line.lower():
            # Warning
            print(Fore.YELLOW + line + Style.RESET_ALL)
        else:
            print(line)


if __name__ == '__main__':
    assert len(sys.argv) > 1
    main(sys.argv[1:])
```

To use it, put it in the same directory as your TeX files and add `$pdflatex = "./filter.py pdflatex %O %S";` to your `latexmkrc`.


[^1]: Naturally, [his personal website](http://www.personal.psu.edu/~jcc8/index.html) has a picture of him as a young man!
