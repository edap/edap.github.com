# A sample Gemfile
require 'json'
require 'open-uri'
versions = JSON.parse(open('https://pages.github.com/versions.json').read)

source "https://rubygems.org"

# gem "rake"
# gem "jekyll"
# gem "rouge"

gem 'activesupport', '4.2.7'
gem 'github-pages', versions['github-pages']
