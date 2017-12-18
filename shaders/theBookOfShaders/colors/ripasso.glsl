#ifdef GL_ES
precision mediump float;
#endif

void main(){
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  vec3 colorA = vec3(1.0, 0.2, 0.3);
  vec3 colorB = vec3(0.6, 0.6,0.0);
  vec3 pct = vec3(st.x);
  vec4 color = vec4(mix(colorA, colorB, pct), 1.0);

  vec4 sky = step(0.2, st.y) * vec4(0.0,0.0,1.0, 1.0);
  gl_FragColor = vec4(color+sky);
}