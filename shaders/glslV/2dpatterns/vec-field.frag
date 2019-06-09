#define PI 3.14159265359

uniform float u_time;
uniform vec2 u_resolution;

vec2 squareFrame(vec2 res, vec2 coord){
    vec2 uv = 2.0 * coord.xy / res.xy - 1.0;
    uv.x *= res.x / res.y;
    return uv;
}


// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation
    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

vec2 vectorField(vec2 uv){
  vec2 res = uv;
  float n = noise(res*vec2(3.0));
  res.y -= u_time*0.05;
  res += sin(res.yx*40.) * 0.02;
  res += vec2(n);
  return res;
}

float plot(float val, float c, float t){
  float l = smoothstep(c,c-t,val);
  float r = smoothstep(c,c-t/5.,val);
  return r-l;
}


void main(void){
  vec3 lime = vec3(0.733, 1.0, 0.31);
  vec3 red = vec3(1.0, 0.353, 0.208);
  vec3 blu = vec3(0.086, 0.29, 0.8);
  vec3 redHard = vec3(0.698, 0.188, 0.075);
  vec3 blueHard = vec3( 0.098, 0.0, 0.749);
  float t = 0.2;

  vec2 st = squareFrame(u_resolution.xy, gl_FragCoord.xy);

  vec2 uv = vectorField(st* 3.0);

  float cell = 0.4;
  vec2 modSt = mod(uv, vec2(cell));

  float x = plot(modSt.x, cell, t);
  float y = plot(modSt.y, cell, t);

  vec3 color = blu * x;
  color     += red * y;
  color     += lime*vec3(smoothstep(1.2, .01,x+y));


  gl_FragColor = vec4(clamp(color,0.0,1.0) , 1.0);
}