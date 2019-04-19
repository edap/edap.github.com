## Per lanciare uno shader passando una texture

glslViewer test.frag textures/2a.jpg

## Per salvare una sequenza di immagini, nella console sotto

sequence,0,10

Salva dal secondo 0 al secondo 10 in immagini



## Per fare un video dello shader che stai usando:
- Fai una cartella in "videos", per esempio "first". Fai cd li dentro. Lancia glslViewer da li. Quindi, per esempio

`glslViewer ../../test.frag ../../textures/cuculus-canorus.jpg ../../textures/cuculus-canorus2.jpg ../../textures/sol.jpg`

Nella console li sotto, prendi i primi 10 secondi con `sequence,0,10`

All'interno della cartella "first"lancia:

`ffmpeg -pattern_type glob -i "*.png" -s 1000x1000 -vcodec libx264 -crf 25  -pix_fmt yuv420p test.mp4`

-s 1000x1000 e' la risoluztione

-vcodec libx264 e' il codec

-crf 25 e' la qualita', For x264, sane values are between 18 and 28. (https://slhck.info/video/2017/02/24/crf-guide.html)

-pix_fmt yuv420p  il pixel format. Apple ha problemi se non usi questo 

test.mp4 il nome del file

## Per ottenere un'immagine dopo un secondo ad high res
glslViewer examples/mandelbrot.frag -w 2048 -h 2048 --headless -s 1 -o mandelbrot.png




