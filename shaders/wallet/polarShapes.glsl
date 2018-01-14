// keywords: distance function, flowers, polar coordinates, cog, wheel

// https://www.shadertoy.com/view/4dfXDn
// https://thndl.com/raking-thru-embers.html
// http://iquilezles.org/www/articles/distfunctions/distfunctions.htm

#ifdef GL_ES
precision mediump float;
#endif

#define TWO_PI 6.28318530718

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

float cog(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*resize;

    float f = smoothstep(-.5,1., cos(angle*nPale))*0.2+0.5;
    return 1.-smoothstep(f,f+smoothness,radius);
}

float snowFlake(vec2 st, vec2 orig, float resize, float smoothness,
float nPale, float paleInterr, float centerDim, float paleDim){
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*resize;

    // il numero di petali visualizzato e' il doppio di nPale
    float f = abs(cos(angle*nPale)*sin(angle*paleInterr))*.8+centerDim;
    return 1.-smoothstep(f,f+smoothness,radius);
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


// Example
void main(){
    vec2 st = gl_FragCoord.xy/iResolution.xy;
    st.x *= iResolution.x/iResolution.y;
    float draw = elica(st, vec2(0.5), 9.9, 0.02, 3.);
    //float draw = daisy(st, vec2(0.5), 9.9, 0.02, 3.);
    //float draw = fiore(st, vec2(0.5, 0.5), 9.9, 0.02, 3.);
    //float draw = snowFlake(st, vec2(0.5), 9.9, 0.22, 3., 6., 0.1, .8);
    //float draw = cog(st, vec2(0.5), 5.9, 0.02, 12.);
    gl_FragColor = vec4(vec3(draw),1.0);
}