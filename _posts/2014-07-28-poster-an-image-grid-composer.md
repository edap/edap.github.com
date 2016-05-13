---
layout: post
title: "Poster, an image composer"
category:
tags: [golang, package, poster, image]
description: "<a href='https://github.com/edap/poster'>Poster</a> Is a command line tool that creates a grid of images"
---

[Poster](https://github.com/edap/poster) is a command line tool written in Go that, given a folder containing images, combines them in a grid and it creates a new image that contains a thumb of each of them. Here an image that i've obtained running `poster` in an a folder with 14 images.
![go poster example](/assets/media/go_poster_example.jpg)


###Default options and example
Running `poster -h` you have a list of the default options
{% highlight go %}
Usage of poster:
  -dest_dir=".": the destination directory that will contain the grid
  -log_file="stdout": specify a log file, as default it will print on stdout
  -source_dir=".": the origin directory that contains the images to compose the grid
  -thumb_height=90: the height of a single thumb
  -thumb_width=120: the width of a single thumb
{% endhighlight go %}

To customize them, do as follow, overriding the default options with yours
`poster -dest_dir=/home/username/dest -source_dir=/home/username/source -log_file=/home/username/my.log`

###How does it works, packages involved
- The program reads list the images located in the folder and creates a map of them.
- Having the total number of the images and the desired dimension of the thumb, it calculates the dimension of the destination grid, see this [file](https://github.com/edap/poster/blob/master/composer.go) for the details about this part.
- Each file can now be assigned to a position in the grid, it iterates through the images, it scales them to the given dimension if necessary(i've used [this package](https://github.com/nfnt/resize) for the resize, check it out, it provides a lot of functionalities to work with images), and put each file in the destination image.
