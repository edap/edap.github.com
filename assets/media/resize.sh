#!/bin/bash
PROJECT=$1

# Usage:
# Example, in assets/media you have a folder called uaua containing two high res images, they have to be .png files. They are called 1.png and 2.png
# Running from assets/media the script `/bin/bash resize.sh uaua` will resize and create the following images in uaua:
# 1.jpg (2600 x)
# 1-large.jpg (1940 x)
# 1-medium.jpg (1280 x)
# 1-small.jpg (640 x)


# via http://www.algissalys.com/how-to/how-to-quickly-rename-modify-and-scale-all-images-in-a-directory-using-linux

echo "preparing resized images for project: $PROJECT"
echo "starting with big images (2600 x)"
mogrify -resize 2600x -format jpg -quality 95 -path $PROJECT $PROJECT/*.png

echo "starting with large images (1940 x)"
convert "$PROJECT/*.png" -resize 1940x -quality 95 -set filename:area "%t-large" $PROJECT/%[filename:area].jpg

echo "starting with medium images (1280 x)"
convert "$PROJECT/*.png" -resize 1280x -quality 95 -set filename:area "%t-medium" $PROJECT/%[filename:area].jpg

echo "starting with small images (640 x)"
convert "$PROJECT/*.png" -resize 640x -quality 95 -set filename:area "%t-small" $PROJECT/%[filename:area].jpg
