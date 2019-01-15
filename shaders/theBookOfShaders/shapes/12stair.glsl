
float stroke(float x, float pos, float width){
  return step(pos, x+ width*0.5) - step(pos, x- width*0.5);
}

float scala(vec2 st){
  float spessore = 0.05;
  float distanzaGambe = 0.2;
  float spessorePioli = 0.27;

  float sdfsx = stroke(st.y, 0.4-distanzaGambe/2., spessore);
  float gambasx = clamp(sdfsx,0.,1.);

  float sdfdx = stroke(st.y, 0.5+distanzaGambe/2., spessore);
  float gambadx = clamp(sdfdx,0.,1.);

  float pioli = step(fract(st.x*5.), spessorePioli) * step(0.06, fract(st.x*5.));
  pioli *= step(0.5-distanzaGambe, st.y);
  pioli *= step(st.y,0.4+distanzaGambe);

  return gambadx + gambasx + pioli;
}

void main () {
  vec2 st = gl_FragCoord.xy/iResolution.xy;
  //st.y *= gl_FragCoord.y/iResolution.x;

  //st.x -= step(st.x, 0.5) * (st.y *0.05);
  // st.x += step(0.5,st.x) * (st.y *0.05);

  float scala = scala(st);
  vec3 color = vec3(scala);
  // float distanzaGambe = 0.2;
  // float line = stroke(st.y,0.5-distanzaGambe, 0.05);
  // float line2 = stroke(st.y,0.5+distanzaGambe, 0.05);
  //vec3 color = vec3(line+line2);
  gl_FragColor = vec4(color, 1.0);
}