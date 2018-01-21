// from patricio's card

float circleSDF(vec2 st, float diameter){
  return length(st - 0.5) * diameter;
}

float flip(float v, float pct){
  return mix(v, 1. - v, pct);
}

float fill(float sdfVal, float w){
  return step(w, sdfVal);
}

float vesicaSDF(vec2 st, float w){
  vec2 offset = vec2(w * .5, 0.);
  return max (circleSDF(st-offset, 0.3),
              circleSDF(st+offset, 0.3));
}

void main(){
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.x *= iResolution.x /iResolution.y;
  float sdf = fill(vesicaSDF(st, 0.2), 0.1);

  gl_FragColor = vec4(vec3(sdf),1.);

}