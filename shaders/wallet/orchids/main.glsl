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

float fillSmooth(float sdfVal, float w, float smoothness){
  //return step(w, sdfVal);
  return smoothstep(w, w+smoothness,sdfVal);
  //return smoothstep(sdfVal, sdfVal+smoothness,w);
}

float fillMask(float dist){
  return step(0.1, dist);
}

float stroke(float x, float pos, float width){
  return step(pos, x+ width*0.5) - step(pos, x- width*0.5);
}

float strokeSmoot(float x, float pos, float width){
  return smoothstep(pos, pos+0.01,x+ width*0.5) -
         smoothstep(pos, pos+0.01,x- width*0.5);

}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

float orcSepals(vec2 toCenter, float resize, float defX, float defY, float power, float nPetals){
    float angle = atan(toCenter.y,toCenter.x) + 0.5;
    // try out different functions for different shapes
    //float grow = pow(length(toCenter), power);
    //float grow = exp(length(toCenter)) * 0.15;
    //float grow = exp2(length(toCenter)) * 0.19;
    //float grow = sqrt(length(toCenter)) * 0.35;
    float grow = sin(length(toCenter)) * 0.58;

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
  float p = substract(B,A);
  return p;
}

float lip(vec2 pos, vec2 oval, vec2 ovalSub,float radius, float offset){
  float A = ellipseDist(pos, radius, oval);
  vec2 posB = pos;
  posB.y += offset;
  float B = ellipseDist(posB, radius, ovalSub);
  float p = smoothMerge(B, A, 0.1);
  return p;
}

float orcColumn(vec2 pos, vec2 oval, vec2 ovalSub,float radius, float offset){
  float A = ellipseDist(pos, radius, ovalSub);
  vec2 posB = pos;
  posB.y -= offset;
  float B = ellipseDist(posB, radius, oval);
  float p = substract(B,A);
  posB.y += 0.035;
  float cone = ellipseDist(posB, radius, vec2(0.08, 0.15));
  p = smoothMerge(cone,p, 0.1);
  return p;
}

void main(){
  vec2 st =  gl_FragCoord.xy / iResolution.xy;
  st.x *= iResolution.x /iResolution.y;

  st *= 1.;
  st = fract(st);
  st+=vec2(-0.5, -0.5);
  //column parameters
  float colResize = 0.5;
  vec2 posCol = st;
  posCol.y += 0.07;
  float colYoffset = 0.017;
  float powerCol = 2.;
  vec2 colRatio = vec2(0.3*colResize, 0.3*colResize);
  vec2 colSubRatio = vec2(0.9*colResize, 0.9*colResize);
  float colRadius = 0.52*colResize;
  // sepals parameters
  float deformX = 0.2;
  float deformY = -0.28;
  float resizePetals = 18.9;
  float powerSepals = 2.0;
  float nPetals = 3.;
  // lateral petals parameter
  float lateralPetResize = 1.0;
  vec2 posHalfMoon = st;
  posHalfMoon.y += -0.09;
  float moonResize = 0.41;
  float petYoffset = -0.12 * moonResize;
  float power = 2.;
  vec2 hMoonRatio = vec2(0.7*moonResize, 0.5*moonResize);
  vec2 hMoonSubRatio = vec2(0.98*moonResize, 0.7*moonResize);
  float hMoonRadius = 1.*moonResize;
  // lip parameter
  vec2 posLip = st;
  posLip.y += 0.19;
  float lipResize = 0.5;
  float lipYoffset = 0.18;
  vec2 lipRatio = vec2(0.35*lipResize, 0.6*lipResize);
  vec2 smallLipRatio = vec2(0.15*lipResize, 0.2*lipResize);
  float lipRadius = 1.*lipResize;

  float column = orcColumn(posCol*rotate2d(TWO_PI/2.),
                        colRatio,
                        colSubRatio,
                        colRadius, colYoffset);
  float sepals = orcSepals(st,
                        resizePetals,
                        deformX,
                        deformY, powerSepals, nPetals);
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

  //latPetals = smoothstep(0.6, 0.5,latPetals);
  float orchids = merge(latPetals, sepals);
  //float orchids = merge(latPetalsVariant, sepal);
  // fillMask is important when applying subtraction
  // later!
  orchids = fillSmooth(merge(orchids, lip), 0.1, 0.1);
  // add smoothness

  orchids = substract(column, orchids);
  gl_FragColor = vec4(vec3(fillSmooth(orchids, 0.1, 0.0)), 1.);
}