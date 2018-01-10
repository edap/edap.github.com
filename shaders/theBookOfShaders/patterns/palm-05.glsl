#define TWO_PI = 6.28318530718

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

float wavefyCos(float _val, float freq, float amp){
  return cos(_val * freq) * amp;
}

float wavefySin(float _val, float freq, float amp){
  return sin(_val * freq) * amp;
}

float flip(float v, float pct){
  return mix(v, 1. - v, pct);
}

float strokeSmoot(float x, float pos, float width){
  return smoothstep(pos, pos+0.01,x+ width*0.5) -
         smoothstep(pos, pos+0.01,x- width*0.5);

}

void main(){
  float col = 1.0;
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st *= 8.0;
  st = fract(st);

  // CANOPY
  float d = 110.0; // distorsion
  float r = 0.2;  // resize
  float a = 0.1;  //addendum
  float p = 30.0; // number of petals
  float s = 0.03; // smoothness of the border
  vec2 center = vec2(0.5);
  col *= distortedDaisy(st, center,r,s,p,d,a);
  
  // STEM
  float gamboThickness = 0.01;
  float gamboLenght = 0.14;
  vec2 position = center-st;
  float freq_stem = 40.;
  float amp_stem = 0.03;
  //gamboThickness += wavefyCos(position.y, 120.0, 0.004);
  // changing from + to - change the direction of the curve
  //float curve = abs(position.x  + wavefySin(position.y, freq_stem, amp_stem));
  float curve = abs(position.x  - wavefySin(position.y, freq_stem, amp_stem));

  float gambo = 1.0 - (1.0 - smoothstep(gamboThickness, gamboThickness+0.01, curve)) *
           (1.0 - smoothstep(gamboLenght, 0.01, position.y));
  col*=gambo;

  float line = (st.x+st.y) * 0.5;
  float diagLine = strokeSmoot(line, 0.5, 0.2);
  float flippedCol = flip(col, diagLine);

  gl_FragColor = vec4(vec3(flippedCol), 1.0);
}