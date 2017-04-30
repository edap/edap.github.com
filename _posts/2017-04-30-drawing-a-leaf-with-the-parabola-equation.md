---
layout: post
math: true
title: "drawing a leaf with the parabola equation"
category:
tags: []
---

### Inspiration

![palm leaf](/assets/media/posts/parabola-leaf/palm.jpg)

I was looking for a way to draw a palm's leaf programmatically, and after reading this [video](https://www.youtube.com/watch?v=rUFKgbqjlJY) by Inigo Quilez I've came up with a solution that gives me a reasonable result with high flexibility and a low number of vertices. It uses parabolas to describe the leaf inclination and the borders of the leaf.
You can see a live demo [here](/demo/LeafGeometry)


### Parabola

Thinking about the profile of the leaf from the top, in a really schematic way, the border of the leaf can be described by two parabola's curve mirrored, like the first picture on the left

![palm leaf](/assets/media/posts/parabola-leaf/schema.png)

The equation that describes a parabola is \\( y=ax^2 \\) with \\( a \neq 0\\)

<div id="jxgbox" class="jxgbox" style="width:960px; height:600px;"></div>

![palm leaf](/assets/media/posts/parabola-leaf/parabeln.svg){:height="24px" width="48px"}

Disegno a matita

implementazion vista dall'alto

Aggiungi seconda curva

Aggiungi parametri

Esempio finale


<script type="text/javascript">
var brd, k;
JXG.Options.text.useMathJax = true;
brd = JXG.JSXGraph.initBoard('jxgbox', {boundingbox:[-5,20,5,-20], axis:true, showNavigation:true, showCopyright:true});
k = brd.create('slider',[[4,15],[4,-15],[-15,1,5]],{name:'a', snapWidth:1});
brd.create('functiongraph', [function(t) {
    return ( JXG.Math.pow(t,2)*k.Value());
}],{strokeColor:'#ff0000'}
);
brd.create('text',[-4,15,
  function() { 
    return '\\[f(x) = ' + k.Value() + 'x^2\\]';
  }]);</script>
