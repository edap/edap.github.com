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
  res.x += iGlobalTime*0.1;
  res += sin(res.yx*40.5) * 0.02;
  res += vec2(n);
  return res;
}

void main(){
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.y *= iResolution.y / iResolution.x;
  st = vectorField(st);

  vec2 modSt = mod(st, vec2(0.1));
  vec2 stepped = step(vec2(0.09), modSt);

  vec3 col = vec3(0.1,0.9,0.9);
  col  *= (1.0-min(stepped.x + stepped.y, 1.0));
  col += vec3(0.9,0.45,0.03) * (stepped.x);
  col += vec3(0.95,0.3,0.) * (stepped.y);
  gl_FragColor = vec4(col,1.0);
}