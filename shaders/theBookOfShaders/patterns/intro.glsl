
#ifdef GL_ES
precision mediump float;
#endif

float circleSmooth(in vec2 st, in vec2 pos, in float begin, in float end) {
    float pct = 0.0;
    pct = smoothstep(begin, end, distance(st, pos));
    return pct;
}

vec2 grid(inout vec2 st, in float row, in float col){
        st.x *= row;
        st.y *= col;
        st = fract(st);
        return st;
}

void main(){
        vec2 st = gl_FragCoord.xy/iResolution.xy;
        vec3 color = vec3(0.0);
        // try uncomment this
        st *= 3.;

        // try to multiply just the x or the y
        st = fract(st);

        // try to use the function grid instead of
        // st *= 3. and st = fract(st);
        
        //st = grid(st, 3.0, 3.0);

        color = vec3(st,0.0);
        // try out to uncomment
        //color = vec3(circleSmooth(st,vec2(0.5,0.5), 0.2, 0.6));
        gl_FragColor = vec4(color,1.0);
}
