---
layout: post
redirect_from: "/2014/05/10/yotube-api-v3-and-rails-using-the-yourub-gem.html"
title: "Youtube API v3 and rails using the yourub gem"
category: 
tags: [youtube API v3, rails, ruby, gem, yourub]
---
  

In this post we use the [yourub](https://github.com/edap/yourub) gem to implement a youtube search page in our rails application.

### Installation
A youtube developer key is needed, grab one as explained [here](http://www.youtube.com/watch?v=Im69kzhpR3I). After that, add `gem 'yourub', '~> 1.0.5'` to the Gemfile and run bundle install. Create an app/config/yourub.yml file, and change the developer_key value with yours.
{% highlight ruby %}
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
{% endhighlight ruby %}

### Controller & Route
Add this lines to your route.rb file, in order to route the two actions that we are going to create
{% highlight ruby %}
  get 'videos/index'
  post 'videos/index'
  get 'videos/:id' => 'videos#details', as: :details
{% endhighlight ruby %}

Now create the controller `app/controllers/videos` and add the following code:

{% highlight ruby %}
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
{% endhighlight ruby %}

###View
We are going to add two views, one containing the form to add the search criteria and the other the details of a single video. In the search page, we use only the `query` options, but there are others available, have a look at the [readme]((https://github.com/edap/yourub)).
Now add these lines to the file `app/views/index.html.haml`

{% highlight ruby %}
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
{% endhighlight ruby %}

In the file `app/views/details.html.haml` we print only the variable `@video`
to show which information you could obtain adding the option `client.extended_info = true` in the controller.
As you can see, there are statistitics, thumbs, ecc..

{% highlight ruby %}
=@video
{% endhighlight ruby %}


