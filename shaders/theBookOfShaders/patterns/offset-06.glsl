#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323846

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
      sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

vec2 tile(vec2 _st, float _zoom){
    _st *= _zoom;
    return fract(_st);
}

float box(vec2 _st, vec2 _size, float _smoothEdges){
    _size = vec2(0.5)-_size*0.5;
    vec2 aa = vec2(_smoothEdges*0.5);
    vec2 uv = smoothstep(_size,_size+aa,_st);
    uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
    return uv.x*uv.y;
}

vec2 offset(vec2 _st, vec2 _offset){
    vec2 uv = _st;

    uv.x -= step(_offset.x, _st.x) * _offset.x;
    uv.x += (step(_st.x, _offset.x) * _offset.x);

    uv.y -= (step(_offset.y, _st.y) * _offset.y);
    uv.y += (step(_st.y, _offset.y) * _offset.y);

    return uv;
}

void main(void){
    vec2 st = gl_FragCoord.xy/iResolution.xy;
    st.y *= iResolution.y/iResolution.x;

    st = tile(st,10.);

    vec2 offsetSt = offset(st,vec2(0.5, 0.5));

    st = rotate2D(st,PI*0.25);

    float bigBox = box(offsetSt,vec2(0.95),0.01);
    float smallWhiteBox = box(st,vec2(0.3),0.1);
    float smallBlackBox = 2.*box(st,vec2(0.2),0.01);
    vec3 color = vec3( bigBox - smallWhiteBox +  smallBlackBox);

    //vec3 color = vec3(step( st.x, 0.5));

    gl_FragColor = vec4(color,1.0);
}
