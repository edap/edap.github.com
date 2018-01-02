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
    vec2 st = gl_FragCoord.xy / iResolution.xy;
    // this line makes the proportion correct
    // no ellipses but circles, try to comment it out
    //st.x *= iResolution.x/iResolution.y;
    vec3 color = vec3(0.0);
    float d = 0.0;

    // Remap the space to -1. to 1.
    // questo trick e' abbastanza importante
    // lo trovi spesso
    // prova a rimuoverlo
    st = st *2.-1.;

    // Make the distance field
    d = length( abs(st)-0.228 );
    // d = length( min(abs(st)-.3,0.) );
    // d = length( max(abs(st)-.3,0.) );

    // Visualize the distance field
    gl_FragColor = vec4(vec3(fract(d*10.088)),0.912);
}