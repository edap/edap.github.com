#ifdef GL_ES
precision mediump float;
#endif
vec3 colorA = vec3(0.149,0.141,0.912);
vec3 colorB = vec3(1.000,0.833,0.224);

float plot (vec2 st, float pct){
return smoothstep( pct-0.01, pct, st.y) -
          smoothstep( pct, pct+0.01, st.y);
}

// YUV to RGB matrix
mat3 yuv2rgb = mat3(1.0, 0.0, 1.13983, 
                    1.0, -0.39465, -0.58060, 
                    1.0, 2.03211, 0.0);

// RGB to YUV matrix
mat3 rgb2yuv = mat3(0.2126, 0.7152, 0.0722,
                    -0.09991, -0.33609, 0.43600, 
                    0.615, -0.5586, -0.05639);

void main() {
    //Cose da sapere: mix, hsl space, YUV color space

    //EXAMPLE one mix
    //vec3 color = vec3(0.0);
    //float pct = abs(sin(iGlobalTime));
    // Mix uses pct (a value from 0-1) to // mix the two colors
    //color = mix(colorA, colorB, pct);
    //gl_FragColor = vec4(color,1.0);

    //EXAMPLE two mix
    vec2 st = gl_FragCoord.xy / iResolution.xy;
    vec3 color = vec3(0.5);
    vec3 pct = vec3(st.x);
    //pct.r = smoothstep(0.0,1.0, st.x);
    color = mix(colorA, colorB, pct);

    //plot the lines
    //color = mix(color,vec3(1.0,0.0,0.0),plot(st,pct.r));
    color = mix(color,vec3(0.0,1.0,0.0),plot(st,pct.g));
    //color = mix(color,vec3(0.0,0.0,1.0),plot(st,pct.b));

   //YUV start
    st -= 0.5;  // becomes -0.5 to 0.5
    st *= 2.0;  // becomes -1.0 to 1.0
    color = yuv2rgb * vec3(0.4, st.x, st.y);
    //YUV end
    gl_FragColor = vec4(color,1.0);
}