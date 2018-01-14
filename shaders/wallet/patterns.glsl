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

vec2 tileMoveAlternate(vec2 _st, float _zoom, float time){
    _st *= _zoom;
    _st.x += time * step(1.0,mod(_st.y,2.0));
    _st.x -= time * step(mod(_st.y,2.0), 1.0);
    return fract(_st);    
}

vec2 tileMoveCrossed(vec2 _st, float _zoom, float utime, float speed){
    float time = utime * speed;
    _st *= _zoom;
    // horizontal or vertical?
    float ver = step(.5,fract(time));
    float hor = step(ver, 0.);
    // even rows and columns
    float evenY = step(.5, fract(_st.y * .5));
    float oddY = step(evenY,0.);
    float evenX = step(.5, fract(_st.x * .5));
    float oddX = step(evenX,0.);
    // apply movement
    _st.x += ((fract(time) * 2.0) * evenY) * hor;
    _st.x -= ((fract(time) * 2.0) * oddY) * hor;
    _st.y += ((fract(time) * 2.0) * evenX) * ver;
    _st.y -= ((fract(time) * 2.0) * oddX) * ver;
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
    //st = tile(st, 5.0);

    // tiling with movement
    //st = tileMoveAlternate(st, 5.0, iGlobalTime);

    // tiling movement crossed
    st = tileMoveCrossed(st, 5.0, iGlobalTime, 0.5);


    color = vec3(box(st,vec2(0.8)));

    // start offset example
    // vec2 offsetSt = offset(st, vec2(0.5));
    // float bigBox = box(offsetSt,vec2(0.95));
    // float smallWhiteBox = box(st,vec2(0.3));
    // color = vec3(bigBox - smallWhiteBox);
    // end offset example

    
    gl_FragColor = vec4(color,1.0);
}