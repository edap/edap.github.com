
#ifdef GL_ES
precision mediump float;
#endif

float circleSmooth(in vec2 st, in vec2 pos, in float begin, in float end) {
    float pct = 0.0;
    pct = smoothstep(begin, end, distance(st, pos));
    return pct;
}

vec3 rect(in vec2 st, float margin){
    vec3 pct;  
    // and this, are the same
    vec2 bottomLeft = step(vec2(margin),st);
    pct = vec3( bottomLeft.x * bottomLeft.y );

    vec2 topRight = step(vec2(margin), 1.0 - st);
    pct *= vec3(topRight.x * topRight.y);
    return pct;
}

// it tiles the coordinate system in row and col
vec2 grid(inout vec2 st, in float row, in float col){
        st.x *= row;
        st.y *= col;
        st = fract(st);
        return st;
}

// this has to be used before we call fract(or the grid function)
float inCell(in float n_row, in float n_col, in vec2 st){
  float x_min = step(n_row-1.0, st.x);
  float x_max = step(st.x, n_row);
  float y_min = step(n_col-1.0, st.y);
  float y_max = step(st.y, n_col);
  return x_min * y_min * x_max * y_max;
}

// questo esempio spiega come usare la funzione in cell
void main(){
        vec2 st = gl_FragCoord.xy/iResolution.xy;
        vec3 color = vec3(0.0);
        // try uncomment this
        st *= 3.;

        // if you use the check before fract, it does not work
        // because it is
        float check = inCell(3.0, 2.0, st);

        // try to multiply just the x or the y
        st = fract(st);

        // try to use the function grid instead of
        // st *= 3. and st = fract(st);
        
        //st = grid(st, 3.0, 3.0);     
        color = rect(st,0.3) * vec3(check);
        gl_FragColor = vec4(color,1.0);
}