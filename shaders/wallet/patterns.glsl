#ifdef GL_ES
precision mediump float;
#endif

// this file contains some function useful for patterns
// keywords: tiles, patterns, brick, cells

// Author @patriciogv ( patriciogonzalezvivo.com ) - 2015
vec2 brickTile(vec2 _st, float _zoom){
    _st *= _zoom;
    // qui e' dove usi step per fare l'ofset
    _st.x += step(1.0, mod(_st.y,2.0)) * 0.5;
    return fract(_st);
}

vec2 tile(vec2 _st, float _zoom){
    _st *= _zoom;
    return fract(_st);
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

void main(void){
    vec2 st = gl_FragCoord.xy/iResolution.xy;
    st.y *= iResolution.y/iResolution.x;

    vec3 color = vec3(0.0);

    // Apply the brick tiling
    //st = brickTile(st,5.0);

    // normal tiling
    st = tile(st, 5.0);

    color = vec3(box(st,vec2(0.9)));

    // start offset example
    // vec2 offsetSt = offset(st, vec2(0.5));
    // float bigBox = box(offsetSt,vec2(0.95));
    // float smallWhiteBox = box(st,vec2(0.3));
    // color = vec3(bigBox - smallWhiteBox);
    // end offset example

    
    gl_FragColor = vec4(color,1.0);
}