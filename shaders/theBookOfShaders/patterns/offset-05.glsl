// per vedere se un thread e' pari o dispari, puoi usare mod di 2.0 e poi vedere se il risultato
// e' minore di 1.0. Per fare un check di questa condition puoi usare un ternary operator
// oppure usi step. Step e' piu' veloce, in generale, tutte le built in functions sono piu' veloci

// Author @patriciogv ( patriciogonzalezvivo.com ) - 2015

#ifdef GL_ES
precision mediump float;
#endif


vec2 brickTile(vec2 _st, float _zoom){
    _st *= _zoom;

    // qui e' dove usi step per fare l'ofset
    _st.x += step(1.0, mod(_st.y,2.0)) * 0.5;

    return fract(_st);
}

float box(vec2 _st, vec2 _size){
    _size = vec2(0.5)-_size*0.5;
    vec2 uv = smoothstep(_size,_size+vec2(1e-4),_st);
    uv *= smoothstep(_size,_size+vec2(1e-4),vec2(1.0)-_st);
    return uv.x*uv.y;
}

void main(void){
    vec2 st = gl_FragCoord.xy/iResolution.xy;
    vec3 color = vec3(0.0);

    // Modern metric brick of 215mm x 102.5mm x 65mm
    // http://www.jaharrison.me.uk/Brickwork/Sizes.html
    // st /= vec2(2.15,0.65)/1.5;

    // Apply the brick tiling
    st = brickTile(st,5.0);

    color = vec3(box(st,vec2(0.9)));

    // Uncomment to see the space coordinates
    // color = vec3(st,0.0);

    gl_FragColor = vec4(color,1.0);
}