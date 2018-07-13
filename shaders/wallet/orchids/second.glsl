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

float circleDist(vec2 p, float radius){
  return length(p) - radius;
}

float fillSmooth(float sdfVal, float w, float smoothness){
  return smoothstep(sdfVal,sdfVal+smoothness,w);
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

float orcSepals(vec2 toCenter, float resize, float defX, float defY, 
float grow, float nPetals, float smoothness){
    float angle = atan(toCenter.y,toCenter.x) + 0.5;
    float deformOnY = toCenter.y * defY;
    float deformOnX = abs(toCenter.x) * defX;
    float radius = length(toCenter)*resize * (grow+deformOnY+deformOnX);

    float f = cos(angle*nPetals);
    return smoothstep(f, f+smoothness,radius);
}


float lip(vec2 pos, vec2 oval, vec2 ovalSub,float radius, float offset){
  float A = ellipseDist(pos, radius, oval);
  vec2 posB = pos;
  posB.y += offset;
  float B = ellipseDist(posB, radius, ovalSub);
  float p = smoothMerge(B, A, 0.5);
  return p;
}

float orcColumn(vec2 pos, vec2 oval, vec2 ovalSub,float radius, float offset){
  float A = ellipseDist(pos, radius, ovalSub);
  vec2 posB = pos;
  posB.y -= offset;
  float B = ellipseDist(posB, radius, oval);
  float p = substract(B,A);
  posB.y += 0.035;
  float cone = ellipseDist(posB, radius, vec2(0.08, 0.55));
  p = smoothMerge(cone,p, 0.3);
  return p;
  
}

void main(){
  vec2 st =  gl_FragCoord.xy / iResolution.xy;
  st.x *= iResolution.x /iResolution.y;
  // general parameters
  float smoothness = 0.02;
  float addSmoothnessToSetals = 2.9;

  st *= 1.;
  st = fract(st);
  st+=vec2(-0.5, -0.5);
  //column parameters
  float colResize = 0.55;
  vec2 posCol = st;
  posCol.y += 0.07;
  float colYoffset = -0.04;
  float powerCol = 2.;
  vec2 colRatio = vec2(0.4*colResize, 0.4*colResize);
  vec2 colSubRatio = vec2(0.9*colResize, 0.9*colResize);
  float colRadius = 0.52*colResize;
  // sepals parameters
  float deformX = 0.;
  float deformY = 0.;
  float resizePetals = 11.9;
  float powerSepals = 2.0;
  float nPetals = 3.;
  //float growSepals = pow(length(st), 2.0);
  // try out different functions for different shapes
  //float growSepals = exp(length(st)) * 0.15;
  float growSepals = exp2(length(st)) * 0.19;
  //float growSepals = sqrt(length(st)) * 0.35;
  //float growSepals = sin(length(st)) * 0.58;
  // lateral petals parameter
  float nPetalsLat = 2.;
  float deformXLat = 0.0;
  float deformYLat = -0.0;
  float resizePetalsLat = 21.9;
  float powerLat = 2.3;
  vec2 latPos = st*rotate2d(TWO_PI/2.4);
  float growLaterals = pow(length(st), powerLat);
  // lip parameter
  vec2 posLip = st;
  posLip.y += 0.18;
  float lipResize = 0.6;
  float lipYoffset = 0.05;
  vec2 lipRatio = vec2(0.19*lipResize, 0.45*lipResize);
  vec2 smallLipRatio = vec2(0.3*lipResize, 0.15*lipResize);
  float lipRadius = 1.*lipResize;

  float column = orcColumn(posCol*rotate2d(TWO_PI/2.),
                        colRatio,
                        colSubRatio,
                        colRadius, colYoffset);
  float sepals = orcSepals(st,
                        resizePetals,
                        deformX,
                        deformY, growSepals, nPetals,
                        smoothness+addSmoothnessToSetals);
  float latPetals = orcSepals(latPos,
                        resizePetalsLat,
                        deformXLat,
                        deformYLat, growLaterals, nPetalsLat,
                        smoothness+addSmoothnessToSetals);
  float lip = lip(posLip,
                      lipRatio,
                      smallLipRatio,
                      lipRadius, lipYoffset);

  float orchids = merge(latPetals, sepals);

  orchids = merge(orchids, lip);
  orchids = substract(column, orchids);
  // add smoothness
  gl_FragColor = vec4(vec3(fillSmooth(orchids,0.09,smoothness)), 1.);
}