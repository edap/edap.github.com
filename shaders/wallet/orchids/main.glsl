// bool ops
float merge(float d1, float d2){
	return min(d1, d2);
}

float smoothMerge(float d1, float d2, float k){
    float h = clamp(0.5 + 0.5*(d2 - d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0-h);
}

float intersect(float d1, float d2){
	return max(d1, d2);
}

float mergeExclude(float d1, float d2){
	return min(max(-d1, d2), max(-d2, d1));
}

float substract(float d1, float d2){
	return max(-d1, d2);
}

float circleSDF(vec2 st, float diameter){
  return length(st - 0.5) * diameter;
}

float ellipseDist(vec2 p, float radius, vec2 dim){
  vec2 pos = p;
  pos.x = p.x / dim.x;
  pos.y = p.y / dim.y;
  return length(pos) - radius;
}

float vesicaSDF(vec2 st, float w){
  vec2 offset = vec2(w * .5, 0.);
  return max (circleSDF(st-offset, 0.3),
              circleSDF(st+offset, 0.3));
}

float fill(float sdfVal, float w){
  return step(w, sdfVal);
}

float fillMask(float dist){
  return step(0.1, dist);
}

vec2 translate(vec2 p, vec2 t){
	return p - t;
}

float orcSepals(vec2 toCenter, float resize, float smoothness, float def, float power, float nPetals){
    float angle = atan(toCenter.y,toCenter.x) + 0.5;
    float grow = pow(length(toCenter), power);
    float deformOnY = toCenter.y * def;
    float radius = length(toCenter)*resize * (grow-deformOnY);

    float f = cos(angle*nPetals);
    return smoothstep(f,f+smoothness,radius);
}

float halfMoon(vec2 pos, vec2 oval, vec2 ovalSub,float radius, float offset){
  float smoothness = 0.01;

  float A = ellipseDist(pos, radius, oval);
  vec2 posB = pos;
  posB.y += offset;
  float B = ellipseDist(posB, radius, ovalSub);
  float p = substract(B, A);
  return p;
}

float lip(vec2 pos, vec2 oval, vec2 ovalSub,float radius, float offset){
  float smoothness = 0.01;

  float A = ellipseDist(pos, radius, oval);
  vec2 posB = pos;
  posB.y += offset;
  float B = ellipseDist(posB, radius, ovalSub);
  //float B =  orcSepals(posB, 222222.4, 0.04, 0.0, 8.0, 8.);
  float p = smoothMerge(B, A, 0.4);
  //float p = merge(B, A);
  return p;
}

void main(){
  vec2 st = 2.0 * gl_FragCoord.xy / iResolution.xy - 1.0;
  st.x *= iResolution.x /iResolution.y;
  // sepals parameters
  float smoothness = 0.06;
  float deform = 0.5;
  float resizePetals = 2.9;
  float nPetals = 3.;
  // lateral petals parameter
  vec2 posHalfMoon = st;
  posHalfMoon.y -= 0.15;
  float petYoffset = -0.12;
  float power = 2.;
  vec2 hMoonRatio = vec2(0.9, 0.5);
  vec2 hMoonSubRatio = vec2(1.3, 0.5);
  float hMoonRadius = 0.4;
  // lip parameter
  vec2 posLip = st;
  posLip.y += 0.54;
  float lipYoffset = 0.25;
  float lipPower = 9.;
  vec2 lipRatio = vec2(0.55, 0.9);
  vec2 smallLipRatio = vec2(0.4, 0.1);
  float lipRadius = 0.4;

  float sepal = orcSepals(st,
                        resizePetals,
                        smoothness,
                        deform, power, nPetals);
  float latPetals = halfMoon(posHalfMoon,
                        hMoonRatio,
                        hMoonSubRatio,
                        hMoonRadius, petYoffset);
  float lip = lip(posLip,
                      lipRatio,
                      smallLipRatio,
                      lipRadius, lipYoffset);

  float orchids = merge(latPetals, sepal);
  orchids = merge(orchids, lip);
  gl_FragColor = vec4(vec3(fillMask(orchids)), 0.1);
  //gl_FragColor = vec4(vec3(orchids),1.);

  //gl_FragColor = vec4(vec3(intersect(pet,lab)),1.);
}