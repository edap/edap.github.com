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
  res.y -= iGlobalTime*0.1;
  res += sin(res.yx*40.5) * 0.02;
  res += vec2(n);
  return res;
}

float plot(float val, float c, float t){
  float l = smoothstep(c,c-t,val);
  float r = smoothstep(c,c-t/5.,val);
  return r-l;
}

void main(){
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.y *= iResolution.y / iResolution.x;
  st = vectorField(st);

  float cell = 0.2;
  vec2 modSt = mod(st, vec2(cell));

  float x = plot(modSt.x, cell, 0.1);
  float y = plot(modSt.y, cell, 0.1);

  vec3 col = vec3(0.9,0.5,0.03) * x;
  col += vec3(0.95,0.3,0.) * y;
  vec3 bgCol = vec3(0.1,0.9,0.9);
  col+= bgCol*vec3(smoothstep(1.7, .01,x+y));

  gl_FragColor = vec4(col,1.0);
}