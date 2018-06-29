vec2 uv2tri(vec2 uv)
{
    float sx = uv.x - uv.y / 2.; // skewed x
    float offs = step(fract(1. - uv.y), fract(sx));
    return vec2(floor(sx) * 2. + offs, floor(uv.y));
}

void main(void)
{
    float res = iResolution.y / 4.;
    vec2 uv = (gl_FragCoord.xy - iResolution.xy / 3.) / res;

    float skew_x = 1.;
    vec3 p = vec3(
      dot(uv, vec2(skew_x, 0.5)),
      dot(uv, vec2(-skew_x, 0.5)),
      uv.y);
    vec3 p1 = fract(+p);
    vec3 p2 = fract(-p);

    // distance from borders
    float d1 = min(min(p1.x, p1.y), p1.z);
    float d2 = min(min(p2.x, p2.y), p2.z);
    float d = min(d1, d2);

    // border line
    float c = clamp((d - 0.04) * res, 0., 1.);

    vec3 red = vec3(1.0,0.,0.);

    gl_FragColor = vec4(red * c, 1);
}