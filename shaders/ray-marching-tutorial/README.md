## Intro

The files from 00.glsl to 08.glsl are just the transcript of this [live conding session](https://www.youtube.com/watch?v=s6t0mJsgUKw) by Rémi Papillié.
The other files use the previous one as basis and add some other things, like ambient occlusion, shadow, etc...
At the end the Mercury Library is introduced.

These are the references that I've checked while working at it:

[Íñigo Quílez website](http://iquilezles.org/www/articles/distfunctions/distfunctions.htm)

[live conding by Rémi Papillié](https://www.youtube.com/watch?v=s6t0mJsgUKw)

[9bitscience](http://9bitscience.blogspot.de/2013/07/raymarching-distance-fields_14.html)

[jamie-wong](http://jamie-wong.com/2016/07/15/ray-marching-signed-distance-functions/)

Other resources:

[short video intro](https://www.youtube.com/watch?v=Cp5WWtMoeKg)

[Ray Marching workshop](https://github.com/ajweeks/RaymarchingWorkshop)


You can run each file in Visual Studio Code + [Shader Toy extension](https://marketplace.visualstudio.com/items?itemName=stevensona.shader-toy). After the extension is installed, go to View -> Command Palette -> shoew glsl preview

## Files

**00.glsl**

![example](img/00.png)

Use the intersection function to draw a plane. Set the coordinate system to the center of the screen

***

**01.glsl**

![example](img/01.png)

use `fract` to draw the quare on the plane and give the sense of depth. Do not draw the squares if the distance is less than 0, and therefore there was no intersection

***

**02.glsl**

![example](img/02.png)

Enter Ray Marching. Initially the color is black. In the loop, if there is a collision (meaning, if the SDF of the scene is less than EPSILON), calculate the color and break. Otherwise, advance one step forward.

***

**03.glsl**

![example](img/03.png)

Add a sphere. Introduce the `sphere` function, use `min` to merge two object together, in this case the sphere and the plane.

***

**04.glsl**

![example](img/04.png)

Move the camera around, using `sin(iGlobalTime)` and make the box rounded.

***

**05.glsl**

![example](img/05.png)

use the modulo function to multiplicate the boxes. This is called "domain repetition". See `mod(pos + offset/2., offset) - offset/2.`

***

**06.glsl**

![example](img/06.png)

Introduce the `rotate` function and rotate the boxes. Try out different types of rotation. See how `pos.x = abs(pos.x)` deforms the box.

***

**07.glsl**

![example](img/07.png)

Have a look at the `albedo` function, see how it is used to add white stripes on the plane and on the cubes. Try out different values for `pos *= 0.5`, like `pos *= 10.0`

***

**08.glsl**

![example](img/08.png)

This file is about light. A light position and direction is defined in `lightDistance` and `lightDirection`. Then there is a method to calculate the normal called `calculateNormal`, a method to calculate the `diffuse` light, one to calculate the `specular` light and one for the `fresnel`. At the end a `fogFactor` is added.

***


**09.glsl**

in this file the raymarching algorithm is extracted in a separate function that returns just the distance from the eye to the collision with the scene. This distance is used later to calculate the collision and the color.

***

**10.glsl**

In this file, a camera is positioned and moved around the scene. Code from [inigo shadertoy](https://www.shadertoy.com/view/Xds3zN)

***

**11.glsl**

Soft shadows, via [Inigo blog](http://www.iquilezles.org/www/articles/rmshadows/rmshadows.htm)
and ambient occlusion

***

**12.glsl**

Removing artifacts scaling the distance, tuning epsilon and using Inigo's smin function

***

**13.glsl**
Use Phong shading, via [Jamie Wong tutorial](http://jamie-wong.com/2016/07/15/ray-marching-signed-distance-functions/)

*** 

**14.glsl**
Domain repetition and boolean operations

*** 

**15.glsl**
Add textures

*** 

**16.glsl**
Change movement a bit

*** 

**17.glsl**
Rings and sphere

*** 

**18.glsl**
Bend and animate.

*** 

**19.glsl**
Scale the texture

*** 

**20.glsl**
Debug for OF

***

**29.glsl**
Depth of field example

*** 



