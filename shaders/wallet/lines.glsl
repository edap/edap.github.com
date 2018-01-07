// keywords: lines
#define TWO_PI 6.28318530718

float stroke(float x, float pos, float width){
  return step(pos, x+ width*0.5) - step(pos, x- width*0.5);
}

float strokeSmoot(float x, float pos, float width){
  return smoothstep(pos, pos+0.01,x+ width*0.5) -
         smoothstep(pos, pos+0.01,x- width*0.5);

}

float circle(vec2 st, float diameter){
  return length(st - 0.5) * diameter;
}


void main () {
  vec2 st = gl_FragCoord.xy/iResolution.xy;

  // ex 1
  //float sdf = stroke(st.x, 0.5, 0.15);
  //vec3 color = vec3(clamp(sdf,0.,1.));

  // ex 2
  float offset = cos(st.y * TWO_PI/2.) * 0.15;
  float sdf = stroke(st.x, .5+offset, 0.15);
  //vec3 color = vec3(clamp(sdf,0.,1.));
  
  //ex 3
  vec3 color = vec3(stroke(circle(st, 2.), .5, 0.05));

  // ex 4
  //vec3 color = vec3(strokeSmoot(circle(st, 2.), .5, 0.05));



  gl_FragColor = vec4(color, 1.0);
}