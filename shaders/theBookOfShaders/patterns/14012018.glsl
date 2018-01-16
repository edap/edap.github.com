#ifdef GL_ES
precision mediump float;
#endif

#define TWO_PI 6.28318530718

// Utilities
float strokeSmoot(float x, float pos, float width){
  return smoothstep(pos, pos+0.01,x+ width*0.5) -
         smoothstep(pos, pos+0.01,x- width*0.5);
}

float circle(vec2 st, float diameter){
  return length(st - 0.5) * diameter;
}

float flip(float v, float pct){
  return mix(v, 1. - v, pct);
}

float fill(float sdfVal, float size){
  return smoothstep(size, size+0.02,sdfVal);
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

float quadrifoglio (vec2 st, float diameter, float utime, float speed, float tickness){
  float time = utime * speed;
  float offset = .25;
  float cross = 2.1;
  float petalsDist = .24;
  float petalsThickA = -.019 + abs(cos(time * 9.) * tickness);// .5
  float petalsThickB = -.019 + abs(sin(time * 4.5) * tickness);// .5
  
  float center = circle(st, diameter);

  vec2 petAcen = st-vec2(offset, offset);
  float radiusA = length(petAcen);
  float petA = circle(petAcen,radiusA*cross);

  vec2 petBcen = rotate2d(TWO_PI/4.) * petAcen;
  petBcen -= vec2(0., -.5);
  float radiusB = length(petBcen);
  float petB = circle(petBcen,radiusB*cross);

  float petals = strokeSmoot(petA, petalsDist,petalsThickA);
  petals += strokeSmoot(petB, petalsDist,petalsThickB);

  float color = flip(petals,
                fill(center, .155));
  return color;
}


// Example
void main(){
    vec3 bgCol = vec3(0.049,0.398,0.905);
    vec3 fCol = vec3(0.905,0.283,0.046);
    float timeFreq = 0.7;
    float timeAmp = 1.2;
    float zoom = 4.;
    float thick = 0.1;
    vec2 st = gl_FragCoord.xy/iResolution.xy;
    // tiling
    st.x *= iResolution.x/iResolution.y;
    st *=zoom;
    // offset
    st.x += step(1.0, mod(st.y,2.0)) * 0.5;
    st = fract(st);
    
    // Movement
    float mov = sin(mod(st.x, 2.7));
    float ampMov = 4.;

    float draw = quadrifoglio(
      st, 1.9,
      sin(iGlobalTime*timeFreq)*timeAmp,
      (mov*ampMov),
      thick);
    vec3 col = mix(fCol, bgCol, draw);
    gl_FragColor = vec4(col,1.0);
}