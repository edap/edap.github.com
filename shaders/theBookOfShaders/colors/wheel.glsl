#define TWO_PI 6.28318530718
// HSB to RGB
// Function from Iñigo Quiles
// https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                        0.0,
                        1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

float circle(in vec2 st, in vec2 end) {
    float pct = 0.0;
    //pct = step(0.2, distance(st, end));
    pct = step(distance(st, end), 0.2 );
    return pct;
}


//example
void main(){
    vec2 st = gl_FragCoord.xy / iResolution.xy;
    vec3 color = vec3(0.0);

    vec2 toCenter = vec2(0.5)-st;
    float angle = atan(toCenter.y,toCenter.x);
    angle += fract(iGlobalTime)*TWO_PI;
    float radius = length(toCenter)*2.0;
    float circle = circle(st, vec2(0.5));
    
    color = hsb2rgb(vec3((angle/TWO_PI)+0.5,radius,1.0));
    // We map x (0.0 - 1.0) to the hue (0.0 - 1.0) // And the y (0.0 - 1.0) to the brightness
    gl_FragColor = vec4(color*circle,1.0);
}