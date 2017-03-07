(ns webgl-test.core
  (:require-macros
   [thi.ng.math.macros :as mm])
  (:require
   [thi.ng.geom.webgl.core :as gl]
   [thi.ng.geom.webgl.animator :as anim]
   [thi.ng.geom.webgl.buffers :as buf]
   [thi.ng.geom.webgl.shaders :as sh]
   [thi.ng.geom.webgl.shaders.lambert :as lambert]
   [thi.ng.geom.webgl.shaders.phong :as phong]
   [thi.ng.geom.core :as g]
   [thi.ng.geom.core.vector :as v :refer [vec2 vec3]]
   [thi.ng.geom.core.matrix :as mat :refer [M44]]
   [thi.ng.morphogen.core :as mg]
   [thi.ng.math.core :as m :refer [PI HALF_PI TWO_PI]]))

(enable-console-print!)

;;FLOWERSHELPERS
(defn punch
  "(punch :w 0.999) non e' altro che
  {:op :sd-inset, :args {:dir :w, :inset 0.999}, :out [{} {} {} {} nil]}"
  [dir w & [out]]
  ;; quando passi a uno degli morphogen operator,tipo mg/skew,
  ;; come argoment out un integer , tipo {4}, questo viene convertito
  ;; in {}{}{}{}.
  (mg/subdiv-inset :dir dir :inset w :out (or out {4 nil})))


(defn petal
  [scale offset punch-y]
  (let [punch-it (mg/skew :e :e :offset offset
                                :out [(punch :y punch-y)])
        tree     (mg/scale-edge :ef :y :scale scale
                                :out[punch-it])]
    tree))
;; FLW
(defn flw
  "it returns a seed and an operation"
  ([](flw 8 8.35 0.405 0.1215 0.2 0.4 0.4))
  ([n_petali](flw n_petali 8.35 0.405 0.1215 0.2 0.4 0.4))
  ([n_petali height-sphere](flw n_petali height-sphere 8.35 0.1215 0.2 0.4 0.4))
  ([n_petali height-sphere height-petals](flw n_petali height-sphere height-petals 0.1215 0.2 0.4 0.4))
  ([n_petali height-sphere height-petals inclinazione](flw n_petali height-sphere height-petals inclinazione 0.2 0.4 0.4))
  ([n_petali height-sphere height-petals inclinazione wall](flw n_petali height-sphere height-petals inclinazione wall 0.4 0.4))
  ([n_petali height-sphere height-petals inclinazione wall outset](flw n_petali height-sphere height-petals inclinazione wall outset 0.4))
  ([n_petali height-sphere height-petals inclinazione wall outset hole]
   (let [
         fifth-ring   (mg/reflect :w :out [(petal height-petals outset hole )])
         slices       (mg/subdiv :rows 13 :out[fifth-ring  nil])
         hex         (mg/apply-recursively (mg/reflect :w :out [slices slices]) (- n_petali 1) [1] 1)
         seed        (mg/sphere-lattice-seg n_petali height-sphere inclinazione wall)
         ]
     [seed hex])))

(defn morphogen-mesh
  [seed tree]
  (-> seed
    (mg/seed-box)
    (mg/generate-mesh tree)
    (g/center)))

(defn ^:export cube-demo
  ([] ((flw) "main"))
  ([figure div]
  (let [gl        (gl/gl-context div)
        view-rect (gl/get-viewport-rect gl)
        model     (->
                      (apply morphogen-mesh figure)
                      (gl/as-webgl-buffer-spec {})
                      (buf/make-attribute-buffers-in-spec gl gl/static-draw)
                      (assoc :shader (sh/make-shader-from-spec gl lambert/shader-spec))
                      (update-in [:uniforms] merge
                                 {:proj          (gl/perspective 45 view-rect 0.1 100.0)
                                  :view          (mat/look-at (vec3 0 0 4) (vec3) (vec3 0 1 0))
                                  :lightCol      (vec3 1 0 0)
                                  :lightDir      (g/normalize (vec3 -1 1 1))
                                  :ambientCol    0x000066
                                  :diffuseCol    0xffffff
                                  }))]
    (anim/animate
     (fn [[t frame]]
       (let [tx (-> M44  ;; deg * PI / 180 -> rad * 180 / PI
                    (g/rotate-x (* t 0.4995))
                    ;;(g/rotate-y (* t 0.225))
                    )]
         (gl/set-viewport gl view-rect)
         (gl/clear-color-buffer gl 1 0.7 0.0 0.9)
         (gl/clear-depth-buffer gl 1)
         (gl/enable gl gl/depth-test)
         (lambert/draw gl (assoc-in model [:uniforms :model] tx)))
       true))
    )))


(defn on-js-reload []
  ;; optionally touch your app-state to force rerendering depending on
  ;; your application
  ;; (swap! app-state update-in [:__figwheel_counter] inc)
)

(defn main
  []
  (cube-demo (flw 15 0.15 12 0.12 0.7 0.4 0.33) "main")
  (cube-demo (flw 4 0.45 6 0.13 1.8 0.4 0.2) "second")
  (cube-demo (flw 8 0.30 10.0 0.14 0.6 0.8) "third")
  (cube-demo (flw 13 0.20 22.0 0.11 0.2 0.9 0.12) "fourth")
  )

(main)
