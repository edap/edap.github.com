---
layout: post
title: "Penner Equations Example"
category:
tags: [openframeworks, animation, 2D]
description: "Penner equations are functions used to describe the movement of an object in a space in a way the more natural as possible. Each function describe a different movement, an object can bounce, starts fast and arrives slow, slow down in the middle"
---

Penner equations are functions used to describe the movement of an object in a space in a way the more natural as possible. Each function describe a different movement, an object can bounce, starts fast and arrives slow, slow down in the middle  etc... You can have an overview of all of them at this [page](http://hosted.zeh.com.br/tweener/docs/en-us/misc/transitions.html). The functions were written the first time by [Robert Penner](http://robertpenner.com/easing/), a flash developer, and were later written in other languages, as c++ and javascript.
Each function takes 4 parameters, the starting point, the ending point, the current iteration and the total number of iterations, and gives back the position of the object at the current iteration. For a deeper explanation on how it works, have a look at these links, [1](http://gilmoreorless.github.io/sydjs-preso-easing/), [2](http://www.kirupa.com/html5/animating_with_easing_functions_in_javascript.htm)  
Here a small app in OpenFrameworks in which you can try out the different functions.
<div class="sixteen-nine">
<iframe src="https://player.vimeo.com/video/125382494" width="700" height="438" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
</div>
The code is available on [Github](https://github.com/edap/pennerEquationsExample)
