// keywords: distance function, flowers, polar coordinates, cog, wheel

// https://www.shadertoy.com/view/4dfXDn
// https://thndl.com/raking-thru-embers.html
// http://iquilezles.org/www/articles/distfunctions/distfunctions.htm

#ifdef GL_ES
precision mediump float;
#endif

#define TWO_PI 6.28318530718

// Utilities
float stroke(float x, float pos, float width){
  return step(pos, x+ width*0.5) - step(pos, x- width*0.5);
}

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
//

float mergedFlower (vec2 st, float diameter){
  float offset = .25;
  float cross = 2.11;
  float petalsDist = .24;
  float petalsThick = .019;// .5
  
  float center = circle(st, 1.9);

  vec2 petAcen = st-vec2(offset, offset);
  float radiusA = length(petAcen);
  float petA = circle(petAcen,radiusA*cross);

  vec2 petBcen = rotate2d(TWO_PI/4.) * petAcen;
  petBcen -= vec2(0., -.5);
  float radiusB = length(petBcen);
  float petB = circle(petBcen,radiusB*cross);

  float petals = strokeSmoot(petA, petalsDist,petalsThick);
  petals += strokeSmoot(petB, petalsDist,petalsThick);

  float color = flip(petals,
                fill(center, .155));
  return color;
}


float elica(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    // https://thebookofshaders.com/07/
    // Use polar coordinates instead of cartesian
    // This technique is a little restrictive but very simple.
    // It consists of changing the radius of a circle depending 
    // on the angle to achieve different shapes.
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*resize;

    float f = cos(angle*nPale);
    return 1.-smoothstep(f,f+smoothness,radius);
}



float daisy(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*resize;

    float f = abs(cos(angle*nPale));
    return 1.-smoothstep(f,f+smoothness,radius);
}

float fiore(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*resize;

    // il numero di petali visualizzato e' il doppio di nPale
    float f = abs(cos(angle*nPale))*.5+.3;
    // qui disegni la figura intera
    //return vec3( 1.-smoothstep(f,f+smoothness,radius) );
    // qui solo i bordi
    // questa e' la tecnica. Moltiplichi il fiore bianco per il fiore nero, fine
    return smoothstep(f,f+smoothness,radius) * //bianco
                 (1.-smoothstep(f+0.2,f+smoothness+0.3,radius)); //nero
}

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
  float r = resize + addendum * cos(angle * nPetals + distorsion * toCenter.x);
  return smoothstep(r, r+smoothness, length(toCenter));
}

float palmCanopy(
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

float stem(vec2 center, vec2 st){
  float gamboThickness = 0.01;
  float gamboLenght = -0.14;
  vec2 position = center-st;
  float freq_stem = 40.;
  float amp_stem = 0.03;
  //gamboThickness += cos(position.y * 120.0) * 0.004;
  // changing from + to - change the direction of the curve
  //float curve = abs(position.x  + sin(position.y *freq_stem) * amp_stem);
  float curve = abs(position.x  - (cos(position.y * freq_stem) * amp_stem));
  float gambo = 1.0 - (1.0 - smoothstep(gamboThickness, gamboThickness+0.01, curve)) *
           (1.0 - smoothstep(gamboLenght, 0.01, position.y));
  return gambo;
}


// Example
void main(){
    vec2 st = gl_FragCoord.xy/iResolution.xy;
    st.x *= iResolution.x/iResolution.y;

    st *= 4.;
    st = fract(st);

    //float draw = elica(st, vec2(0.5), 9.9, 0.02, 3.);
    //float draw = daisy(st, vec2(0.5), 9.9, 0.02, 3.);
    //float draw = fiore(st, vec2(0.5, 0.5), 9.9, 0.02, 3.);

    //PALM
    float d = 103.0; // distorsion
    float r = 0.23;  // resize
    float a = 0.1;   //addendum
    float p = 30.0;  // number of petals
    float s = 0.03;  // smoothness of the border
    vec2 center = vec2(0.5, 0.5);
    //float draw = palmCanopy(st, center,r,s,p,d,a) * stem(st, center);

    float draw = mergedFlower(st, 0.3);
    
    gl_FragColor = vec4(vec3(draw),1.0);
}