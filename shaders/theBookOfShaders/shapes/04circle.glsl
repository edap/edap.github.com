#ifdef GL_ES
precision mediump float;
#endif

//https://thebookofshaders.com/07/
float circleBg(vec2 st, vec2 end){
    float pct = 0.0;
    pct = distance(st, end);
    return pct;
}

float circle(in vec2 st, in vec2 end) {
    float pct = 0.0;
    pct = step(0.2, distance(st, end));
    return pct;
}

float circleSmooth(in vec2 st, in vec2 pos, in float begin, in float end) {
    float pct = 0.0;
    pct = smoothstep(begin, end, distance(st, pos));
    return pct;
}

float circleDoubleCenter(in vec2 st, in vec2 first, in vec2 second) {
    float pct = 0.0;
    pct = distance(st,first) +
          distance(st,second);
    // Try out new combination
    //pct = distance(st,first) * distance(st,second);
    //pct = min(distance(st,first),distance(st,second));
    //pct = max(distance(st,first),distance(st,second));
    //pct = pow(distance(st,first),distance(st,second));
    return pct;
}

// distance is expensive, this version use less resources
float circleOpt(in vec2 _st, in vec2 _pos, in float _radius){
    vec2 dist = _st - _pos;
	return 1.-smoothstep(_radius-(_radius*0.01),
                         _radius+(_radius*0.01),
                         dot(dist,dist)*4.0);
}





//usage example
void main() {   
    vec2 st = gl_FragCoord.xy / iResolution.xy;
    vec2 orig = vec2(0.4, 0.8);
    vec3 fgColor = vec3(0., 0.7, 0.0);
    vec3 bgColor = vec3(0.9, 0.2, 0.0);

    //make it rotate
    vec2 circularMovement = vec2(sin(iGlobalTime)*0.1, cos(iGlobalTime)*0.1);

    //float cir = circle(st, orig+circularMovement);
    float cir = circle(st, orig);
    //float cir = circleBg(st, orig);
    //float cir = distance(st, orig);
    //float cir = circleSmooth(st,vec2(0.5), 0.1, 0.01);
    //float cir = circleOpt(st, orig+circularMovement, 0.2);
    // float cir = circleDoubleCenter(st, vec2(0.8,0.6)+circularMovement,
    //             vec2(0.4,0.4)-circularMovement);

    // you can use the value of the distance function for the mixing
    // a bacground color with a foreground color
    vec3 col = mix(fgColor, bgColor, cir);
    gl_FragColor = vec4(vec3(col),1.0);
}