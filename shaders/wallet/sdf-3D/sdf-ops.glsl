// http://iquilezles.org/www/articles/distfunctions/distfunctions.htm

//Union
float opU( float d1, float d2 )
{
    return min(d1,d2);
}

//Substraction
float opS( float d1, float d2 )
{
    return max(-d1,d2);
}

//Intersection
float opI( float d1, float d2 )
{
    return max(d1,d2);
}

float opCheapBend( vec3 p )
{
    float c = cos(20.0*p.y);
    float s = sin(20.0*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xy,p.z);
    return primitive(q);
}

//domain operations

//Repetition
float opRep( vec3 p, vec3 c )
{
    vec3 q = mod(p,c)-0.5*c;
    return primitve( q );
}

//Rotation/Translation
vec3 opTx( vec3 p, mat4 m )
{
    vec3 q = invert(m)*p;
    return primitive(q);
}

//Scale
float opScale( vec3 p, float s )
{
    return primitive(p/s)*s;
}

// DISTANCE DEFORMATIONS

//Displacement
float opDisplace( vec3 p )
{
    float d1 = primitive(p);
    float d2 = displacement(p);
    return d1+d2;
}

//Blend
float opBlend( vec3 p )
{
    float d1 = primitiveA(p);
    float d2 = primitiveB(p);
    return smin( d1, d2 );
}

//Twist
vec3 opTwist( vec3 p )
{
    float  c = cos(10.0*p.y+10.0);
    float  s = sin(10.0*p.y+10.0);
    mat2   m = mat2(c,-s,s,c);
    return vec3(m*p.xz,p.y);
}