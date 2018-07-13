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
float column(vec2 pos){
  // nuovi parametri:
  vec2 punta = vec2(0.2,0.1);
  vec2 oval = vec2(0.06,0.36);
  vec2 ovalBase = vec2(0.15, 0.08);
  float r = 0.3;

  float A = ellipseDist(pos, r, ovalBase);
  vec2 posB = pos;
  posB.y -= 0.19; //da 0.1 a 0.33
  float B = ellipseDist(posB, r, oval);
  float pistillo = smoothMerge(B,A, 0.8);

  vec2 posZ = pos;
  posZ.y -=0.25;
  float Z = ellipseDist(posZ, r, punta);
  pistillo = smoothMerge(pistillo, Z, 0.55);

  //petali sotto
  vec2 posC = posB;
  vec2 posD = posC;
  posC.y += 0.05;
  posD.y += 0.085;
  vec2 baffoUp = vec2(0.8,0.77);
  // baffoBottom should be an heart upside down
  vec2 baffoBottom = vec2(0.6,0.45);

  float C = ellipseDist(posC, r, baffoUp);
  float D = ellipseDist(posD, r, baffoBottom);
  float petals = substract(C,D);


  float pa = merge(petals,pistillo);

  return pa;
}

void main(){
  vec2 st = gl_FragCoord.xy/iResolution.xy;
  st*= 1.;
  st = fract(st);
  st.y *= iResolution.y/ iResolution.x;
  st += vec2(-0.5, -0.5);
  


  
  float theCol = column(st);
  vec3 finalCol = vec3(smoothstep(theCol, theCol+0.05, 0.1));


  gl_FragColor = vec4(vec3(finalCol), 1.0);
}