//glslViewer col-invert-sqaures.frag  ../textures/pink-necked-green-pigeon-big.jpg

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_tex0;

float rectangle(in vec2 st, in vec2 origin, in vec2 dimensions) {
    vec2 center = step(origin, st);
    float pct = center.x * center.y;
    vec2 full = step(1.0 - origin - dimensions, 1.0 - st);
    pct *= full.x * full.y;
    return pct;
}

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

vec2 vectorField(vec2 uv, float noiseScale, float disFreq, float distAmp){
  vec2 res = uv;
  float n = noise(res*vec2(noiseScale));
  res.y -= u_time*0.05;
  res += sin(res.yx*disFreq) * distAmp;
  res += vec2(n);
  return res;
}

void main(void){
  vec3 lime = vec3(0.733, 1.0, 0.31);
  vec3 red = vec3(1.0, 0.353, 0.208);
  vec3 blu = vec3(0.086, 0.29, 0.8);
  vec3 redHard = vec3(0.698, 0.188, 0.075);
  vec3 blueHard = vec3( 0.098, 0.0, 0.749);

  vec2 st = squareFrame(u_resolution.xy, gl_FragCoord.xy);
  // net coord
  vec2 uv = st;
  vec3 color;

  uv = vectorField(st* 0.5, 0.2, 10.0, 0.005);
  // try several dist fields
  //uv = vectorField(st* 0.5, 4.0, 90.0, 0.01);
  //uv = vectorField(st* 0.8, 2.0, 40.0, 0.01);
  //uv = vectorField(st* 1.5, 2.0, 40.0, 0.01);

  uv *= 2.0;
  uv = fract(uv);

  vec3 tex = texture2D(u_tex0,gl_FragCoord.xy/ u_resolution.xy).xyz;

  // try vec fields
  // st = uv;

  float r1 = rectangle(st, vec2(-1.5), vec2(3.0));
  float r2 = rectangle(st, vec2(-.8), vec2(1.6));
  float r3 = rectangle(st, vec2(-.6), vec2(1.2));
  float r4 = rectangle(st, vec2(-.4), vec2(0.8));

  // texture color swizzle instead of color from palette
  color = r1 * tex.gbr;
  color = mix(color, tex.brg, r2);
  color = mix(color, tex.rgg, r3);
  color = mix(color, tex.grb, r4);

  // color from palette
  // color = r1 * lime * tex.r;
  // color = mix(color, red * tex.b, r2);
  // color = mix(color, blu * tex.r, r3);
  // color = mix(color, redHard * tex.r, r4);


  gl_FragColor = vec4(clamp(color,0.0,1.0) , 1.0);
}