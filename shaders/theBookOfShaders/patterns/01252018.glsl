#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323846
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

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}


vec2 rotate2D (vec2 _st, float _angle) {
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

float when_eq(float x, float y) {
  return 1.0 - abs(sign(x - y));
}

vec2 tile (vec2 _st, float _zoom) {
    _st *= _zoom;
    return fract(_st);
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
  //return 1.-smoothstep(p, p+0.001,radius);
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

vec2 rotateTilePattern(vec2 _st){
    _st *= 2.0;
    float index = 0.0;
    index += step(1., mod(_st.x,2.0));
    index += step(1., mod(_st.y,2.0))*2.0;
    _st = fract(_st);
    //  Rotate cell 1 by 90 degrees
    float rad = PI*0.5 * when_eq(index, 1.);
    _st = rotate2D(_st,rad);
    //  Rotate cell 2 by -90 degrees
    rad = PI*-0.5 * when_eq(index, 2.);
    _st = rotate2D(_st,rad);
    //  Rotate cell 3 by 180 degrees
    rad = PI * when_eq(index, 3.);
    _st = rotate2D(_st,rad);
    return _st;
}

float flip(float v, float pct){
  return mix(v, 1. - v, pct);
}

float rectSDF(vec2 pos, vec2 dim){
  vec2 _st = pos*2. - 1.;
  return max(abs(_st.x/dim.x),
             abs(_st.y/dim.y));

}

float fillSmooth(float sdfVal, float size, float smoothness){
  return smoothstep(size, size+smoothness,sdfVal);
}

float strokeSmoot(float x, float pos, float width, float smtness){
  return smoothstep(pos, pos+smtness,x+ width*0.5) -
         smoothstep(pos, pos+smtness,x- width*0.5);

}

void main (void) {
  // General parameters
  float smoothness = 0.03;
  vec3 blue = vec3(0.098, 0, 0.749);
  vec3 green = vec3(0, 0.498, 0.352);
  vec3 rose = vec3(1, 0.592, 0.705);
  vec3 orange = vec3(0.901, 0.494, 0.062);
  vec3 lilla = vec3(0.898, 0.341, 0.878);

  // Tiling
  vec2 st = gl_FragCoord.xy/iResolution.xy;
  vec2 stBg = tile(st,3.0);
  stBg = rotateTilePattern(stBg);
  vec2 orcSt = tile(st,4.0);

  // Make more interesting combinations
  //st = tile(st,2.0);
  stBg = rotate2D(stBg,-PI*iGlobalTime*0.15);
  //st = rotate2D(st,PI*iGlobalTime*0.25);

  // Background
  float sdf = rectSDF(stBg, vec2(.3,1.));
  // fill example
  float rect = fillSmooth(sdf, 0.7, smoothness);
  float diag = (stBg.x+stBg.y) * 0.5;
  float diagLine = strokeSmoot(diag, 0.5, 0.02,smoothness);

  //float col = flip(rect, diagLine);
  float rectAndLine = flip(rect, diagLine);
  vec3 bgCol = mix(green, blue, rectAndLine);

  // Orchid
  float addSmoothnessToSetals = 2.9;
  orcSt+=vec2(-0.5, -0.5);
  //column parameters
  float colResize = 0.55;
  vec2 posCol = orcSt;
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
  float growSepals = exp2(length(orcSt)) * 0.19;
  //float growSepals = sqrt(length(st)) * 0.35;
  //float growSepals = sin(length(st)) * 0.58;
  // lateral petals parameter
  float nPetalsLat = 2.;
  float deformXLat = 0.0;
  float deformYLat = -0.0;
  float resizePetalsLat = 21.9;
  float powerLat = 2.3;
  vec2 latPos = orcSt*rotate2d(TWO_PI/2.4);
  float growLaterals = pow(length(orcSt), powerLat);
  // lip parameter
  vec2 posLip = orcSt;
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
  float sepals = orcSepals(orcSt,
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
  orchids = fillSmooth(orchids,0.09,smoothness+0.01);

  vec3 black = vec3(0.,0.,0.);


  sepals = fillSmooth(sepals,0.09,smoothness+0.005);
  vec3 orcColor = mix(lilla, bgCol, sepals);



  latPetals = fillSmooth(latPetals,0.09,smoothness+0.005);
  orcColor = mix(orange,orcColor,latPetals);

  lip = fillSmooth(lip,0.09,smoothness+0.005);
  orcColor = mix(rose, orcColor,lip);

  // column = fillSmooth(column,0.09,smoothness+0.005);
  // orcColor = mix(orange,orcColor,column);

  vec3 finalColor = mix(orcColor, bgCol, orchids);
  gl_FragColor = vec4(vec3(orcColor),1.0);
}
