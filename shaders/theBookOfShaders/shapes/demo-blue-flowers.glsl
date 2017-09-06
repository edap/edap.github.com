#ifdef GL_ES
precision mediump float;
#endif


vec3 snowFlake(vec2 st, vec2 orig, float resize, float smoothness,
float nPale, float paleInterr, float centerDim, float paleDim){
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*resize;

    // il numero di petali visualizzato e' il doppio di nPale
    float f = abs(cos(angle*nPale)*sin(angle*paleInterr))*.8+centerDim;
    return vec3( 1.-smoothstep(f,f+smoothness,radius) );;
}


void main(){
    vec2 st = gl_FragCoord.xy/iResolution.xy;
    float mainFreq = 29.4;
    vec3 color = vec3(0.0, 0.0, 0.0);
    vec3 colorA = vec3(0.149,0.141,0.912);
    vec3 colorB = vec3(1.000,0.833,0.224);
    vec3 colorC = vec3(1.000,0.233,0.100);
    st.x *= iResolution.x/iResolution.y;
    float sinTime = sin(iGlobalTime);
    float cosTime = cos(iGlobalTime);

    float resizeA = abs(sinTime)*mainFreq * 0.2;
    float resizeB = abs(cosTime)*mainFreq * 2.9;
    float resizeC = abs(cosTime)*mainFreq * 3.9;

    colorA *= snowFlake(st, vec2(0.5), resizeA, 0.62, 3., 3., 0.3, 1.8);
    colorB *= snowFlake(st, vec2(0.5), resizeB, 1.62, 6., 6., 0.6, 2.8);
    colorC *= snowFlake(st, vec2(0.5), resizeC, 2.62, 9., 9., 0.9, 3.8);
    vec3 colorDeb = colorB;
    color += colorA+=colorB+=colorC;

    gl_FragColor = vec4(color,1.0);
}