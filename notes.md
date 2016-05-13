
https://jekyllrb.com/docs/configuration/
https://jekyllrb.com/docs/collections/


Dependencies:
Jquery, Masonry, Picturefill for picture polyfill, imagesLoaded

Images:
4 Dimensions: small 640, medium 12800, large 1800, big 2600.
Every time you insert an image you have to provide all this 4 dimension, define
the dimension of the grid and the sizes. Regarding the sizes
`sizes="(max-width: 600px) 96vw, 66.333vw">` means when the screen is small
than 600, the image use the 96% of the viewport, otherwise the 66.333vw.

Grids:
3 dimension: 
`grid` => width 32.666%
`grid l2` => 66.333%
`grid l3` => width 100%

if you put an image in the `grid l2` the sizes attr ot the image has to be `sizes="(max-width: 600px) 96vw, 66.333vw">`
