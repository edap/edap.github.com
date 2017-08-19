#ifdef GL_ES
precision mediump float;
#endif
vec3 colorA = vec3(0.149,0.141,0.912);
vec3 colorB = vec3(1.000,0.833,0.224);



void main() {
    vec3 color = vec3(0.0);
    //sined margin
    float margin = abs(sin(iGlobalTime));
    //fixed margin
    //float margin = 0.2;
    vec2 st = gl_FragCoord.xy / iResolution.xy;

    // questo
    float left = step(margin, st.x);
    float bottom = step(margin, st.y);
    
    // e' uguale a questo
    vec2 bottom_left = step(vec2(margin), st);
    float pct_bottom_left = bottom_left.x * bottom_left.y;

    //puoi anche disegnare il brodo in basso a destra
    vec2 top_right = step(vec2(margin), 1.0 - st);
    pct_bottom_left *= top_right.x * top_right.y;
    color = vec3(pct_bottom_left);
    gl_FragColor = vec4(color,1.0);
}