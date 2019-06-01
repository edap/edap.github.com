#define PI 3.14159265359



uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
uniform sampler2D u_tex2;
uniform sampler2D u_tex3;


vec2 rotate2D (vec2 _st, float _angle) {
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}
    
vec2 squareFrame(vec2 res, vec2 coord){
    vec2 uv = 2.0 * coord.xy / res.xy - 1.0;
    uv.x *= res.x / res.y;
    return uv;
}



float plot(vec2 st, float pct, float th){
  return  smoothstep( pct-th, pct, st.y) -
          smoothstep( pct, pct+th, st.y);
}

vec2 rotateTilePattern(vec2 _st){

    //  Scale the coordinate system by 2x2
    _st *= 2.0;

    //  Give each cell an index number
    //  according to its position
    float index = 0.0;
    index += step(1., mod(_st.x,2.0));
    index += step(1., mod(_st.y,2.0))*2.0;

    //      |
    //  2   |   3
    //      |
    //--------------
    //      |
    //  0   |   1
    //      |

    // Make each cell between 0.0 - 1.0
    _st = fract(_st);

    // Rotate each cell according to the index
    if(index == 1.0){
        //  Rotate cell 1 by 90 degrees
        _st = rotate2D(_st,PI*0.5);
    } else if(index == 2.0){
        //  Rotate cell 2 by -90 degrees
        _st = rotate2D(_st,PI*-0.5);
    } else if(index == 3.0){
        //  Rotate cell 3 by 180 degrees
        _st = rotate2D(_st,PI);
        //_st.y+= 0.2;
    }

    return _st;
}

// inigo gain function
float gain(float x, float k) 
{
    float a = 0.5*pow(2.0*((x<0.5)?x:1.0-x), k);
    return (x<0.5)?a:1.0-a;
}

void main(void){
  vec3 lime = vec3(0.733, 1.0, 0.31);
  vec3 red = vec3(1.0, 0.353, 0.208);
  vec3 blu = vec3(0.086, 0.29, 0.8);
  vec3 redHard = vec3(0.698, 0.188, 0.075);
  vec3 blueHard = vec3( 0.098, 0.0, 0.749);

  vec2 st = squareFrame(u_resolution.xy, gl_FragCoord.xy);

    // net
    vec2 uv = st;
    uv *= 3.0;
    uv = fract(uv);
    uv = rotateTilePattern(uv);
    float y = gain(uv.x, 0.49 + tan(u_time*0.25)* 0.1);
    float net = plot(uv, y, 0.07);

    //segments
    vec2 uv2 = rotateTilePattern(st) *1.0;
    uv2 = fract(uv2);
    uv2 += vec2(sin(u_time), cos(u_time)) * 0.5;
    float segments = plot(uv2, y, 0.09);

    float l = net + segments;

    // BG
    vec2 tuv = (gl_FragCoord.xy/1.8)/ u_resolution.xy;
    tuv.x *= u_resolution.x / u_resolution.y;
    vec3 texc = texture2D(u_tex2, tuv).xyz;

    vec3 bgColor = blu * (1.0 - l);
    //vec3 bgColor = mix(blu,red, mod(uv.x, 0.9)) * (1.0 - l);
    //vec3 bgColor = vec3(0.086, 0.290, 0.800);
    bgColor += red * net;
    bgColor += texc * segments;



    //color = mix(vec3(bgColor), color, fogFactor);
    bgColor = pow(bgColor, vec3(1.1545)); // gamma corr

  gl_FragColor = vec4(clamp(bgColor,0.0,1.0) , 1.0);
}