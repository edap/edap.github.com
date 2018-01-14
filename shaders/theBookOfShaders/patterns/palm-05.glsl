#define TWO_PI = 6.28318530718

// keywords: flip, palms, pattern

float distortedDaisy(
  vec2 st, vec2 orig, float resize, float smoothness,
  float nPetals, float distorsion, float addendum){
  // Credits to Inigo
  // https://www.youtube.com/watch?v=0ifChJ0nJfM
  
  // to turn the picture upside down, uncomment the following
  // line
  //vec2 toCenter = orig-st;
  vec2 toCenter = st-orig;
  float angle = atan(toCenter.y,toCenter.x);
  float r = resize + addendum*cos(angle * nPetals + distorsion * toCenter.x);
  return smoothstep(r, r+smoothness, length(toCenter));
}

float flip(float v, float pct){
  return mix(v, 1. - v, pct);
}

float strokeSmoot(float x, float pos, float width){
  return smoothstep(pos, pos+0.005,x+ width*0.5) -
         smoothstep(pos, pos+0.005,x- width*0.5);
}

float circleSDF(vec2 pos, float r){
  return length(pos - 0.5) * r;
}

vec2 tileMoveCrossed(vec2 _st, float _zoom, float utime, float speed){
    float time = utime * speed;
    _st *= _zoom;
    // horizontal or vertical?
    float ver = step(.5,fract(time));
    float hor = step(ver, 0.);
    // even rows and columns
    float evenY = step(.5, fract(_st.y * .5));
    float oddY = step(evenY,0.);
    float evenX = step(.5, fract(_st.x * .5));
    float oddX = step(evenX,0.);
    // apply movement
    _st.x += ((fract(time) * 2.0) * evenY) * hor;
    _st.x -= ((fract(time) * 2.0) * oddY) * hor;
    _st.y += ((fract(time) * 2.0) * evenX) * ver;
    _st.y -= ((fract(time) * 2.0) * oddX) * ver;
    return fract(_st);    
}

void main(){
  // COLORS
  vec3 sand = vec3(0.970,0.725,0.359);
  vec3 violet = vec3(0.688,0.287,0.995);
  vec3 green = vec3(0.266,0.810,0.407);

  float palm = 1.0;
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.y *= iResolution.y/iResolution.x;
  st *= 2.0;
  st = fract(st);

  // CANOPY
  float d = 103.0; // distorsion
  float r = 0.23;  // resize
  float a = 0.1;   //addendum
  float p = 30.0;  // number of petals
  float s = 0.03;  // smoothness of the border
  vec2 center = vec2(0.5, 0.7);
  palm *= distortedDaisy(st, center,r,s,p,d,a);
  
  // STEM
  float gamboThickness = 0.01;
  float gamboLenght = 0.14;
  vec2 position = center-st;
  float freq_stem = 40.;
  float amp_stem = 0.03;
  //gamboThickness += cos(position.y * 120.0) * 0.004;
  // changing from + to - change the direction of the curve
  //float curve = abs(position.x  + sin(position.y *freq_stem) * amp_stem);
  float curve = abs(position.x  - (cos(position.y * freq_stem) * amp_stem));
  float gambo = 1.0 - (1.0 - smoothstep(gamboThickness, gamboThickness+0.01, curve)) *
           (1.0 - smoothstep(gamboLenght, 0.01, position.y));
  palm*=gambo;

  // CIRCLES
  st = tileMoveCrossed(st, 2., iGlobalTime, 0.2);
  float circle = circleSDF(st, 0.16);
  circle = strokeSmoot(0.07, circle, .007);
  
  // flip on intersection
  float flipped = flip(palm, circle);
  
  green = mix(green, sand, palm);
  vec3 col = mix(green, violet, flipped);
  gl_FragColor = vec4(col, 1.0);
}