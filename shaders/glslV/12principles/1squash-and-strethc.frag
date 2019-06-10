uniform float u_time;
uniform vec2 u_resolution;

// https://www.iquilezles.org/www/articles/functions/functions.htm
float parabola( float x, float k ){
    return pow( 4.0*x*(1.0-x), k );
}

float sdBox( in vec2 p, in vec2 b ){
    vec2 d = abs(p)-b;
    return length(max(d,vec2(0))) + min(max(d.x,d.y),0.0);
}

void main(void){
  vec3 red = vec3(1.0, 0.353, 0.208);
  vec3 blu = vec3(0.086, 0.29, 0.8);

  vec2 st = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;
  float pulse = parabola(fract(u_time*0.5), 0.9);
  vec2 pos = st - vec2(0., -0.5 + pulse );

  float box = sdBox(pos, vec2(0.3-pulse*0.1 , 0.2+pulse*0.08));
  vec3 color = mix(blu,red,smoothstep(0.01,0.03,box));
  gl_FragColor = vec4(color , 1.0);
}