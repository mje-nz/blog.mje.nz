---
title: Writing better Python code, automatically
toc: true
---
As a software developer, your time, focus, and mental stamina are precious resources.
Modern tooling can free you from having to think about all sorts of menial tasks, letting you write better code with less effort.
This post outlines a process for gradually introducing such tooling into an established project.


## Step 1: catching bugs and anti-patterns
[Flake8](https://flake8.pycqa.org/en/latest/) is a Python linter: a tool which checks Python code for errors and evaluates it for quality and style.
There is an ecosystem of plugins which add further checks or integrate other tools, notably:

* [flake8-bugbear](https://github.com/PyCQA/flake8-bugbear), which has rules that are considered too subjective for the main Flake8 distribution,
* [flake8-comprehensions](https://github.com/adamchainz/flake8-comprehensions), which checks for issues around comprehensions, generators, and initialisation,
* [flake8-docstrings](https://github.com/PyCQA/flake8-docstrings), which uses [pydocstyle](http://www.pydocstyle.org/en/stable/) to enforce documentation presence and style,
* [flake8-requirements](https://github.com/Arkq/flake8-requirements), which checks for missing or unused dependencies, and
* [pep8-naming](https://github.com/PyCQA/pep8-naming), which checks names against the [PEP8 naming conventions](https://www.python.org/dev/peps/pep-0008/#naming-conventions).

Code that passes Flake8 is free of a range of issues that would otherwise not show up until later in the development cycle, which saves a lot of time.
Since Python is an interpreted language, it's easy to introduce errors which even a reasonably thorough testing procedure wouldn't detect.
For example, consider this simple refactoring:

```python
# Before
def main():
    try:
        cfg = parse_config(open("config.txt").read())
    except FileNotFoundError:
        cfg = {}
    run(cfg)

# After
def main():
    try:
        config = parse_config(open("config.txt").read())
    except FileNotFoundError:
        cfg = {}
    run(config)
```

The new `main` appears to work normally, but if the config file is not present it fails with `UnboundLocalError`.
Flake8 catches the problem, warning `F841 local variable 'cfg' is assigned to but never used`.
Although this is a contrived example to demonstrate one particular rule, this kind of error doesn't necessarily show up in manual testing and can even get through moderately thorough unit test suites.

However, adding Flake8 to an existing codebase tends to produce a sea of violations, which can make it hard to integrate into an existing workflow.
With that in mind, a good way to transition a codebase into passing Flake8 is to start with a subset of rules that catches only the most serious errors.
First, install Flake8:

```console
$ pip install flake8 flake8-bugbear flake8-requirements
```

Then configure it in `setup.cfg`:

```ini
# setup.cfg
[flake8]
select =
    # pycodestyle
    E112,E113,E9,W6,
    # pyflakes
    F402,F404,F406,F407,F5,F6,F7,F821,F823,F831,
    # flake8-bugbear
    B,B902,
    # flake8-requirements
    I900
ignore =
    # pycodestyle
    W605,
    # pyflakes
    F504,F522,F523,F541,F705,
    # flake8-bugbear
    B001,B005,B007,B013,B014,B015
```
{: .code-med}

Then run it on your code:

```console
$ flake8
```

On a large codebase this can turn up a lot of violations, and many of them will be real bugs.
Go through them all and either fix them or, if you understand them and you're confident you know better, [ignore them one-by-one](https://flake8.pycqa.org/en/latest/user/violations.html#in-line-ignoring-errors) with `# noqa: <code>` comments.

Once the whole codebase passes, we need to make sure it stays that way.
It's helpful to set up your editor or IDE to run Flake8 as you type (most editors and IDEs can do this).
It's easy to miss a warning that way though, so it's a good idea to also add a Git hook which automatically runs Flake8 before you commit; that way, you won't be able to commit new violations.
You can do this easily with [pre-commit](https://pre-commit.com).
First, install it and add it to your repo:

```console
$ pip install pre-commit
$ pre-commit install
```

Then configure pre-commit to run Flake8, and also a long list of other checks and fixes that are occasionally helpful (see [here](https://pre-commit.com/hooks.html) for details of the other hooks):

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://gitlab.com/pycqa/flake8
    rev: 3.8.4
    hooks:
      - id: flake8
        additional_dependencies:
          - flake8-bugbear==20.11.1
          - flake8-requirements==1.3.3
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v3.3.0
    hooks:
      - id: fix-byte-order-marker
      - id: check-case-conflict
      - id: check-executables-have-shebangs
      - id: check-json
      - id: check-merge-conflict
      - id: check-symlinks
      - id: check-toml
      - id: check-xml
      - id: check-yaml
      - id: detect-private-key
      - id: end-of-file-fixer
      - id: trailing-whitespace
  - repo: https://github.com/pre-commit/pygrep-hooks
    rev: v1.7.0
    hooks:
      - id: python-check-blanket-noqa
      - id: python-check-mock-methods
      - id: python-no-eval
      - id: python-no-log-warn
      - id: rst-backticks
      - id: rst-directive-colons
      - id: rst-inline-touching-normal
      - id: text-unicode-replacement-char
```

Now as you long as you remember to run `pre-commit install` after checking out the repo,[^pre] `git commit` will fail on code that doesn't pass Flake8.
To be extra safe, you should also run the checks in continuous integration.
That way, a contributor who hasn't followed your developer instructions and thus doesn't have pre-commit installed will have their code checked (and probably rejected) without your involvement.
If you don't have CI set up and you're using GitHub, just add this in `.github/workflows`:

[^pre]: You can also use the [git template directory](https://pre-commit.com/#pre-commit-init-templatedir) to have `git clone` and `git init` automatically install pre-commit.

```yaml
# .github/workflows/checks.yml
name: Run checks
on:
  push:
jobs:
  checks:
    runs-on: ubuntu-18.04
    steps:
    - name: Check out
      uses: actions/checkout@v2
    - name: Set up Python
      uses: actions/setup-python@v2
    - name: Install pre-commit
      run: pip install pre-commit && pre-commit install
    - name: Run pre-commit on all files
      run: pre-commit run -a
```

While you're there you may as well run your test suite, which probably looks something like this:

{% raw %}
```yaml
# .github/workflows/tests.yml
name: Run tests
on:
  push:
jobs:
  tests:
    strategy:
      fail-fast: false
      matrix:
        os: [
          ubuntu-16.04, ubuntu-18.04, ubuntu-20.04,
          macos-10.15, windows-2019
        ]
        python-version: [3.7, 3.8, 3.9]
    runs-on: ${{ matrix.os }}
    steps:
    - name: Check out
      uses: actions/checkout@v2
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v2
      with:
        python-version: ${{ matrix.python-version }}
    - name: Install
      run: pip install .
    - name: Run tests
      run: pytest
```
{% endraw %}

Note that the pre-commit configuration pins each tool to a specific version in order to prevent surprises.
You can have it update them all for you with `pre-commit autoupdate`.[^1351]

[^1351]: Unfortunately, `pre-commit autoupdate` will not update the flake8 plugins ([flake8#1351](https://github.com/pre-commit/pre-commit/issues/1351)).



## Step 2: enforcing best practices
Now that we have a system in place, we can extend Flake8's scope to not only catch likely bugs but also enforce best practises and general tidiness.

```yaml
# In .pre-commit-config.yaml (replacing the previous
# flake8 config)
      - id: flake8
        additional_dependencies:
          - flake8-bugbear==20.11.1
          - flake8-comprehensions==3.3.0
          - flake8-docstrings==1.5.0
          - flake8-requirements==1.3.3
          - pep8-naming==0.11.1
          - pydocstyle==5.1.1
```

```ini
# In setup.cfg, replacing the previous flake8 config
[flake8]
# flake8-docstrings config
docstring-convention = google
# rules
select =
    # pycodestyle
    E112,E113,E71,E72,E74,E9,W6,
    # pyflakes
    F,
    # flake8-bugbear
    B,B902,
    # flake8-comprehensions
    C4,
    # flake8-docstrings
    D1,
    # flake8-requirements
    I,
    # pep8-naming
    N807,
ignore =
    # pyflakes (allow star imports)
    F403,F405,
    # flake8-comprehensions (allow dict() calls)
    C408,
    # pydocstyle
    # (allow __init__ without docstring)
    D107,
    # (allow first line of docstring to wrap)
    D415,
    # pep8-naming (overlaps with B902)
    D404,D405,
```

Now Flake8 will catch all the same bugs as before as well as a lot of anti-patterns, dead code, missing documentation and so on.
Passing all these checks should make your code pretty functional overall.
More importantly, it should stay that way without much effort on your part, and anyone who sends you a PR will have their code held to the same standard automatically.



## Step 3: maintaining a consistent style
So far we've set up tooling to help write code that works better.
Another way we can save effort is by automating the way code _looks_.
Traditionally, software engineering teams have a style guide which everyone consciously follows, and code is manually checked for conformance during code review.
This results in a consistent code base which is easy to read and comfortable to work in at the expense of constant minor effort and occasional bitter debates.
With modern tooling, those downsides go away.

The easiest way to maintain a consistent code style is to use [Black](https://github.com/psf/black), the Python formatter with basically no options.
[Black's code style](https://github.com/psf/black/blob/master/docs/the_black_code_style.md) is an opinionated subset of [PEP8](https://www.python.org/dev/peps/pep-0008/).
I don't always appreciate its style choices, particularly how it indents deeply-nested data structures and [how it formats math](https://github.com/psf/black/issues/148), but in my opinion the benefits outweigh the minor annoyances.
It's the most popular Python formatter by a wide margin, with over 35k projects on GitHub using it, so there's a strong argument that getting comfortable with the Black style will pay off if you want to be part of the greater Python community.
Not everyone is a fan though; if you have strong feelings about single quotes or where brackets should go you might prefer Google's [yapf](https://github.com/google/yapf), which is extremely configurable, or if you [don't believe in auto-formatting at all](https://luminousmen.com/post/my-unpopular-opinion-about-black-code-formatter) then you might prefer to just use strict Flake8 checks (like the ones we're about to set up).

While we're making sweeping code changes, we may as well use [isort](https://pycqa.github.io/isort/) to keep package imports sorted[^isort] and [yesqa](https://github.com/asottile/yesqa) to automatically remove unnecessary `# noqa` comments:[^yesqa]

[^isort]: [PEP8](https://www.python.org/dev/peps/pep-0008/#imports) specifies a standard order for package imports: standard library imports, then third party imports, then local imports.
          If your project structure is complicated, you may have to inform isort which modules are yours using the `known_first_party` option.

[^yesqa]: In the pre-commit config, `&flake8-deps` is an anchor and `*flake8-deps` is an alias.
          This is a YAML feature which enables sections of the config to be reused, in this avoiding repetition of the list of Flake8 plugins.

```yaml
# In the flake8 config in .pre-commit-config.yaml
      - id: flake8
        additional_dependencies: &flake8-deps

# Under repos: in .pre-commit-config.yaml
  - repo: https://github.com/ambv/black
    rev: 20.8b1
    hooks:
      - id: black
  - repo: https://github.com/pycqa/isort
    rev: 5.6.4
    hooks:
      - id: isort
  - repo: https://github.com/asottile/yesqa
    rev: v1.2.2
    hooks:
    - id: yesqa
      additional_dependencies: *flake8-deps
```

```ini
# In setup.cfg, replacing the previous flake8 config
[flake8]
max-line-length = 88
# mccabe config
max-complexity = 12
# flake8-docstrings config
docstring-convention = google
# rules
select =
    # mccabe
    C9,
    # pycodestyle
    E,W,
    # pyflakes
    F,
    # flake8-bugbear
    B,B9,
    # flake8-comprehensions
    C4,
    # flake8-docstrings
    D,
    # flake8-requirements
    I,
    # pep8-naming
    N,
ignore =
    # pycodestyle (for black)
    E203,W503,
    # pyflakes (allow star imports)
    F403,F405,
    # flake8-bugbear (overlaps with E501)
    B950,
    # flake8-comprehensions (allow dict() calls)
    C408,
    # pydocstyle
    # (allow __init__ without docstring)
    D107,
    # (allow first line of docstring to wrap)
    D415,
    # pep8-naming (overlaps with B902)
    D404,D405,

# Also in setup.cfg
[isort]
# From black readme
multi_line_output=3
include_trailing_comma=True
force_grid_wrap=0
use_parentheses=True
ensure_newline_before_comments = True
line_length=88
```

Black should fix most of the style issues Flake8 checks, so now Flake8 is turned on all the way apart from where tools clash and a few things I find too strict.
Now when you go to commit, all the files you touched are reformatted with a standard code style, all the docstrings are checked for conformance with the [Google docstring convention](https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings), all the names are checked against the [PEP8 naming conventions](https://www.python.org/dev/peps/pep-0008/#naming-conventions), and all the functions are evaluated for complexity.

Getting the code style consistent is undeniably disruptive though.
Reformatting the whole codebase in one go and using `git config blame.ignoreRevsFile`[^ignorerevs] (as the [Black documentation](https://github.com/psf/black#migrating-your-code-style-without-ruining-git-blame) recommends) leaves `git blame` mostly working,[^blame] but will still show up in every file's history and probably mess up merging any active branches.
Reformatting each file as you touch it leaves the history tidy but ruins `git blame`.
Reformatting each file in a separate commit before you touch it and adding every single reformatting commit to the ignore-revs file is arguably the best of both worlds, but is also more work and easy to mess up.
Black and pre-commit can help with any of those approaches, but for anything other than doing it all at once you'll have to take pre-commit out of CI and run the other checks manually.

[^ignorerevs]: This [Moxio blog post](https://www.moxio.com/blog/43/ignoring-bulk-change-commits-with-git-blame) is a good explanation of `blame.ignoreRevsFile`.
[^blame]: Unfortunately neither [GitHub](https://github.community/t/support-ignore-revs-file-in-githubs-blame-view/3256) nor [GitLab](https://gitlab.com/gitlab-org/gitlab/-/issues/31423) respect `blame.ignoreRevsFile`; local tools are more likely to support it.



## Step 4: bonus points
If you stop here you'll be pretty well set up, but there are a few more tools you can use that require a bit more effort.


### More linting
[Pylint](http://pylint.pycqa.org/en/latest/) is the original Python linter.
It produces more false positives than Flake8 but also catches more bugs, so if you're starting fresh or don't mind going through a lot of minor issues then it's worth a go.

```yaml
# In setup.cfg
[pylint.MASTER]
disable =
    # Fails in pre-commit venv
    import-error,
    # Conflicts with or covered by other tools
    bad-continuation,
    line-too-long,
    missing-docstring,
    ungrouped-imports,
    wildcard-import,
    wrong-import-order,
    # Annoying
    fixme,
    no-self-use,
    too-few-public-methods,
    unused-wildcard-import,
```

```yaml
# Under repos: in .pre-commit-config.yaml
  - repo: https://github.com/PyCQA/pylint
    rev: pylint-2.6.0
    hooks:
      - id: pylint
```

There are also other linters I haven't used, notably [Radon](https://radon.readthedocs.io/en/latest/), which complains if your code is too complex, and [Bandit](https://github.com/PyCQA/bandit), which checks for security flaws.


### Static typing
[Mypy](http://mypy-lang.org) is a static type checker which often catches impressively subtle bugs.
Static type checkers for dynamic languages rely on the assumption that variables really only have one type at a time, which turns out to be usually true.
Many commonly-used libraries have type information available already, so out of the box Mypy will warn you about calling library functions with the wrong arguments, using their return values incorrectly, and so on.
If you add [type annotations](https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html) to your code then it will do the same for you.
Ideally, every function should have parameter and return type annotations.

```yaml
# Under repos: in .pre-commit-config.yaml
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v0.720
    hooks:
      - id: mypy
```

```ini
# In setup.cfg
[mypy]
# Don't when when an import cannot be resolved
ignore_missing_imports = True
# Check the body of every function, regardless of
# whether it has type annotations
check_untyped_defs = True
# Warn about casts that do nothing
warn_redundant_casts = True
# Warn about "type: ignore" comments that do nothing
warn_unused_ignores = True
# Warn when a function is missing return statements in
# some execution paths
warn_no_return = True
# Warn about code determined to be unreachable or
# redundant after performing type analysis
warn_unreachable = True
# Allow variables to be redefined with a different type
allow_redefinition = True
# Prefixes each error with the relevant context
show_error_context = True
# Shows error codes in error messages, so you can use
# specific ignore comments
# i.e., "type: ignore[code]"
show_error_codes = True
# Use visually nicer output in error messages
pretty = True
```

You can leave most things un-annotated and still get a lot out of it, but it will occasionally complain.
For example:

```python
values = {"test": 1}
# The type of values is inferred as Dict[str, int]
values["test2"] = "test"
# Mypy gives error: Incompatible types in assignment
# (expression has type "str", target has type "int")
```

The error is that the dictionary was used differently to how Mypy assumed it would be; you can fix it by adding a type annotation:

```python
from typing import Dict, Any
values = {"test": 1}  # type: Dict[str, Any]
values["test2"] = "test"
```

Mypy was developed by a team at Dropbox in the early 2010s.
Lately, a few competitors have arrived: [Pytype](https://google.github.io/pytype/) from Google, [Pyre](https://pyre-check.org) from Facebook, and [Pyright](https://github.com/Microsoft/pyright) from Microsoft.
I haven't used them, but you might prefer them; Pyright, in particular, integrates nicely with VS Code.



## Conclusion
In this post, I've shown a workflow that uses an assortment of tools to catch bugs early, ensure code follows best practises, and maintain a consistent style, all while minimising the amount of effort required.
The code this workflow produces is not automatically perfect: there is more to writing good code than what a tool can automate.
Following the workflow is more effort than just writing bad code, and you might disagree with some of the specifics, but if your aim is to write the best code you can then these tools can help.

Here are the final config files:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/ambv/black
    rev: 20.8b1
    hooks:
      - id: black
  - repo: https://gitlab.com/pycqa/flake8
    rev: 3.8.4
    hooks:
      - id: flake8
        additional_dependencies: &flake8-deps
          - flake8-bugbear==20.11.1
          - flake8-comprehensions==3.3.0
          - flake8-docstrings==1.5.0
          - flake8-requirements==1.3.3
          - pep8-naming==0.11.1
          - pydocstyle==5.1.1
  - repo: https://github.com/pycqa/isort
    rev: 5.6.4
    hooks:
      - id: isort
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v3.3.0
    hooks:
      - id: check-builtin-literals
      - id: check-case-conflict
      - id: check-docstring-first
      - id: check-executables-have-shebangs
      - id: check-json
      - id: check-merge-conflict
      - id: check-symlinks
      - id: check-toml
      - id: check-xml
      - id: check-yaml
      - id: detect-private-key
      - id: end-of-file-fixer
      - id: fix-byte-order-marker
      - id: mixed-line-ending
      - id: trailing-whitespace
  - repo: https://github.com/pre-commit/pygrep-hooks
    rev: v1.7.0
    hooks:
      - id: python-check-blanket-noqa
      - id: python-check-mock-methods
      - id: python-no-eval
      - id: python-no-log-warn
      - id: rst-backticks
      - id: rst-directive-colons
      - id: rst-inline-touching-normal
      - id: text-unicode-replacement-char
  - repo: https://github.com/PyCQA/pylint
    rev: pylint-2.6.0
    hooks:
      - id: pylint
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v0.790
    hooks:
      - id: mypy
  - repo: https://github.com/asottile/yesqa
    rev: v1.2.2
    hooks:
    - id: yesqa
      additional_dependencies: *flake8-deps
```

```ini
# setup.cfg
[flake8]
max-line-length = 88
# mccabe config
max-complexity = 12
# flake8-docstrings config
docstring-convention = google
# rules
select =
    # mccabe
    C9,
    # pycodestyle
    E,W,
    # pyflakes
    F,
    # flake8-bugbear
    B,B9,
    # flake8-comprehensions
    C4,
    # flake8-docstrings
    D,
    # flake8-requirements
    I,
    # pep8-naming
    N,
ignore =
    # pycodestyle (for black)
    E203,W503,
    # pyflakes (allow star imports)
    F403,F405,
    # flake8-bugbear (overlaps with E501)
    B950,
    # flake8-comprehensions (allow dict() calls)
    C408,
    # pydocstyle
    # (allow __init__ without docstring)
    D107,
    # (allow first line of docstring to wrap)
    D415,
    # pep8-naming (overlaps with B902)
    D404,D405,

[isort]
# From black readme
multi_line_output=3
include_trailing_comma=True
force_grid_wrap=0
use_parentheses=True
ensure_newline_before_comments = True
line_length=88

[pylint.MASTER]
disable =
    # Fails in pre-commit venv
    import-error,
    # Conflicts with or covered by other tools
    bad-continuation,
    line-too-long,
    missing-docstring,
    ungrouped-imports,
    wildcard-import,
    wrong-import-order,
    # Annoying
    fixme,
    no-self-use,
    too-few-public-methods,
    unused-wildcard-import,

[mypy]
# Don't when when an import cannot be resolved
ignore_missing_imports = True
# Check the body of every function, regardless of
# whether it has type annotations
check_untyped_defs = True
# Warn about casts that do nothing
warn_redundant_casts = True
# Warn about "type: ignore" comments that do nothing
warn_unused_ignores = True
# Warn when a function is missing return statements in
# some execution paths
warn_no_return = True
# Warn about code determined to be unreachable or
# redundant after performing type analysis
warn_unreachable = True
# Allow variables to be redefined with a different type
allow_redefinition = True
# Prefixes each error with the relevant context
show_error_context = True
# Shows error codes in error messages, so you can use
# specific ignore comments
# i.e., "type: ignore[code]"
show_error_codes = True
# Use visually nicer output in error messages
pretty = True
```

```yaml
# .github/workflows/checks.yml
name: Run checks
on:
  push:
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
    - name: Check out
      uses: actions/checkout@v2
    - name: Set up Python
    - name: Install pre-commit
      run: pip install pre-commit && pre-commit install
    - name: Run pre-commit on all files
      run: pre-commit run -a
```



## Appendix: Flake8 rules by importance
As of flake8 3.8.4, flake8-bugbear 2020.11.1, flake8-comprehensions 3.3.0, pydocstyle 5.1.1, flake8-requirements 1.3.3, and pep8-naming 0.11.1, here are the rules I think are important.
I've abbreviated some of the flake8-bugbear and flake8-comprehensions rules; see their docs for full explanations.
For full explanations of many of the core Flake8 rules, see Grant McConnaughey's [Big Ol' List of Rules](https://www.flake8rules.com).
Note that many pydocstyle rules are disabled by default depending on the docstring convention selected.

Rules that catch bugs:

> **E112**: Expected an indented block<br/>
> **E113**: Unexpected indentation
>
> **E901**: `SyntaxError` or `IndentationError`<br/>
> **E902**: `IOError`<br/>
> **E999**: `SyntaxError`
>
> **W601**: `.has_key()` is deprecated, use `in`<br/>
> **W602**: Deprecated form of raising exception<br/>
> **W603**: `<>` is deprecated, use `!=`<br/>
> **W604**: Backticks are deprecated, use `repr()`<br/>
> **W606**: `async` and `await` are reserved keywords starting with Python 3.7
>
> **F402**: Import `module` from line `N` shadowed by loop variable<br/>
> **F404**: Future import(s) `name` after other statements<br/>
> **F406**: `from module import *` only allowed at module level<br/>
> **F407**: An undefined `__future__` feature name was imported
>
> **F501**: Invalid `%` format literal<br/>
> **F502**: `%` format expected mapping but got sequence<br/>
> **F503**: `%` format expected sequence but got mapping<br/>
> **F505**: `%` format missing named arguments<br/>
> **F506**: `%` format mixed positional and named arguments<br/>
> **F507**: `%` format mismatch of placeholder and argument count<br/>
> **F508**: `%` format with `*` specifier requires a sequence<br/>
> **F509**: `%` format with unsupported format character<br/>
> **F521**: `.format(...)` invalid format string<br/>
> **F524**: `.format(...)` missing argument<br/>
> **F525**: `.format(...)` mixing automatic and manual numbering
>
> **F601**: Dictionary key `name` repeated with different values<br/>
> **F602**: Dictionary key variable `name` repeated with different values<br/>
> **F621**: Too many expressions in an assignment with star-unpacking<br/>
> **F622**: Two or more starred expressions in an assignment `(a, *b, *c = d)`<br/>
> **F631**: Assertion test is a tuple, which is always `True`<br/>
> **F632**: Use `==/!=` to compare `str`, `bytes`, and `int` literals<br/>
> **F633**: Use of `>>` is invalid with `print` function<br/>
> **F634**: `if` test is a tuple, which is always `True`
>
> **F701**: A `break` statement outside of a `while` or `for` loop<br/>
> **F702**: A `continue` statement outside of a `while` or `for` loop<br/>
> **F703**: A `continue` statement in a `finally` block in a loop<br/>
> **F704**: A `yield` or `yield from` statement outside of a function<br/>
> **F706**: a `return` statement outside of a function/method<br/>
> **F707**: An `except:` block as not the last exception handler<br/>
> **F721**: Syntax error in doctest<br/>
> **F722**: Syntax error in forward annotation<br/>
> **F723**: Syntax error in type comment
>
> **F821**: Undefined name `name`<br/>
> **F823**: Local variable `name` ... referenced before assignment<br/>
> **F831**: Duplicate argument `name` in function definition
>
> **B002**: Python does not support the unary prefix increment<br/>
> **B003**: Assigning to `os.environ` doesn't clear the environment<br/>
> **B004**: Using `hasattr(x, '__call__')` to test if x is callable is unreliable<br/>
> **B006**: Do not use mutable data structures for argument defaults<br/>
> **B008**: Do not perform function calls in argument defaults<br/>
> **B009**: Do not call `getattr(x, 'attr')`<br/>
> **B010**: Do not call `setattr(x, 'attr', val)`<br/>
> **B011**: Do not call `assert False`<br/>
> **B012**: Use of `break`, `continue` or `return` inside `finally` blocks will silence exceptions or override return values from the `try` or `except` blocks<br/>
> **B016**: Cannot raise a literal
>
> **B301**: Python 3 does not include `.iter*` methods on dictionaries<br/>
> **B302**: Python 3 does not include `.view*` methods on dictionaries<br/>
> **B303**: The `__metaclass__` attribute on a class definition does nothing on Python 3<br/>
> **B304**: `sys.maxint` is not a thing on Python 3<br/>
> **B305**: `.next()` is not a thing on Python 3<br/>
> **B306**: `BaseException.message` has been deprecated as of Python 2.6 and is removed in Python 3
>
> **B902**: Invalid first argument used for method
>
> **I900**: Package is not listed as a requirement
{: .mje-med-font}

Rules that make your code better:

> **E711**: Comparison to none should be `if cond is none:`<br/>
> **E712**: Comparison to true should be `if cond is true:` or `if cond:`<br/>
> **E713**: Test for membership should be `not in`<br/>
> **E714**: Test for object identity should be `is not`<br/>
> **E721**: Do not compare types, use `isinstance()`<br/>
> **E722**: Do not use bare `except`, specify exception instead<br/>
> **E741**: Do not use variables named `I`, `O`, or `l`<br/>
> **E742**: Do not define classes named `I`, `O`, or `l`<br/>
> **E743**: Do not define functions named `I`, `O`, or `l`
>
> **W605**: invalid escape sequence `x`
>
> **F401**: `module` imported but unused
>
> **F504**: `%` format unused named arguments<br/>
> **F522**: `.format(...)` unused named arguments<br/>
> **F523**: `.format(...)` unused positional arguments<br/>
> **F541**: F-string without any placeholders
>
> **F705**: A `return` statement with arguments inside a generator
>
> **F811**: Redefinition of unused `name` from line `N`<br/>
> **F812**: List comprehension redefines `name` from line `N`<br/>
> **F822**: Undefined name `name` in `__all__`<br/>
> **F841**: Local variable `name` is assigned to but never used
>
> **F901**: `raise NotImplemented` should be `raise NotImplementedError`
>
> **B001**: Do not use bare `except:`, it also catches unexpected events like memory errors, interrupts, system exit, and so on<br/>
> **B005**: Using `.strip()` with multi-character strings is misleading the reader<br/>
> **B007**: Loop control variable not used within the loop body<br/>
> **B013**: A length-one tuple literal is redundant in `except` statements<br/>
> **B014**: Redundant exception types in `except (Exception, TypeError):`<br/>
> **B015**: Pointless comparison
>
> **C400-C402**: Unnecessary generator<br/>
> **C403-C404**: Unnecessary list comprehension<br/>
> **C405-C406**: Unnecessary (list/tuple) literal<br/>
> **C407**: Unnecessary (dict/list) comprehension<br/>
> **C409**: Unnecessary (list/tuple) passed to `tuple()`<br/>
> **C410**: Unnecessary (list/tuple) passed to `list()`<br/>
> **C412**: Unnecessary (dict/list/set) comprehension<br/>
> **C413**: Unnecessary list call around `sorted()`<br/>
> **C413**: Unnecessary reversed call around `sorted()`<br/>
> **C415**: Unnecessary subscript reversal of iterable within `reversed/set/sorted()`<br/>
> **C416**: Unnecessary (list/set) comprehension
>
> **D100**: Missing docstring in public module<br/>
> **D101**: Missing docstring in public class<br/>
> **D102**: Missing docstring in public method<br/>
> **D103**: Missing docstring in public function<br/>
> **D104**: Missing docstring in public package<br/>
> **D105**: Missing docstring in magic method<br/>
> **D106**: Missing docstring in public nested class
>
> **I901**: Package is required but not used
>
> **N807**: function name should not start and end with `__`
{: .mje-med-font}

Rules that make your code better but can be a lot of effort to fix on an existing codebase:

> **F403**: `from module import *` used; unable to detect undefined names<br/>
> **F405**: `name` may be undefined, or defined from star imports: `module`
{: .mje-med-font}

The other rules are all for code style; many are important but none affect correctness.
