#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform sampler2D u_tex1;
uniform float u_time;

const float SPEED = 1.4;
const float OFFSET = 0.9;
const float ROTATION = 0.0;
const vec2 SCALING = vec2(1.);
const float PATTERN_DIM = 342.0;
const int PALETTE = 6;

float randomMg (in vec2 st) {
  return fract(sin(dot(st.xy,
                        vec2(12.9898,78.233)))
                * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noiseMg (in vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  // Four corners in 2D of a tile
  float a = randomMg(i);
  float b = randomMg(i + vec2(1.0, 0.0));
  float c = randomMg(i + vec2(0.0, 1.0));
  float d = randomMg(i + vec2(1.0, 1.0));

  // Smooth Interpolation
  // Cubic Hermine Curve.  Same as SmoothStep()
  vec2 u = f*f*(3.0-2.0*f);
  // u = smoothstep(0.,1.,f);

  // Mix 4 coorners percentages
  return mix(a, b, u.x) +
          (c - a)* u.y * (1.0 - u.x) +
          (d - b) * u.x * u.y;
}

vec2 vectorFieldMg(vec2 uv, float noiseScale, float disFreq, float distAmp, float speed, float time){
  vec2 res = uv;
  float n = noiseMg(res*vec2(noiseScale));
  res.y -= time*speed;
  res += sin(res.yx*disFreq) * distAmp;
  res += vec2(n);
  return res;
}

vec2 pmm(float xt, float yt,float patternDim, float offset) {
    float heightDim = patternDim - 2. * offset;
    float from = offset / patternDim;
    float to = 1. - offset / patternDim;
    if (mod(xt / patternDim, 2.0) < 1.0) {
        xt = mod(xt, patternDim) / patternDim;
    }
    else {
        xt = 1. - mod(xt, patternDim) / patternDim;
    }
    if (mod(yt / heightDim, 2.0) < 1.0) {
        yt = mod(yt, heightDim) / heightDim * (to - from) + from;
    }
    else {
        yt = (1. - mod(yt, heightDim) / heightDim) * (to - from) + from;
    }
    return vec2(xt, yt);
}

float sdCircle( vec2 p, float r ){
    return 1.- smoothstep(0.01, 0.03,length(p) - r);
}

float plot(float val, float c, float t){
  float l = smoothstep(c,c-t,val);
  float r = smoothstep(c,c-t/5.,val);
  return r-l;
}

void main(void) {
  vec3 coloreUno, coloreDue, coloreTre, coloreQuattro, coloreCinque;
  vec4 background, red, blu, colTex, color;
  float xt, yt, gridZoom, holesZoom;
  vec2 mouse = (2.0 * u_mouse.xy - u_resolution.xy)/ u_resolution.y;
  //vec2 mouse = vec2(0.);
  float rad = 1.0;
  //vec2 mouse = vec2(cos(u_time * SPEED) * rad, sin(u_time * SPEED) * rad);
  vec2 origSt = (2.0 * gl_FragCoord.xy - u_resolution.xy)/ u_resolution.y;
  vec2 pos = gl_FragCoord.xy;

  xt = pos.x * cos(ROTATION) * SCALING.x + pos.y * sin(ROTATION) * SCALING.y;
  yt = -pos.x * sin(ROTATION) * SCALING.x + pos.y * cos(ROTATION) * SCALING.y;
  xt -= u_resolution.x / 2.;
  yt -= u_resolution.y / 2.;
  pos = pmm(xt, yt, PATTERN_DIM, OFFSET);
  pos.y += sin(u_time*SPEED)*0.12;

  if (PALETTE == 1) {
    coloreUno = vec3(0.733, 1.0, 0.31);
    coloreDue = vec3(1.0, 0.353, 0.208);
    coloreTre = vec3(0.086, 0.29, 0.8);
    coloreQuattro = vec3(0.698, 0.188, 0.075);
    coloreCinque = vec3( 0.098, 0.0, 0.749);
    red = vec4(coloreQuattro, 1.0);
    blu = vec4(coloreTre, 1.0);
    colTex = vec4(coloreDue, 1.0);
    background = vec4(coloreTre,1.0);
  }
  else if (PALETTE == 2) {
    coloreUno = vec3(1., 0.592, 0.706);
    coloreDue = vec3(0.898, 0.341, 0.878);
    coloreTre = vec3(0.902, 0.494, 0.063);
    coloreQuattro = vec3(0., 0.498, 0.353);
    coloreCinque = vec3(0.098, 0, 0.749);
    red = vec4(coloreUno, 1.0);
    blu = vec4(coloreCinque, 1.0);
    colTex = vec4(coloreTre, 1.0);
    background = vec4(coloreQuattro,1.0);
  }
  else if (PALETTE == 3){
    coloreUno = vec3(0.965, 0.914, 0.396);
    coloreDue = vec3(0.333, 1, 0.235);
    coloreTre = vec3(0.078, 0.643, 0.8);
    coloreQuattro = vec3(0.706, .0, 0.514);
    coloreCinque = vec3(.0, .0, .0);
    red = vec4(coloreDue, 1.0);
    blu = vec4(coloreUno, 1.0);
    colTex = vec4(coloreQuattro, 1.0);
    background = vec4(coloreQuattro,1.0);  
  }
  else if (PALETTE == 4){
    coloreUno = vec3(0.055, 0.8, 0.812);
    coloreDue = vec3(0.965, 0.914, 0.396);
    coloreTre = vec3(0.902, 0.659, 0.141);
    coloreQuattro = vec3(0.953, 0.447, 0.035);
    coloreCinque = vec3(1., 0.267, 0.016);  
    red = vec4(coloreDue, 1.0);
    blu = vec4(coloreCinque, 1.0);
    colTex = vec4(coloreUno, 1.0);
    background = vec4(coloreQuattro, 1.0);  
  }
  else if (PALETTE == 5){
    coloreUno = vec3(0.055, 0.8, 0.812);
    coloreDue = vec3(0.702, 0.839, 0.38);
    coloreTre = vec3(0.945, 0.757, 0.137);
    coloreQuattro = vec3(0.902, 0.659, 0.141);
    coloreCinque = vec3(0.525, 0.094, 0.949);
    red = vec4(coloreQuattro, 1.0);
    blu = vec4(coloreDue, 1.0);
    colTex = vec4(coloreCinque, 1.0);
    background = vec4(coloreQuattro,1.0);
  };
  if (PALETTE == 6) {
    coloreUno = vec3(0.733, 1.0, 0.31);
    coloreDue = vec3(1.0, 0.353, 0.208);
    coloreTre = vec3(0.086, 0.29, 0.8);
    coloreQuattro = vec3(0.698, 0.188, 0.075);
    coloreCinque = vec3( 0.098, 0.0, 0.749);
    red = vec4(coloreTre, 1.0);
    blu = vec4(coloreQuattro, 1.0);
    colTex = vec4(coloreDue, 1.0);
    background = vec4(coloreDue,1.0);
  }

  // textures
  vec4 texEye = vec4(texture2D(u_tex1, (origSt + vec2(0.5)) * (0.5 + length(mouse) * 0.3)));
  vec4 texZoom = vec4(texture2D(u_tex1, origSt + vec2(0.5)));
  vec4 texGroup = vec4(texture2D(u_tex1, pos * 0.41));
  
  // BG Holes
  background = mix(background, vec4(0), step(0.7, texGroup.r));
  color = vec4(mix(color.rgb, background.rgb, 1.), 1);
  vec2 grid1 = fract((origSt + vec2(0.5)) * 1.0);

  vec2 holesField = vectorFieldMg(origSt, 1.9, 16., 0.18, 0.013, u_time) * 3.2;
  //vec2 holesField = vectorFieldMg(origSt, 2.9, 16., 0.08, 0.013, u_time) * 3.;
  //vec2 holesField = vectorFieldMg(origSt, 2.9-mouse.x*1., 9., 0.28, 0.063, length(mouse)) * 2.;
  holesField = fract(holesField)-vec2(0.5);
  float holes = sdCircle(holesField, 0.3);
  float cell = 1.9;
  vec2 modSt = mod(holesField, vec2(cell));
  float x = plot(modSt.x, cell, 1.2);
  float y = plot(modSt.y, cell, 1.2);
  blu = blu - (length(texGroup) * 0.1);
  blu = blu * step(length(texGroup), 1.2);
  blu-= colTex* x;
  color = mix(color, blu, holes);

  // bulbo oculare. Uncomment for occhi a goccia
  //vec2 dir = normalize(mouse - origSt);
  vec2 dir = mouse - origSt;
  vec4 bigCircleCol = mix(blu, texZoom, step(0.4,texZoom.b)) ;
  // pupilla
  vec2 outlinePos = vec2(-0.50 - dir.x * 0.01, -0.50 - dir.y * 0.01);
  color = mix(color, red*texZoom.b, sdCircle(grid1+ outlinePos, 0.47));

  float circ1 = sdCircle(grid1 + vec2(-0.5 - dir*0.03), 0.48 -(length(dir)* 0.04));
  float circ2 = sdCircle(grid1 + vec2(-0.5 - dir*0.09), 0.24 -(length(dir)* 0.09));

  color = mix(color, bigCircleCol, circ1-circ2);
  color = mix(color, red*texEye.b, circ2);

  gl_FragColor = pow(color, vec4(vec3(1./2.2), 1.0));
}