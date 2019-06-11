//glslViewer col-invert-sqaures.frag  ../textures/pink-necked-green-pigeon-big.jpg
#define PI 3.14159265359
#define SPEED 0.2

uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_tex0;

float ndot(vec2 a, vec2 b ) { return a.x*b.x - a.y*b.y; }

float sdRhombus( in vec2 p, in vec2 b ) {
    vec2 q = abs(p);
    float h = clamp((-2.0*ndot(q,b)+ndot(b,b))/dot(b,b),-1.0,1.0);
    float d = length( q - 0.5*b*vec2(1.0-h,1.0+h) );
    float di =  d * sign( q.x*b.y + q.y*b.x - b.x*b.y );
    return smoothstep(0.01,0.03,di);
}

float sdCircle( vec2 p, float r ){
  return length(p) - r;
}

float plot(float val, float c, float t){
  float l = smoothstep(c,c-t,val);
  float r = smoothstep(c,c-t/5.,val);
  return r-l;
}

vec2 rotate2d(float _angle, vec2 _st){
    _st -= 0.5;
    mat2 rot =  mat2(cos(_angle),-sin(_angle),
                     sin(_angle),cos(_angle));
    _st = rot * _st;
    _st += 0.5;
    return _st;
}

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

vec2 vectorField(vec2 uv, float noiseScale, float disFreq, float distAmp, float speed){
  vec2 res = uv;
  float n = noise(res*vec2(noiseScale));
  res.y -= u_time*speed;
  res += sin(res.yx*disFreq) * distAmp;
  res += vec2(n);
  return res;
}

float romboRotate(in vec2 st){
  float rot = 0.;

  if(step(0.0,(st-vec2(0.5)).y) > 0. && step(0.0,(st-vec2(0.5)).x) > 0.){
    rot = PI * 0.25;
  }

  if(step((st-vec2(0.5)).y, 0.0) > 0. && step(0.0,(st-vec2(0.5)).x) > 0.){
    rot = PI * -0.25;
  }

  if(step(0.0,(st-vec2(0.5)).y) > 0. && step((st-vec2(0.5)).x, 0.0) > 0.){
    rot = PI * -0.25;
  }

  if(step((st-vec2(0.5)).y, 0.0) > 0. && step((st-vec2(0.5)).x, 0.0) > 0.){
    rot = PI * 0.25;
  }
   return rot;
}

void main(void){
  vec2 st = (2.0 * gl_FragCoord.xy - u_resolution.xy)/ u_resolution.y;
  st += vec2(0.0, 0.001); // fix a line that appear in the middle

  float time = u_time * SPEED;
  vec2 grid1 = st;
  vec2 grid2 = st;
  vec3 color;

  // colors
  vec3 tex = texture2D(u_tex0,gl_FragCoord.xy/ u_resolution.xy).xyz;
  vec3 lime = vec3(0.733, 1.0, 0.31);
  vec3 red = vec3(1.0, 0.353, 0.208);
  vec3 blu = vec3(0.086, 0.29, 0.8);
  vec3 redHard = vec3(0.698, 0.188, 0.075);
  vec3 blueHard = vec3( 0.098, 0.0, 0.749);
  vec3 bgColor = tex;

  // rombi dimensions
  vec2 d1 = vec2(0.5,0.5);
  vec2 d2 = vec2(0.3,0.3);
  vec2 d3 = vec2(0.1,0.1);
  vec2 d4 = vec2(0.05,0.05);
  float zoom = 1.0; // zoom solo con numeri dispari

  // dots
  vec2 dottedField = vectorField(st, 2.0, 90., 0.01, 0.0)* 20. * zoom;
  dottedField = fract(dottedField)-vec2(0.5);
  float dots = sdCircle(dottedField, 0.1);

  // background Holes
  vec2 holesField = vectorField(st* .5, 2.4, 40., 0.02, 0.03) * 5. * zoom;
  holesField = fract(holesField)-vec2(0.5);
  float holes = sdCircle(holesField, 0.2);

  // GRID 1
  grid1 = vec2(fract(grid1.x * zoom), fract(grid1.y * zoom*2.));

  float r1 = 1.0-sdRhombus(grid1-vec2(0.5), d1);
  float r2 = 1.0-sdRhombus(grid1-vec2(0.5), d2);
  float r3 = 1.0-sdRhombus(grid1-vec2(0.5), d3);
  float r4 = 1.0-sdRhombus(grid1-vec2(0.5), d4);

  color = r1 * blu * tex.b;
  vec3 dottedCol = mix(blu* tex.b, tex, smoothstep(0.01, 0.2, dots));
  color = mix(color, dottedCol, r2);
  color = mix(color, red * tex.r, r3);
  color = mix(color, blueHard * tex.r, r4);

  // GRID 2. With the stripes.
  // grid tiling and rotation
  grid2 += vec2(0.5, 0.25);
  grid2 = vec2(fract(grid2.x * zoom), fract(grid2.y * zoom*2.));
  float rot = romboRotate(grid2);
  vec2 rotatedGrid2 = rotate2d(rot,grid2);

  // rombi
  float r11 = 1.0-sdRhombus(grid2-vec2(0.5), d1);
  float r12 = 1.0-sdRhombus(grid2-vec2(0.5), d2);
  float r13 = 1.0-sdRhombus(grid2-vec2(0.5), d3);
  float r14 = 1.0-sdRhombus(grid2-vec2(0.5), d4);

  // add stripes
  float offset = cos(63.0*rotatedGrid2.y + sign(grid2.y - 0.5)*time*10.);
  vec3 bleredstripes = mix(blu * tex.r, red, offset);

  // colors
  color = mix(color, bleredstripes, r11);
  color = mix(color, red * tex.r, r12);
  color = mix(color, blu * tex.r, r13);
  color = mix(color, lime * tex.r, r14);

  // add colors to the border of the "holes"
  float cell = 1.9;
  vec2 modSt = mod(holesField, vec2(cell));
  float x = plot(modSt.x, cell, 1.2);
  float y = plot(modSt.y, cell, 1.2);
  vec3 bcolor = lime *tex.r * x;
  bcolor     += bleredstripes * y;
  bcolor     += bgColor*vec3(smoothstep(0.9, .01,x+y));

  //final color
  color = mix(bcolor, color, smoothstep(0.01,0.2,holes));

  //debug dots
  //color = mix(red, blu,smoothstep(0.01,0.2,dots));

  //debug holes
  //color = mix(red, blu,smoothstep(0.01,0.3,holes));

  gl_FragColor = vec4(clamp(color*1.4,0.0,1.0) , 1.0);
}
