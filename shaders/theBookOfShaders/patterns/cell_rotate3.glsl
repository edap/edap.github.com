
#ifdef GL_ES
precision mediump float;
#endif
#define PI 3.14159265358979323846

float box(vec2 _st, vec2 _size, float _smoothEdges){
    _size = vec2(0.5)-_size*0.5;
    vec2 aa = vec2(_smoothEdges*0.5);
    vec2 uv = smoothstep(_size,_size+aa,_st);
    uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
    return uv.x*uv.y;
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
        float n_tile = 3.0;

        st *= n_tile;

        float x = ceil(mod(iGlobalTime, n_tile));
        float checkFirst = inCell(x, 2.0, st);
        float checkSecond = inCell(2.0, 1.0, st);

        st = fract(st);

        st = rotate2d( PI *0.25, st );
        //color = vec3(box(st,vec2(0.7),0.3));
        color += vec3(box(st,vec2(0.7),0.3)) * vec3(checkFirst);
        color += vec3(box(st,vec2(0.7),0.3)) * vec3(checkSecond);
        gl_FragColor = vec4(color,1.0);
}