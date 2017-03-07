# webgl flowers prototyping

Demo of the project davideprati.com/projects/3dprinted-flowers


## Setup

To get an interactive development environment run:

   rlwrap lein do clean, figwheel


and open your browser at [localhost:3449](http://localhost:3449/).

To clean all compiled files:

    lein clean

To create a production build run:

    lein do clean, cljsbuild once min

And open your browser in `resources/public/index.html`. You will not
get live reloading, nor a REPL.

## License

Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/
