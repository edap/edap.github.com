
float orcPetals(vec2 st, vec2 orig, float resize, float smoothness, float nPale){
    // https://thebookofshaders.com/07/
    // Use polar coordinates instead of cartesian
    // This technique is a little restrictive but very simple.
    // It consists of changing the radius of a circle depending 
    // on the angle to achieve different shapes.
    vec2 toCenter = vec2(orig)-st;
    float angle = atan(toCenter.y,toCenter.x) - 0.5;

    // the value of grow affect the curve
    float grow = pow(length(toCenter), 3.);
    //float grow = exp(length(toCenter)) * 0.029;
    //float grow = exp2(length(toCenter)) * 0.029;
    //float grow = sqrt(length(toCenter)) * 0.09;
    //float grow = sin(length(toCenter)) * 0.12;
    //float grow = asin(length(toCenter)) * 0.12;
    //float grow = tan(length(toCenter)) * 0.12;
    //float grow = atan(length(toCenter)) * 0.12;


    // this value affect how much the petals scale depending
    // on y, x or the combination of both
    float def = 80.;

    // Y
    //float scale = resize + toCenter.y * def;
    //float scale = resize - toCenter.y * def; // def = 30.
    //float scale = resize + asin(toCenter.y) * def; //def - 30.

    // X
    //float scale = resize - abs(toCenter.x) * def; //def = 30.
    float scale = resize + abs(toCenter.x) * def; //def = 80.
    
    // or combined
    //float scale = resize + abs(abs(toCenter.x)- toCenter.y) * def; //def = 80.

    // sin
    //float scale = resize + asin(toCenter.y) * def;

    float radius =  grow * scale;
    

    float f = cos(angle*nPale);
    return 1.-smoothstep(f,f+smoothness,radius);
}

void main(){
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  st.x *= iResolution.x /iResolution.y;
  float draw = orcPetals(st, vec2(0.4, 0.5), 23.9, 0.06, 3.);
  gl_FragColor = vec4(vec3(draw),1.);

}