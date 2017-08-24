#ifdef GL_ES
precision mediump float;
#endif

//https://thebookofshaders.com/07/


//this is to draw square or rect in a certain position
float rectangle(in vec2 st, in vec2 origin, in vec2 dimensions) {
    vec2 center = step(origin, st);
    float pct = center.x * center.y;
    vec2 full = step(1.0 - origin - dimensions, 1.0 - st);
    pct *= full.x * full.y;
    return pct;
}

//usage example
void main() {   
    //vec3 rect = rect(0.1);
    //gl_FragColor = vec4(rect,1.0);
    vec3 col = vec3(0.0);
    vec2 st = gl_FragCoord.xy / iResolution.xy;
    st.x*=iResolution.x/iResolution.y;
    vec2 origin = vec2(0.5, 0.5);
    //float rect = rectangle(st, orig, vec2(0.1,0.1));
    //make it rotate
    vec2 circularMovement = vec2(sin(iGlobalTime)*0.1, cos(iGlobalTime)*0.1);

    float rect = rectangle(st, origin, vec2(0.1,0.1));
    gl_FragColor = vec4(vec3(rect),1.0);
}