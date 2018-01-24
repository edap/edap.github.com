float ellipseDist(vec2 p, float radius, vec2 dim){
  p.x = p.x / dim.x;
  p.y = p.y / dim.y;
  return length(p) - radius;
}

void main(){
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.x *= iResolution.x/iResolution.y;

  vec2 pos = st - vec2(0.5, 0.5);

  float col = ellipseDist(pos, 0.3,vec2(0.5, 0.3));
  col = step(0.2, col);
  gl_FragColor = vec4(vec3(col),1.);
}