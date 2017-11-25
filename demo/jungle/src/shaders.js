export function vertexShader(){
    let vs =
        `precision mediump float;
        attribute float angle;
        varying float fAngle;
        varying vec3 vecNormal;
        varying vec4 vecPos;
        uniform vec2 uResolution;
        uniform float displacement;
        uniform float magAudio;
        void main() {
        vecNormal = normalMatrix * normal;
        // as the light later will be given in world coordinate space,
        // vPos has to be in world coordinate space too
        vec3 displacedPos = position + vecNormal * displacement * vec3(magAudio);
        vecPos = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
        fAngle = angle;
        gl_Position = vecPos;
        }`;
    return vs;
}

export function fragmentShader(){
    let fs =
        "#define LOG2 1.442695\n"+
        "#define saturate(a) clamp( a, 0.0, 1.0 )\n"+
        "#define whiteCompliment(a) ( 1.0 - saturate( a ) )\n"+
        "precision mediump float;\n"+
        // Comment this line to do not use the point light
        "varying vec3 vecNormal;\n"+
        "uniform float fogDensity;\n"+
        "uniform vec3 fogColor;\n"+
        "varying float fAngle;\n"+
        "varying vec4 vecPos;\n"+
        "uniform float magAudio;\n"+
        "uniform vec3 color;\n"+
        "uniform vec2 uResolution;\n"+
        "uniform float amplitude;\n"+
        "uniform float minColor;\n"+
        "uniform float maxColor;\n"+
        "uniform float saturation;\n"+
        "uniform float brightness;\n"+
        "struct PointLight {\n"+
            "vec3 position;\n"+
            "vec3 color;\n"+
        "};\n"+

        "uniform PointLight pointLights[ NUM_POINT_LIGHTS ];\n"+

        "float when_gt(float x, float y) {\n"+
            "return max(sign(x - y), 0.0);\n"+
        "}\n"+

        "float when_lt(float x, float y) {\n"+
            "return max(sign(y - x), 0.0);\n"+
        "}\n"+

        "float and(float a, float b) {\n"+
            "return a * b;\n"+
        "}\n"+

        "vec3 hsb2rgb( in vec3 c ){\n"+
            "vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),\n"+
            "6.0)-3.0)-1.0,\n"+
            "0.0,\n"+
            "1.0 );\n"+
            "rgb = rgb*rgb*(3.0-2.0*rgb);\n"+
            "return c.z * mix(vec3(1.0), rgb, c.y);\n"+
        "}\n"+

        "void main(){\n"+
            "vec4 addedLights = vec4(0.0,0.0,0.0, 1.0);\n"+
            "for(int l = 0; l < 3; l++){\n"+
                "vec3 adjustedLight = pointLights[l].position + cameraPosition;\n"+
                "vec3 lightDirection = normalize(vecPos.xyz - adjustedLight);\n"+
                "addedLights.rgb += clamp(dot(-lightDirection, vecNormal), 0.0, 1.0) * pointLights[l].color;\n"+
            "}\n"+
            "float correctedMinColor = minColor;\n"+
            "float correctedMaxColor = maxColor;\n"+
            "correctedMinColor += (magAudio/amplitude) * when_gt(amplitude, 0.0);\n"+
            "correctedMaxColor += (magAudio/amplitude) * when_gt(amplitude, 0.0);\n"+

            "float angleToCol = clamp((fAngle+magAudio)/256.0, correctedMinColor, correctedMaxColor);\n"+ // questi due valori definiscono il range
            "vec3 angleHSBColor = vec3(angleToCol, saturation, brightness);\n"+
            "vec4 col = mix(vec4(hsb2rgb(angleHSBColor), 1.0), vec4(addedLights.rgb, 1.0), 0.2);\n"+

        "#ifdef USE_FOG // only FogExp2 is implemented\n"+
            "float depth = gl_FragCoord.z / gl_FragCoord.w;\n"+
            "float fogFactor = whiteCompliment( exp2( - fogDensity * fogDensity * depth * depth * LOG2 ) );\n"+
            "gl_FragColor.rgb = mix( col.rgb, fogColor, fogFactor );\n"+
        "#else\n"+
            "gl_FragColor = col;\n"+
        "#endif\n"+
        "}";

        return fs;
}
