#ifdef GL_ES
precision mediump float;
#endif

//https://thebookofshaders.com/07/

//this could be useful for a vignette background
vec3 rect(float margin){
    vec3 pct;
    vec2 st = gl_FragCoord.xy / iResolution.xy;    
    // and this, are the same
    vec2 bottomLeft = step(vec2(margin),st);
    pct = vec3( bottomLeft.x * bottomLeft.y );

    vec2 topRight = step(vec2(margin), 1.0 - st);
    pct *= vec3(topRight.x * topRight.y);
    return pct;
}

//this could be useful for a vignette background, but smoothed
vec3 rectSmooth(float margin, float edge){
    vec3 pct;
    vec2 st = gl_FragCoord.xy / iResolution.xy;    
    // and this, are the same
    vec2 bottomLeft = smoothstep(vec2(margin),vec2(margin+edge),st);
    pct = vec3( bottomLeft.x * bottomLeft.y );

    vec2 topRight = smoothstep(vec2(margin),vec2(margin+edge), 1.0 - st);
    pct *= vec3(topRight.x * topRight.y);
    return pct;
}

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
    //vec3 rect = rectSmooth(0.1, 0.2);
    //gl_FragColor = vec4(rect,1.0);
    vec2 st = gl_FragCoord.xy / iResolution.xy;
    vec2 orig = vec2(0.5, 0.5);
    //float rect = rectangle(st, orig, vec2(0.1,0.1));
    //make it rotate
    vec2 circularMovement = vec2(sin(iGlobalTime)*0.1, cos(iGlobalTime)*0.1);
    float rect = rectangle(st, orig+circularMovement, vec2(0.1,0.1));
    gl_FragColor = vec4(vec3(rect),1.0);
    //gl_FragColor = vec4(vec3(rect*0.4,rect*0.7,rect*0.2),1.0);
}