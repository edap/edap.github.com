#define TWO_PI 6.28318530718

// bool ops
float merge(float d1, float d2){
	return min(d1, d2);
}

float smoothMerge(float d1, float d2, float k){
    float h = clamp(0.5 + 0.5*(d2 - d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0-h);
}

float substract(float d1, float d2){
	return max(-d1, d2);
}

float ellipseDist(vec2 p, float radius, vec2 dim){
  vec2 pos = p;
  pos.x = p.x / dim.x;
  pos.y = p.y / dim.y;
  return length(pos) - radius;
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

float orcSepals(vec2 toCenter, float resize, float defX, float defY, 
float power, float nPetals, float smoothness){
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
    return smoothstep(f, f+smoothness,radius);
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
  // general parameters
  float smoothness = 0.02;
  float addSmoothnessToSetals = 2.9;

  st *= 2.;
  st = fract(st);
  st+=vec2(-0.5, -0.5);
  //column parameters
  float colResize = 0.5;
  vec2 posCol = st;
  posCol.y += 0.11;
  float colYoffset = 0.033;
  float powerCol = 2.;
  vec2 colRatio = vec2(0.3*colResize, 0.3*colResize);
  vec2 colSubRatio = vec2(0.9*colResize, 0.9*colResize);
  float colRadius = 0.52*colResize;
  // sepals parameters
  float deformX = 0.2;
  float deformY = -0.28;
  float resizePetals = 21.9;
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
  posLip.y += 0.18;
  float lipResize = 0.5;
  float lipYoffset = 0.15;
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
                        deformY, powerSepals, nPetals,
                        smoothness+addSmoothnessToSetals);
  float latPetals = halfMoon(posHalfMoon,
                        hMoonRatio,
                        hMoonSubRatio,
                        hMoonRadius, petYoffset);
  float latPetalsVariant = orcSepals(st*rotate2d(TWO_PI/2.),
                        resizePetals,
                        deformX,
                        deformY, power, nPetals,
                        smoothness+addSmoothnessToSetals);
  float lip = lip(posLip,
                      lipRatio,
                      smallLipRatio,
                      lipRadius, lipYoffset);

  float orchids = merge(latPetals, sepals);
  //float orchids = merge(latPetalsVariant, sepals);
  orchids = merge(orchids, lip);
  orchids = substract(column, orchids);
  // add smoothness
  orchids = smoothstep(orchids,orchids+smoothness,0.09);
  gl_FragColor = vec4(vec3(orchids), 1.);
}