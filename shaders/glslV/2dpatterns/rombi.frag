//glslViewer col-invert-sqaures.frag  ../textures/pink-necked-green-pigeon-big.jpg
#define PI 3.14159265359


uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_tex0;

float ndot(vec2 a, vec2 b ) { return a.x*b.x - a.y*b.y; }

float sdRhombus( in vec2 p, in vec2 b ) 
{
    vec2 q = abs(p);
    float h = clamp((-2.0*ndot(q,b)+ndot(b,b))/dot(b,b),-1.0,1.0);
    float d = length( q - 0.5*b*vec2(1.0-h,1.0+h) );
    float di =  d * sign( q.x*b.y + q.y*b.x - b.x*b.y );
    return smoothstep(0.01,0.03,di);
}

vec2 rotate2d(float _angle, vec2 _st){
    //muovi
    _st -= 0.5;
    // applica la rotazione nel centro del coordinate system
    mat2 rot =  mat2(cos(_angle),-sin(_angle),
                      sin(_angle),cos(_angle));
    _st = rot * _st;
    // rimuovi nella posizione originale, prima della rotazione
    _st += 0.5;
    return _st;
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


float romboRotate(in vec2 st){
  float rot = (PI/4. * sign( (st-vec2(0.5)).x)) * step(0.0,(st-vec2(0.5)).y);
  rot += (-PI/4. * sign( (st-vec2(0.5)).x)) * step((st-vec2(0.5)).y, 0.0);
  return rot;
}

void main(void){
  vec3 lime = vec3(0.733, 1.0, 0.31);
  vec3 red = vec3(1.0, 0.353, 0.208);
  vec3 blu = vec3(0.086, 0.29, 0.8);
  vec3 redHard = vec3(0.698, 0.188, 0.075);
  vec3 blueHard = vec3( 0.098, 0.0, 0.749);

  vec2 st = squareFrame(u_resolution.xy, gl_FragCoord.xy);


  //st = vectorField(st* 0.5, 0.2, 10.0, 0.005);
  // try several dist fields
  //st = vectorField(st* 0.5, 4.0, 90.0, 0.01);
  //st = vectorField(st* 0.8, 2.0, 40.0, 0.01);
  vec2 noisedF = vectorField(st* 1.0, 0.8, 1.0, 0.1);

  // net coord
  vec2 grid1 = st;
  vec2 grid2 = st;
  vec3 color;

  float zoom = 1.0; // zoom solo con numeri dispari
  grid1 = vec2(fract(grid1.x * zoom), fract(grid1.y * zoom*2.));
  //uv += 0.5;

  vec3 tex = texture2D(u_tex0,gl_FragCoord.xy/ u_resolution.xy).xyz;

  vec2 d1 =  vec2(0.5,0.5);
  vec2 d2 = vec2(0.3,0.3);
  vec2 d3 = vec2(0.1,0.1);
  vec2 d4 = vec2(0.05,0.05);

  float r1 = 1.0-sdRhombus(grid1-vec2(0.5), d1);
  float r2 = 1.0-sdRhombus(grid1-vec2(0.5), d2);
  float r3 = 1.0-sdRhombus(grid1-vec2(0.5), d3);
  float r4 = 1.0-sdRhombus(grid1-vec2(0.5), d4);

  color = lime * tex.b;
  // texture color swizzle instead of color from palette
  color = r1 * blu * tex.b;
  color = mix(color, lime * tex.b, r2);
  color = mix(color, red * tex.r, r3);
  color = mix(color, blueHard * tex.r, r4);

  grid2 += vec2(0.5, 0.25);
  grid2 = vec2(fract(grid2.x * zoom), fract(grid2.y * zoom*2.));
  
  float r11 = 1.0-sdRhombus(grid2-vec2(0.5), d1);
  float r12 = 1.0-sdRhombus(grid2-vec2(0.5), d2);
  float r13 = 1.0-sdRhombus(grid2-vec2(0.5), d3);
  float r14 = 1.0-sdRhombus(grid2-vec2(0.5), d4);

  //float dots = circle();
  //vec3 dotted = mix(red * tex.b, lime * tex.r, dots);

  float rot = romboRotate(grid2);
  vec2 rotatedGrid2 = rotate2d(rot,grid2);

  //lime = mix(lime, red, fract(rotatedGrid2.y*22.));
  vec3 bleredstripes = mix(blu * tex.r, red, 0.2 + 0.9*cos(150.0*rotatedGrid2.y));
  // /lime*= 0.8 + 0.8*cos(150.0*rotatedGrid2.x);

  //lime = lime * sign( (grid2-vec2(0.5)).x);
  //color from palette
  color = mix(color, bleredstripes, r11);
  color = mix(color, red * tex.b, r12);
  color = mix(color, blu * tex.r, r13);
  color = mix(color, lime * tex.r, r14);

  gl_FragColor = vec4(clamp(color,0.0,1.0) , 1.0);
}