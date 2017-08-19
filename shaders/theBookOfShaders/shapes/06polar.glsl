#ifdef GL_ES
precision mediump float;
#endif

#define TWO_PI 6.28318530718


vec3 elica(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    // https://thebookofshaders.com/07/
    // Use polar coordinates instead of cartesian
    // This technique is a little restrictive but very simple.
    // It consists of changing the radius of a circle depending 
    // on the angle to achieve different shapes.
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*resize;

    float f = cos(angle*nPale);
    return vec3( 1.-smoothstep(f,f+smoothness,radius) );;
}

vec3 daisy(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*resize;

    float f = abs(cos(angle*nPale));
    return vec3( 1.-smoothstep(f,f+smoothness,radius) );;
}

vec3 fiore(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*resize;

    // il numero di petali visualizzato e' il doppio di nPale
    float f = abs(cos(angle*nPale))*.5+.3;
    // qui disegni la figura intera
    //return vec3( 1.-smoothstep(f,f+smoothness,radius) );
    // qui solo i bordi
    // questa e' la tecnica. Moltiplichi il fiore bianco per il fiore nero, fine
    return vec3( smoothstep(f,f+smoothness,radius) * //bianco
                 1.-smoothstep(f+0.2,f+smoothness+0.3,radius) ); //nero
}

vec3 cog(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*resize;

    float f = smoothstep(-.5,1., cos(angle*nPale))*0.2+0.5;
    return vec3( 1.-smoothstep(f,f+smoothness,radius) );
}

vec3 snowFlake(vec2 st, vec2 orig, float resize, float smoothness,
float nPale, float paleInterr, float centerDim, float paleDim){
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*resize;

    // il numero di petali visualizzato e' il doppio di nPale
    float f = abs(cos(angle*nPale)*sin(angle*paleInterr))*.8+centerDim;
    return vec3( 1.-smoothstep(f,f+smoothness,radius) );;
}



void main(){
    vec2 st = gl_FragCoord.xy/iResolution.xy;
    st.x *= iResolution.x/iResolution.y;
    //vec3 draw = elica(st, vec2(0.5), 9.9, 0.02, 3.);
    //vec3 draw = daisy(st, vec2(0.5), 9.9, 0.02, 3.);
    vec3 draw = fiore(st, vec2(1.0, 0.6), 9.9, 0.02, 3.);
    //vec3 draw = snowFlake(st, vec2(0.5), 9.9, 0.22, 3., 6., 0.1, .8);
    //vec3 draw = cog(st, vec2(0.5), 5.9, 0.02, 12.);
    gl_FragColor = vec4(draw,1.0);
}