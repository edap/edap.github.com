---
layout: post
title: "Yotube API v3 and rails using the yourub gem"
category: 
tags: [youtube API v3, rails, ruby, gem, yourub]
---
{% include JB/setup %}

In this post we will use the [yourub](https://github.com/edap/yourub) gem to implement a youtube search page in our rails application.

### Installation
A youtube developer key is needed, grab one as explained [here](http://www.youtube.com/watch?v=Im69kzhpR3I). After that, add `gem 'yourub', '~> 1.0.5'` to the Gemfile and run bundle install. Create an app/config/yourub.yml file, and change the developer key value with yours.
```ruby
yourub_defaults: &yourub_defaults
  developer_key: 'YoUrDevEl0PerKey'
  youtube_api_service_name: 'youtube'
  youtube_api_version: 'v3'
  application_name: "yourub"
  application_version: "0.1"
  log_level: WARN

development:
  <<: *yourub_defaults

production:
  <<: *yourub_defaults

test:
  <<: *yourub_defaults
```

### Controller & Route
Add this lines to your route.rb file, in order to route the 2 action that we are gonna to create
```ruby
  get 'videos/index'
  post 'videos/index'
  get 'videos/:id' => 'videos#details', as: :details
```

Now create a the controller `app/controllers/videos` and add the following code:

```ruby
class VideosController < ApplicationController

  def client
    @client ||= Yourub::Client.new
  end

  def index
    @countries = client.countries
    if request.post?
      client.search(params)
      @videos = client.videos
    end
  end

  def details
    client.extended_info = true
    @video = client.search(id: params[:id])
  end
end
```

###View
We are gonna to add 2 views, one containing the form to add the search criteria and one containing the details of a single video. In the search page, we will use only the `query` options, but there are others available, have a look at the [readme]((https://github.com/edap/yourub)).
Now add these to files `app/views/index.html.haml`

```ruby
= form_tag videos_index_path, :method => :post do
  %div
    = label_tag "search for:"
    = text_field_tag "query"
  %div
    = label_tag "order by date"
    = radio_button_tag 'order', 'date'
    = label_tag "order by rating"
    = radio_button_tag 'order', 'rating'
    = label_tag "order by relevance"
    = radio_button_tag 'order', 'relevance'
    = label_tag "order by title"
    = radio_button_tag 'order', 'title'
    = label_tag "order by videocount"
    = radio_button_tag 'order', 'videocount'
    = label_tag "order by viewcount"
    = radio_button_tag 'order', 'viewcount'

  %div
    = submit_tag "Submit"

- if @videos
  %h2 Founded results:
  -@videos.each do |v|
    %div
      %div= link_to v["title"], details_path(:id =>v["id"])
      %iframe{:allowscriptaccess => "always", :allowFullScreen => "true", |
      :frameborder => "0", :height => "430", :src => "//www.youtube.com/embed/#{v["id"]}", |
      :title => "YouTube video player", :width => "640"}
```

and `app/views/details.html.haml`, only to show whic information you could have adding the options `client.extended_info = true`

```ruby
=@video
```



