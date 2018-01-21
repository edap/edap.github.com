// keywords: utilities for sdf, flip, fill

float flip(float v, float pct){
  return mix(v, 1. - v, pct);
}

float rectSDF(vec2 pos, vec2 dim){
  vec2 _st = pos*2. - 1.;
  return max(abs(_st.x/dim.x),
             abs(_st.y/dim.y));

}

float fill(float sdfVal, float size){
  return step(size, sdfVal);
}

float fillSmooth(float sdfVal, float size, float smoothness){
  return smoothstep(size, size+smoothness,sdfVal);
}

float stroke(float x, float pos, float width){
  return step(pos, x+ width*0.5) - step(pos, x- width*0.5);
}

void main(){
  vec2 st = gl_FragCoord.xy/iResolution.xy;
  float sdf = rectSDF(st, vec2(.5,1.));
  // fill example
  float rect = fill(sdf, 0.6);
  float diag = (st.x+st.y) * 0.5;
  float diagLine = stroke(diag, 0.5, 0.01);

  // flip example

  float col = flip(rect, diagLine);
  gl_FragColor = vec4(vec3(col), 1.0);
}