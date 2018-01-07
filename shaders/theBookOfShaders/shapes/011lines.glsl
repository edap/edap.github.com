
float stroke(float x, float pos, float width){
  return step(pos, x+ width*0.5) - step(pos, x- width*0.5);
}

void main () {
  vec2 st = gl_FragCoord.xy/iResolution.xy;
  float sdf = stroke(st.x, 0.5, 0.15);
  float line = clamp(sdf,0.,1.);
  vec3 color = vec3(line);
  gl_FragColor = vec4(color, 1.0);
}