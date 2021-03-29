// Author: Inigo Quiles
// Title: Cubic Pulse

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

//  Function from Iñigo Quiles 
//  www.iquilezles.org/www/articles/functions/functions.htm
float cubicPulse( float c, float w, float x ){
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;

    float y = cubicPulse(mod(u_time,0.99),0.2,st.y);

    vec3 color = vec3(y);
    
    color = color*vec3(0.0,1.0,0.0);

    gl_FragColor = vec4(color,1.0);
}