//A vector field is simply a function that takes a pair of coordinates (such as {x=4, y=8})
//and spits out another pair of coordinates (possibly the same, possibly different).

vec2 vectorField(vec2 uv){
  vec2 res = uv;
  res.x -= iGlobalTime*0.1;
  res.x += sin(res.y*40.5) * 0.01;
  res.y += sin(res.x*40.5) * 0.01;
  return res;
}

void main(){
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.y *= iResolution.y / iResolution.x;
  st = vectorField(st);

  vec2 modSt = mod(st, vec2(0.1));
  float stepX = step(0.09, modSt.x);
  float stepY = step(0.09, modSt.y);
  
  vec3 col = vec3(1.0,0.,0.) * (stepX + stepY);
  gl_FragColor = vec4(col,1.0);
}