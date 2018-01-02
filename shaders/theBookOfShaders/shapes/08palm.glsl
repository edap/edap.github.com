


// http://iquilezles.org/live/

float distortedDaisy(
  vec2 st, vec2 orig, float resize, float smoothness,
  float nPetals, float distorsion, float addendum){
  // Credits to Inigo
  // https://www.youtube.com/watch?v=0ifChJ0nJfM
  
  // to turn the picture upside down, uncomment the following
  // line
  // vec2 toCenter = orig-st;
  vec2 toCenter = st-orig;
  float angle = atan(toCenter.y,toCenter.x);
  float r = resize + addendum*cos(angle * nPetals + distorsion * toCenter.x);
  return smoothstep(r, r+smoothness, length(toCenter));
}

void main(){
  vec3 col = vec3(1.0,0.4,0.1);

  vec2 st = gl_FragCoord.xy / iResolution.xy;
  float d = 50.0; // distorsion
  float r = 0.2;  // resize
  float a = 0.1;  //addendum
  float p = 20.0; // number of petals
  float s = 0.01; // smoothness of the border
  vec2 center = vec2(0.5);
  
  col = col *= distortedDaisy(st, center,r,s,p,d,a);
  gl_FragColor = vec4(col, 1.0);
}