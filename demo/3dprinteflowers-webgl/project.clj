(defproject webgl-test "0.1.0-SNAPSHOT"
  :description "FIXME: write this!"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}

  :min-lein-version "2.5.3"
  
  :dependencies  [[org.clojure/clojure "1.8.0"]
                  [org.clojure/clojurescript "1.7.228"]
                  [org.clojure/core.async "0.2.374"]
                  [thi.ng/geom "0.0.908"]
                  [thi.ng/morphogen "0.2.0-SNAPSHOT"]
                  [thi.ng/fabric "0.0.388"]
                  [thi.ng/validate "0.1.3"]
                  [thi.ng/domus "0.2.0"]
                  [cljsjs/codemirror "5.7.0-3"]
                  [reagent "0.5.1"]
                  [cljs-log "0.2.2"]]
  
  :plugins       [[lein-figwheel "0.5.0-4"]
                  [lein-cljsbuild "1.1.1"]
                  [lein-environ "1.0.0"]]

  :source-paths ["src"]

  :clean-targets ^{:protect false} ["resources/public/js/compiled" "target"]
  
  :profiles      {:dev  {:dependencies [[criterium "0.4.3"]]}
                  :prod {:env {:log-level 4}}}

  :cljsbuild {:builds
              [{:id "dev"
                :source-paths ["src"]

                ;; If no code is to be run, set :figwheel true for continued automagical reloading
                :figwheel {:on-jsload "webgl-test.core/on-js-reload"}

                :compiler {:main webgl-test.core
                           :asset-path "js/compiled/out"
                           :output-to "resources/public/js/compiled/webgl_test.js"
                           :output-dir "resources/public/js/compiled/out"
                           :source-map-timestamp true}}
               ;; This next build is an compressed minified build for
               ;; production. You can build this with:
               ;; lein cljsbuild once min
               {:id "min"
                :source-paths ["src"]
                :compiler {:output-to "resources/public/js/compiled/webgl_test.js"
                           :main webgl-test.core
                           :optimizations :advanced
                           :pretty-print false}}]}

  :figwheel {:http-server-root "public" ;; default and assumes "resources"
             :server-port 3449 ;; default
             :server-ip "127.0.0.1"

             :css-dirs ["resources/public/css"] ;; watch and update CSS

             ;; Start an nREPL server into the running figwheel process
             ;; :nrepl-port 7888

             ;; Server Ring Handler (optional)
             ;; if you want to embed a ring handler into the figwheel http-kit
             ;; server, this is for simple ring servers, if this
             ;; doesn't work for you just run your own server :)
             ;; :ring-handler hello_world.server/handler

             ;; To be able to open files in your editor from the heads up display
             ;; you will need to put a script on your path.
             ;; that script will have to take a file path and a line number
             ;; ie. in  ~/bin/myfile-opener
             ;; #! /bin/sh
             ;; emacsclient -n +$2 $1
             ;;
             ;; :open-file-command "myfile-opener"

             ;; if you want to disable the REPL
             ;; :repl false

             ;; to configure a different figwheel logfile path
             ;; :server-logfile "tmp/logs/figwheel-logfile.log"
             })
