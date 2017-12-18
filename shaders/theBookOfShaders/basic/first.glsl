#ifdef GL_ES
precision mediump float;
#endif

void main() {
  gl_FragColor = vec4(abs(atan(iGlobalTime)),0.0,0.0,1.0);
}