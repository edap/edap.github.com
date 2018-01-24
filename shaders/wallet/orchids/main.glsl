#define TWO_PI 6.28318530718

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

float circleDist(vec2 p, float radius){
  return length(p) - radius;
}

float fill(float sdfVal, float w){
  return step(w, sdfVal);
}

float fillMask(float dist){
  return step(0.1, dist);
}

// matrices transformations
vec2 translate(vec2 p, vec2 t){
	return p - t;
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

float orcSepals(vec2 toCenter, float resize, float defX, float defY, float power, float nPetals){
    float angle = atan(toCenter.y,toCenter.x) + 0.5;
    float grow = pow(length(toCenter), power);
    float deformOnY = toCenter.y * defY;
    float deformOnX = abs(toCenter.x) * defX;
    float radius = length(toCenter)*resize * (grow+deformOnY+deformOnX);

    float f = cos(angle*nPetals);
    return step(f, radius);
}

float halfMoon(vec2 pos, vec2 oval, vec2 ovalSub,float radius, float offset){
  float A = ellipseDist(pos, radius, oval);
  vec2 posB = pos;
  posB.y += offset;
  float B = ellipseDist(posB, radius, ovalSub);
  float p = substract(B, A);
  return p;
}

float lip(vec2 pos, vec2 oval, vec2 ovalSub,float radius, float offset){
  float A = ellipseDist(pos, radius, oval);
  vec2 posB = pos;
  posB.y += offset;
  float B = ellipseDist(posB, radius, ovalSub);
  float p = smoothMerge(B, A, 0.4);
  return p;
}

float orcColumn(vec2 pos, vec2 oval, vec2 ovalSub,float radius, float offset){
  float A = ellipseDist(pos, radius, oval);
  vec2 posB = pos;
  posB.y += offset;
  float B = ellipseDist(posB, radius, ovalSub);
  float p = substract(B, A);
  return p;
}

void main(){
  vec2 st = 2.0 * gl_FragCoord.xy / iResolution.xy - 1.0;
  st.x *= iResolution.x /iResolution.y;
  //column parameters
  vec2 posCol = st;
  posCol.y -= 0.15;
  float colYoffset = 0.09;
  float powerCol = 2.;
  vec2 colRatio = vec2(0.5, 0.5);
  vec2 colSubRatio = vec2(0.5, 0.5);
  float colRadius = 0.4;
  // sepals parameters
  float deformX = 0.0;
  float deformY = -0.5;
  float resizePetals = 2.9;
  float nPetals = 3.;
  // lateral petals parameter
  vec2 posHalfMoon = st;
  posHalfMoon.y -= 0.15;
  float petYoffset = -0.12;
  float power = 2.;
  vec2 hMoonRatio = vec2(0.9, 0.5);
  vec2 hMoonSubRatio = vec2(1.4, 0.5);
  float hMoonRadius = 0.4;
  // lip parameter
  vec2 posLip = st;
  posLip.y += 0.54;
  float lipYoffset = 0.28;
  float lipPower = 9.;
  vec2 lipRatio = vec2(0.55, 0.9);
  vec2 smallLipRatio = vec2(0.45, 0.1);
  float lipRadius = 0.4;

  float column = orcColumn(posCol,
                        colRatio,
                        colSubRatio,
                        colRadius, colYoffset);
  float sepal = orcSepals(st,
                        resizePetals,
                        deformX,
                        deformY, power, nPetals);
  float latPetals = halfMoon(posHalfMoon,
                        hMoonRatio,
                        hMoonSubRatio,
                        hMoonRadius, petYoffset);
  float latPetalsVariant = orcSepals(st*rotate2d(TWO_PI/2.),
                        resizePetals,
                        deformX,
                        deformY, power, nPetals);
  float lip = lip(posLip,
                      lipRatio,
                      smallLipRatio,
                      lipRadius, lipYoffset);

  float orchids = merge(latPetals, sepal);
  //float orchids = merge(latPetalsVariant, sepal);
  orchids = merge(orchids, lip);

  vec2 transA =  translate(st, vec2(-0.1, 0.0));
  float circA = circleDist(transA, 0.2);

  //orchids = substract(circA, orchids);
  orchids = substract(column, orchids);
  gl_FragColor = vec4(vec3(fillMask(orchids)), 0.1);
  //gl_FragColor = vec4(vec3(orchids),1.);

  //gl_FragColor = vec4(vec3(intersect(pet,lab)),1.);
}