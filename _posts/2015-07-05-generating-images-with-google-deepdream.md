---
layout: post
title: "Generating images with google inception deepdream"
category: 
tags: [deepdream, neural networks, generative design, computer vision]
---

Some days ago google published a [post](http://googleresearch.blogspot.ch/2015/06/inceptionism-going-deeper-into-neural.html) about using Artificial Neural Network to generate images, and shortly after they open sourced the [code](http://googleresearch.blogspot.de/2015/07/deepdream-code-example-for-visualizing.html). In non-technical words, the software tries to reproduce what your brain does when it receive images, it tries to recognize forms for which it has been trained during its experience of the word, it tries to put them together and make a sense out of these forms. Inadvertently, your brain does that all the time, and it demands your attention when there are some clouds in the sky that looks like a human face. The code released by google goes a step further, not only it recognizes knowed forms, but it draws on them what it thinks it has seen.

An Artificial Neural Neural network can be thought as a simplification of our brain, it consists of layers of neurons and connections between them, low-level layers recognize low level information as edges, surfacese, orientation, etc.. and send them up to the high-level layers. High-level layers recognize high level feature, as a human body, or an incredible amount of eyes and dogs, depending on what was fed into the brain. This is a big simplification, I suggest you these 3 links to have a deeper understanding on how is this working.

- [Memo Atken's summary](https://vimeo.com/132462576), (click on 'More') 
- [LSD Neural Net](https://317070.github.io/LSD/) (also have a look a this [twich expmeriment](http://www.twitch.tv/317070) )
- [Sensual Machine, by Samin](https://medium.com/@samim/sensual-machines-82858b32a4e5)


### Install Docker on MacOS

To install all the software can be a tedious task, fortunately [Matt Jibson](http://mattjibson.com/) puts together a [docker image](https://registry.hub.docker.com/u/mjibson/deepdream/) with everything  installed. In this tutorial we will use my [forked version]("https://github.com/edap/ddd"), that contains a couple of parameters more than the original one.
We use boot2docker, if you are on linux you can install docker in the normal
way.
{% highlight bash%}
brew update
brew install docker
brew install boot2docker
{% endhighlight bash%}

After that, we init it.

{% highlight bash%}
boot2docker init
boot2docker up
{% endhighlight bash%}
It will tell you to setup the environment variables, do it in the console, or
put them in your .profile file.
{% highlight bash%}
export DOCKER_HOST=tcp://192.168.59.103:2376
export DOCKER_CERT_PATH=/Users/da1/.boot2docker/certs/boot2docker-vm
export DOCKER_TLS_VERIFY=1
{% endhighlight bash%}
After that you can start boot2docker

{% highlight bash%}
boot2docker start
{% endhighlight bash%}

Now you can type in the console `docker run hello-world`, to verify that everything works fine. You should see something like:
{% highlight bash%}
Unable to find image 'hello-world:latest' locally
latest: Pulling from hello-world
a8219747be10: Pull complete
91c95931e552: Already exists
hello-world:latest: The image you are pulling has been verified. Important: image verification is a tech preview feature and should not be relied on to provide security.
Digest: sha256:aa03e5d0d5553b4c3473e89c8619cf79df368babd18681cf5daeb82aab55838d
Status: Downloaded newer image for hello-world:latest
Hello from Docker.
This message shows that your installation appears to be working correctly.
{% endhighlight bash%}
If the output was different, scroll down to the troubleshooting section.

###Build the docker image
The dockerfile contains the software that we need and the python script token
from the [ipython
notebook](https://github.com/google/deepdream/blob/master/dream.ipynb) released by google.
Pull the repository and build the image:
{% highlight bash%}
git clone git@github.com:edap/ddd.git
cd ddd
docker build -t edap/ddd .
{% endhighlight bash%}
Create a folder in your home directory where you can save your output images, for
example my is `Users/da1/Pictures/movie`

### Generate the images
Running:
{% highlight bash%}
docker run --rm -v /Users/da1/Pictures/movie:/images edap/ddd 'http://fightinginthewarroom.com/wp-content/uploads/2015/04/ex-machina-feat.jpg' 'inception_4b/5x5_reduce' 19 4
{% endhighlight bash%}
You will obtain this image:
![ex-machina-4b](/assets/media/ex-machina/inception_4b-5x5_reduce-2-18.png)
Let's have a look at the parameters:

- `'http://fightinginthewarroom.com/wp-content/uploads/2015/04/ex-machina-feat.jpg'` Mandatory, an Url that points to a jpg
- `'inception_4b/5x5_reduce'` Optional, default is `inception_4c/output`
- `19` Optional, number of iteration, default is `10`
- `4` Optional, number of octave, default is `4`

{% highlight bash%}
docker run --rm -v /Users/da1/Pictures/movie:/images edap/ddd 'http://fightinginthewarroom.com/wp-content/uploads/2015/04/ex-machina-feat.jpg' 'inception_5a/5x5_reduce' 19 4
{% endhighlight bash%}
![ex-machina-4b](/assets/media/ex-machina/inception_5a-5x5_reduce-1-18.png)
As reported in the google's ipython notebook:
<blockquote>
The complexity of the details generated depends on which layer's activations we try to maximize. Higher layers produce complex features, while lower ones
enhance edges and textures.
</blockquote>
Let's put the layer a bit up, from `inception_5a` to `inception_5b` 
{% highlight bash%}
docker run --rm -v /Users/da1/Pictures/movie:/images edap/ddd 'http://fightinginthewarroom.com/wp-content/uploads/2015/04/ex-machina-feat.jpg' 'inception_5b/5x5_reduce' 19 4
{% endhighlight bash%}
![ex-machina-4b](/assets/media/ex-machina/inception_5b-5x5_reduce-5-19.png)
The following image shows what happens if we take the same parameters used to generate the first image and we change the number of octave, from `4` to `10`. As far as I've understand, this parameter controls how far you can zoom in.
{% highlight bash%}
docker run --rm -v /Users/da1/Pictures/movie:/images edap/ddd 'http://fightinginthewarroom.com/wp-content/uploads/2015/04/ex-machina-feat.jpg' 'inception_4b/5x5_reduce' 19 10
{% endhighlight bash%}
![ex-machina-4b](/assets/media/ex-machina/inception_4b-5x5_reduce-8-18.png)

### Boot2docker troubleshooting

##### boot2docker does not start
If after running `boot2docker start` you receive this message:
{% highlight bash %}
Post http:///var/run/docker.sock/v1.19/containers/create: dial unix /var/run/docker.sock: no such file or directory. Are you trying to connect to a TLS-enabled daemon without TLS?
{% endhighlight bash %}
probably your env variable are not set up correctly. Just run:
{% highlight bash %}
$(boot2docker shellinit)
{% endhighlight bash %}
this populate and export the environment variables

##### missing pem certificates 
if you have the error where docker is looking for the certificate associated with the wrong ip address:

{% highlight bash %}
An error occurred trying to connect: Post https://192.168.59.103:2376/v1.19/containers/create ecc...
{% endhighlight bash %}
You have to create an `/var/lib/boot2docker/profile`. Log in into the virtual
box and open the file
{% highlight bash %}
boot2docker ssh
sudo su
cd /var/lib/boot2docker/
vi profile
{% endhighlight bash %}
Add this content:
{% highlight bash %}
wait4eth1() {
  CNT=0
  until ip a show eth1 | grep -q UP
  do
    [ $((CNT++)) -gt 60 ] && break || sleep 1
  done
  sleep 1
}
wait4eth1
{% endhighlight bash %}

save and close the file, exit the vm and go back to your console. Restart boot2docker

{% highlight bash %}
boot2docker stop && boot2docker start && docker images
{% endhighlight bash %}
