# Introduction

These tell what you need to get a more-or-less fresh Mac computer working
on this site. Some of these are slightly opinionated (iTerm instead of
Terminal, for instance) and you can fudge quite a bit on these. Some of
these are not optional.

# Basics

These are the basics that you may not use day-to-day yourself, but that
are necessary foundations for everything else.

* [ ] [iTerm2](https://www.iterm2.com/) — This you will use. I find this
  to be a better Terminal replacement.
* [ ] `xcode-select --install` — To install the command-line tools.
* [ ] [rvm](http://rvm.io) — For Ruby.
* [ ] [homebrew](http://brew.sh/) — For everything else.

# Interpreters and Tools

Now that you have homebrew, you can use it to install all the other
things.

* [ ] `brew install macvim` or [atom](https://atom.io/) — For a text
  editor.
* [ ] `brew install git` — To track changes and publish this site once
  you've built it.
* [ ] `brew install nodejs` — For some of the tools that make the site.

# Clone Wars

Follow these to get Git set up and to close the site locally.

* [ ] [Setting your email in Git](https://help.github.com/articles/setting-your-email-in-git/)
* [ ] [Setting your username in Git](https://help.github.com/articles/setting-your-username-in-git/)
* [ ] [Generating an SSH key](https://help.github.com/articles/generating-an-ssh-key/)
* [ ] git clone -b jekyll git@github.com:Purdom/Purdom.github.io.git

# Ruby Stuff

All the shiny ruby stuff.

* [ ] rvm install $(< .ruby-version)
* [ ] rvm use $(< .ruby-version)
* [ ] rvm gemset create $(< .ruby-gemset)
* [ ] rvm use $(< .ruby-version)@$(< .ruby-gemset)
* [ ] gem install bundle
* [ ] bundle

# (Re)building Your Site

This is the only real day-to-day section

* [ ] rvm use $(< .ruby-version)@$(< .ruby-gemset)
* [ ] jekyll clean
* [ ] jekyll build
* [ ] jekyll serve --watch
