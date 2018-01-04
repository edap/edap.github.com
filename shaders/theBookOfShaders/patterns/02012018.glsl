#define PI 3.14159265358979323846

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

float distortedDaisy(
  vec2 st, vec2 orig, float resize, float smoothness,
  float nPetals, float distorsion, float addendum){
  // From Inigo's video
  // https://www.youtube.com/watch?v=0ifChJ0nJfM
  
  vec2 toCenter = orig-st;
  // to turn the picture upside down, uncomment the following
  // line
  //vec2 toCenter = st-orig;
  float angle = atan(toCenter.y,toCenter.x);
  float r = resize + addendum*cos(angle * nPetals + distorsion * toCenter.x);
  return smoothstep(r, r+smoothness, length(toCenter));
}

vec2 offset(vec2 _st, vec2 _offset){
    vec2 uv = _st;

    uv.x -= step(_offset.x, _st.x) * _offset.x;
    uv.x += (step(_st.x, _offset.x) * _offset.x);

    uv.y -= (step(_offset.y, _st.y) * _offset.y);
    uv.y += (step(_st.y, _offset.y) * _offset.y);

    return uv;
}


float box(vec2 _st, vec2 _size){
    _size = vec2(0.5)-_size*0.5;
    vec2 uv = smoothstep(_size,_size+vec2(1e-4),_st);
    uv *= smoothstep(_size,_size+vec2(1e-4),vec2(1.0)-_st);
    return uv.x*uv.y;
}


void main(  )
{
    vec3 backgroundColor = vec3(1.0, 0., 0.);
    vec3 foregroundColor = vec3(0.,0., 1.0);
    

    vec2 st = gl_FragCoord.xy / iResolution.y;
    
    st *= 6.0;
    st = fract(st);
    //float d = 150.0; // distorsion
    float d = 90. + abs(sin(iGlobalTime)) * 60.;
    float r = 0.3;  // resize
    float a = 0.1;  //addendum
    float p = 40.0; // number of petals
    float s = 0.049; // smoothness of the border
    vec2 center = vec2(0.5);
  
    float col = distortedDaisy(st, center,r,s,p,d,a);
    
    vec2 offsetSt = offset(st, vec2(0.5, 0.0));
    float bigBox = box(offsetSt,vec2(0.7));
    //float smallBox = box(offsetSt,vec2(0.6 - abs(sin(iGlobalTime)) * 0.2));
    //float smallBox = box(rotate2d(PI/4., offsetSt),vec2(0.6));
    float smallBox = box(rotate2d(PI/4., offsetSt),vec2(0.8 - abs(sin(iGlobalTime)) * 0.2));
    
    backgroundColor += (bigBox - smallBox) * vec3(0.6, 0.7, 0.0);
	  gl_FragColor = vec4(mix(foregroundColor, backgroundColor, col),1.0);
}