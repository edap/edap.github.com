#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359
#define TWO_PI 6.28318530718


vec3 polygon(vec2 st, vec2 orig, int nSize, float resize, float smoothness){
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x)+PI;
    float radius = TWO_PI/float(nSize);
    float d = cos(floor(.5+angle/radius)*radius-angle)*length(toCenter * resize);
    float startSmooth = .4;
    vec3 color = vec3(1.0-smoothstep(startSmooth, startSmooth+smoothness,d));
    return color;
}


void main(){
    vec2 st = gl_FragCoord.xy/iResolution.xy;
    st.x *= iResolution.x/iResolution.y;
    vec3 draw = polygon(st, vec2(0.4), 4, 3.9, 0.01);
    gl_FragColor = vec4(draw,1.0);
}