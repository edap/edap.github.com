---
layout: post
math: true
title: "drawing a leaf with the parabola equation"
category:
tags: []
---

I was looking for a way to draw a palm's leaf programmatically, and after reading this [video](https://www.youtube.com/watch?v=rUFKgbqjlJY) by Inigo Quilez I've came up with a solution that gives me a reasonable result with high flexibility and a low number of vertices. It uses parabolas to describe the leaf inclination and the borders of the leaf.
You can see a live demo [here](/demo/LeafGeometry)

![palm leaf](/assets/media/posts/parabola-leaf/palm.jpg)


### Parabola

Thinking about the profile of the leaf from the top, in a really schematic way, the border of the leaf can be described by two parabola's curve mirrored, like the first picture on the left

![palm leaf](/assets/media/posts/parabola-leaf/schema.png)

The equation that describes a parabola is \\( y=ax^2 \\) with \\( a \neq 0\\). Try to change the value of \\(a\\) in the slider to see how this affects the curve.

<div id="jxgbox" class="jxgbox" style="width:960px; height:600px;"></div>

Now, assuming that I want to start the border of the leaf a the point (0,0) and end it in the point with coordinates (30,0), the parabola needs to be shifted on the right and the highest point of the parabola is defined 
by the coordinates \\( x_0,  y_0 \\). \\( x_0 \\) will have value 15, because 30/2 = 15, and the value of \\( y_0 \\) that will determinate the width of our leaf, can be selected in the slider on the right.
The formula for a parabola translated horizontally is \\( y=a(x - x_0)^2 + y_0 \\)

<div id="jxgbox-2" class="jxgbox" style="width:960px; height:600px;"></div>

With this formula, it is easy to define the border of our leaf because all we have to do, once we know, \\(x_0\\), \\(x\\), and \\(a\\) is first to calculate \\(y_0\\), with a method like the following one: 


```javascript
_getPointZero(a, x, x_0){
    return a * ((x - x_0)*(x - x_0));
}
```

And once we know \\(y_0\\) we can easily find all the points on the curve with a function that implement the parabola equation:

```javascript
_getVauleOnParabola(a, x, x_0, y_0){
    let y = a * ((x - x_0)*(x - x_0)) + y_0;
    return y;
}
```


### Dividing

Once that we have the border on the top and the border on the bottom defined by the parabola equation, we have to subdivide the area of the leaf vertically. In the drawing below on the left, I've subdivided it in 8 parts and I've drawn just the first seven. In the second drawn on the right I've added a margin between each part, and I've added a stripe that separates the top part of the leaf from the bottom part.

![palm leaf](/assets/media/posts/parabola-leaf/schema2.png)


implementazion vista dall'alto

### A third curve, a third dimension


Aggiungi seconda curva

Aggiungi parametri

Esempio finale


<script type="text/javascript">

JXG.Options.text.useMathJax = true;
var brd, k, brd2, k2, length2, x, x_0;

brd = JXG.JSXGraph.initBoard('jxgbox', {boundingbox:[-5,20,5,-20], axis:true, showNavigation:true, showCopyright:true});
k = brd.create('slider',[[4,15],[4,-15],[-15,1,5]],{name:'a', snapWidth:1});
brd.create('functiongraph', [function(t) {
    return ( JXG.Math.pow(t,2)*k.Value());
}],{strokeColor:'#ff0000'}
);
brd.create('text',[-4,15,
  function() { 
    return '\\[f(x) = ' + k.Value() + 'x^2\\]';
  }], {fontSize:24});

brd2 = JXG.JSXGraph.initBoard('jxgbox-2', {boundingbox:[-1,10,40,-1], axis:true, showNavigation:true, showCopyright:true});
k2 = brd2.create('slider',[[35,9],[35,5],[-1.0,-0.03,-0.01]],{name:'a', snapWidth:0.001});
y0 = brd2.create('slider',[[38,9],[38,5],[3,7.0,8.0]],{name:'y_0', snapWidth:0.01});
x_0 = 15.0;
x = 30.0;
brd2.create('functiongraph', [function(t) {
    return(k2.Value() * JXG.Math.pow((t - x_0),2) + y0.Value());
}],{strokeColor:'#ff0000'}
);

function getPointZero(a, length){
    return a * ((length/2.0)*(length/2.0));
}
  
</script>
