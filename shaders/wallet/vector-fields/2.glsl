//A vector field is simply a function that takes a pair of coordinates (such as {x=4, y=8})
//and spits out another pair of coordinates (possibly the same, possibly different).

vec2 vectorField(vec2 uv){
  vec2 res = uv;
  res.x += sin(res.y*30.5) * 0.01;
  return res;
}

void main(){
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.y *= iResolution.y / iResolution.x;
  st = vectorField(st);

  float modX = mod(st.x, 0.3);
  vec3 col = vec3(1.0,0.,0.) * step(0.29, modX);
  gl_FragColor = vec4(col,1.0);
}