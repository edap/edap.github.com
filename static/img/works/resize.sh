#!/bin/bash
# Usage:
# Example, in assets/media you have a folder called uaua containing two high res images, they have to be .png/.jpg/.jpeg files. In this example, they are called 1.png and 2.png
# Running from assets/media the script `/bin/bash resize.sh uaua` will resize and create the following images in uaua:

# 1-large.jpg (1940 x)
# 1-medium.jpg (1280 x)
# 1-small.jpg (640 x)

# 2-large.jpg (1940 x)
# 2-medium.jpg (1280 x)
# 2-small.jpg (640 x)


# via http://www.algissalys.com/how-to/how-to-quickly-rename-modify-and-scale-all-images-in-a-directory-using-linux
# https://stackoverflow.com/questions/59111396/loop-through-the-directories-to-get-the-image-files




#!/usr/bin/env bash
find "$1" \( -iname \*.jpg -o -iname \*.jpeg -o -iname \*.png \) -print0 | while read -r -d $'\0' file; do
  # base="${file##*/}" $base is the file name with all the directory stuff stripped off
  # dir="${file%/*}    $dir is the directory with the file name stripped off

  echo "starting with large images (1940 x)"
  convert "$file" -resize 1940x -quality 95 -set filename:area "%t-large" $1/%[filename:area].jpg

  echo "starting with medium images (1280 x)"
  convert "$file" -resize 1280x -quality 95 -set filename:area "%t-medium" $1/%[filename:area].jpg

  echo "starting with small images (640 x)"
  convert "$file" -resize 500x -quality 95 -set filename:area "%t-small" $1/%[filename:area].jpg
done

