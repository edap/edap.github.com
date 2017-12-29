// Author @patriciogv ( patriciogonzalezvivo.com ) - 2015
// usando la funzione tile, non puoi fare il check delle caselle come facevi prima
// ma puoi usare mod per fare dei patterns

#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323846

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

vec2 tile(vec2 _st, float _zoom){
    _st *= _zoom;
    return fract(_st);
}

vec3 daisy(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*resize;

    float f = abs(cos(angle*nPale));
    return vec3( 1.-smoothstep(f,f+smoothness,radius) );;
}

float box(vec2 _st, vec2 _size, float _smoothEdges){
    _size = vec2(0.5)-_size*0.5;
    vec2 aa = vec2(_smoothEdges*0.5);
    vec2 uv = smoothstep(_size,_size+aa,_st);
    uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
    return uv.x*uv.y;
}

void main(void){
    vec2 st = gl_FragCoord.xy/iResolution.xy;
    vec3 color = vec3(0.0);

    // Divide the space in 4
    st = tile(st,4.);

    // Use a matrix to rotate the space 45 degrees
    //st = rotate2D(st,PI*0.25);
    
    //move!
    st = rotate2D(st,sin(iGlobalTime)*PI/2.0 );

    // Draw a square
    //color = vec3(box(st,vec2(0.7),0.01));
    color = daisy(st, vec2(0.5), abs(sin(iGlobalTime)*PI/2.0)+1.4, 1.9, 6.0);
    // color = vec3(st,0.0);

    gl_FragColor = vec4(color,1.0);
}