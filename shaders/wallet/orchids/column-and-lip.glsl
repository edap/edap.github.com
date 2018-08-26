float smoothMerge(float d1, float d2, float k){
    float h = clamp(0.5 + 0.5*(d2 - d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0-h);
}

float substract(float d1, float d2){
	return max(-d1, d2);
}

float intersect(float d1, float d2){
	return max(d1, d2);
}

float mergeExclude(float d1, float d2){
	return min(max(-d1, d2), max(-d2, d1));
}

float ellipseDist(vec2 p, float radius, vec2 dim){
  vec2 pos = p;
  pos.x = p.x / dim.x;
  pos.y = p.y / dim.y;
  return length(pos) - radius;
}

float merge(float d1, float d2){
	return min(d1, d2);
}

//
float column(vec2 pos, float _h, float _hole){
  // nuovi parametri:
  float h = clamp(_h, 0.1, 0.65);
  float hole = clamp(_hole ,0.3, 1.0);
  float r = 0.3;

  // central part
  vec2 punta = vec2(r*0.5,h*0.35);
  vec2 cent = vec2(r*0.14,h*1.2);
  vec2 base = vec2(r*0.35, h*0.22);

  float A = ellipseDist(pos, r, base);
  vec2 posB = pos;
  posB.y -= h*0.48;
  float B = ellipseDist(posB, r, cent);
  float pistillo = merge(B,A);

  vec2 posZ = pos;
  posZ.y -=h*0.7;
  float Z = ellipseDist(posZ, r, punta);
  pistillo = merge(pistillo, Z);

  //baffi
  vec2 baffoUp = vec2(0.9*hole,h*3.);
  vec2 baffoBottom = vec2(r*2.0,h*1.2);

  vec2 posD = posB;
  posD.y += h*0.11;
  vec2 posC = posD;
  posC.y -= h*0.3;

  float C = ellipseDist(posC, r, baffoUp);
  float D = ellipseDist(posD, r, baffoBottom);
  float baffi = substract(C,D);

  return merge(baffi,pistillo);
}

void main(){
  vec2 st = gl_FragCoord.xy/iResolution.xy;
  st*= 1.;
  st = fract(st);
  st.y *= iResolution.y/ iResolution.x;
  st += vec2(-0.5, -0.5);
  
  float theCol = column(st, 0.24, 0.6);
  vec3 finalCol = vec3(smoothstep(theCol, theCol+0.05, 0.1));


  gl_FragColor = vec4(vec3(finalCol), 1.0);
}