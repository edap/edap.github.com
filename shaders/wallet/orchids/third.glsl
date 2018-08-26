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

float column(vec2 pos, float _h, float _hole){
  // nuovi parametri:
  float h = clamp(_h, 0.1, 0.65);
  float hole = clamp(_hole ,0.3, 1.0);
  float r = 0.3;

  // central part
  vec2 punta = vec2(r*0.5,h*0.35);
  vec2 cent = vec2(r*0.23,h*1.8);
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
  vec2 baffoUp = vec2((r*3.)*hole,h*3.);
  vec2 baffoBottom = vec2(r*2.0,h*1.2);

  vec2 posD = posB;
  posD.y += h*0.11;
  vec2 posC = posD;
  posC.y -= h*0.33;

  float C = ellipseDist(posC, r*0.66, baffoUp);
  float D = ellipseDist(posD, r*1.4, baffoBottom);
  float baffi = substract(C,D);
  //return baffi;
  return merge(baffi,pistillo);
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

  vec2 posCol = st;
  posCol.y += 0.1;
  float theCol = column(posCol, 0.24, 0.6);

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
  orchids = substract(theCol, orchids);
  // add smoothness
  gl_FragColor = vec4(vec3(fillSmooth(orchids,0.05,smoothness)), 1.);
}