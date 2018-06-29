// Author @patriciogv ( patriciogonzalezvivo.com ) - 2015

#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323846



vec2 rotate2D (vec2 _st, float _angle) {
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

float when_eq(float x, float y) {
  return 1.0 - abs(sign(x - y));
}

vec2 tile (vec2 _st, float _zoom) {
    _st *= _zoom;
    return fract(_st);
}

vec2 rotateTilePattern(vec2 _st){

    //  Scale the coordinate system by 2x2
    _st *= 2.0;

    //  Give each cell an index number
    //  according to its position
    float index = 0.0;
    index += step(1., mod(_st.x,2.0));
    index += step(1., mod(_st.y,2.0))*2.0;

    //      |
    //  2   |   3
    //      |
    //--------------
    //      |
    //  0   |   1
    //      |

    // Make each cell between 0.0 - 1.0
    _st = fract(_st);

    //  Rotate cell 1 by 90 degrees
    float rad = PI*0.5 * when_eq(index, 1.);
    _st = rotate2D(_st,rad);

    //  Rotate cell 2 by -90 degrees
    rad = PI*-0.5 * when_eq(index, 2.);
    _st = rotate2D(_st,rad);

    //  Rotate cell 3 by 180 degrees
    rad = PI * when_eq(index, 3.);
    _st = rotate2D(_st,rad);

    return _st;
}

void main (void) {
    vec2 st = gl_FragCoord.xy/iResolution.xy;

    st = tile(st,1.0);
    st = rotateTilePattern(st);

    // Make more interesting combinations
    //st = tile(st,2.0);
    //st = rotate2D(st,-PI*iGlobalTime*0.25);
    //st = rotateTilePattern(st*2.);
    //st = rotate2D(st,PI*iGlobalTime*0.25);

    // step(st.x,st.y) just makes a b&w triangles
    // but you can use whatever design you want.
    gl_FragColor = vec4(vec3(step(st.x,st.y)),1.0);
}
