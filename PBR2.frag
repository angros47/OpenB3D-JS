#version 300 es

precision highp float;
#define NUM_LIGHTS 8

// ----------------------------------------------------------------------------

const float PI = 3.14159265359;

// ----------------------------------------------------------------------------

// Parallax Occlusion values
const lowp float POscale = 0.04;
const lowp float POmin = 8.0;
const lowp float POmax = 32.0;
	
// ----------------------------------------------------------------------------

// from the Vertex Shader
in vec2 Vertex_UV;
in vec4 Vertex_Color;
in vec3 Vertex_Normal;
in vec4 Vertex_Position;
in vec3 Vertex_Surface_to_Viewer_Direction;
	
// ----------------------------------------------------------------------------
// variable inputs
uniform lowp float levelscale;   // mesh scales 
uniform lowp float gamma;        // user gamma correction 
uniform lowp float POmulti;      // Parallax Occlusion multiplicator 
uniform lowp vec2 texscale;      // texture scale (0...x) 
uniform lowp vec2 texoffset;     // texture offset (0...x) 
uniform int timer;          // timing 

// ---------------------------------------------------------------------------- 

// textures 
uniform sampler2D albedoMap;
uniform sampler2D normalMap;
uniform sampler2D bumpMap;
uniform sampler2D occlusionMap;
uniform sampler2D roughnessMap;
uniform sampler2D metallicMap;
uniform sampler2D emissionMap;
uniform samplerCube envMap;

// ---------------------------------------------------------------------------- 

// variable Flags 
uniform int flagPB;
uniform int flagPM;
uniform int flagEN;
uniform int flagEM;
uniform int flagTM;
uniform int setENV;
uniform int isMetal;

// ---------------------------------------------------------------------------- 

// texture existance flags 
uniform int texAL;
uniform int texNM;
uniform int texBM;
uniform int texOC;
uniform int texRO;
uniform int texME;
uniform int texEM;

// ---------------------------------------------------------------------------- 

// light related variables 
uniform lowp float A;
uniform lowp float B;
uniform lowp float lightradius[NUM_LIGHTS];
uniform lowp vec3 lightpos[NUM_LIGHTS];
uniform lowp vec3 lightcolor[NUM_LIGHTS];


uniform lowp vec3 ambientlight;

out vec4 fragmentColor;

// ---------------------------------------------------------------------------- 


//varying vec3 Vertex_Normal;

mat3 cotangent_frame(vec3 N, vec3 p, vec2 uv)
{
	vec3 dp1 = dFdx(p);
	vec3 dp2 = dFdy(p);
	vec2 duv1 = dFdx(uv);
	vec2 duv = dFdy(uv);
 
	vec3 dp2perp = cross(dp2, N);
	vec3 dp1perp = cross(N, dp1);
	vec3 T = dp2perp * duv1.x + dp1perp * duv.x;
	vec3 B = dp2perp * duv1.y + dp1perp * duv.y;
 
	float invmax = inversesqrt(max(dot(T, T), dot(B, B)));
	return mat3(T * invmax, B * invmax, N);
}


// ---------------------------------------------------------------------------- 

vec3 perturb_normal(vec3 N, vec3 V, vec3 map, vec2 texcoord)
{
	map = map * 255.0 / 127.0 - 128.0 / 127.0;
	
	mat3 TBN = cotangent_frame(N, -V, texcoord);
	return normalize(TBN * map);
}

// ---------------------------------------------------------------------------- 

vec3 ToneMapPBR(vec3 color)
{
	// HDR tonemapping and gamma correction 
	color = color / (color + vec3(1.0));
	color = pow(color, vec3(1.0 / gamma));
	
	return color;
}

// ---------------------------------------------------------------------------- 

vec3 Uncharted(vec3 x)
{
	float A = 0.15;
	float B = 0.50;
	float C = 0.10;
	float D = 0.20;
	float E = 0.02;
	float F = 0.30;
	
	return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

// ---------------------------------------------------------------------------- 

vec3 ToneMapUncharted(vec3 color)
{
	color = Uncharted(color * 4.5) * (1.0 / Uncharted(vec3(11.2)));
	color = pow(color, vec3(1.0 / gamma));
	return color;

}

// ---------------------------------------------------------------------------- 

vec3 ToneMapSCurve(vec3 x)
{
	float a = 2.51;
	float b = 0.03;
	float c = 2.43;
	float d = 0.59;
	float e = 0.14;
	return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// ---------------------------------------------------------------------------- 

vec3 ToneMapFilmic(vec3 color)
{
	vec4 vh = vec4(color*0.5, gamma);
	vec4 va = 1.425 * vh + 0.05;
	vec4 vf = (vh * va + 0.004) / (vh * (va + 0.55) + 0.0491) - 0.0821;
	return vf.rgb / vf.www;
}

// ---------------------------------------------------------------------------- 

vec3 ToneMapExposure(vec3 color)
{
	color = exp(-1.0 / ( 2.72 * color + 0.15 ));
	color = pow(color, vec3(1. / gamma));
	return color;
}

// ---------------------------------------------------------------------------- 

float DistributionGGX(vec3 N, vec3 H, float roughness)
{
	float a = roughness * roughness;
	float a2 = a * a;
	float NdotH = max(dot(N, H), 0.0);
	float NdotH2 = NdotH * NdotH;

	float nom = a2;
	float denom = (NdotH2 * (a2 - 1.0) + 1.0);
	denom = PI * denom * denom;

	return nom / denom;
}

// ---------------------------------------------------------------------------- 


float GeometrySchlickGGX(float NdotV, float roughness)
{
	float r = (roughness + 1.0);
	float k = (r * r) / 8.0;

	float nom = NdotV;
	float denom = NdotV * (1.0 - k) + k;

	return nom / denom;
}

// ---------------------------------------------------------------------------- 

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
	float NdotV = max(dot(N, V), 0.0);
	float NdotL = max(dot(N, L), 0.0);
	float ggx2 = GeometrySchlickGGX(NdotV, roughness);
	float ggx1 = GeometrySchlickGGX(NdotL, roughness);

	return ggx1 * ggx2;
}

// ---------------------------------------------------------------------------- 

vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
	if(cosTheta > 1.0)
		cosTheta = 1.0;
	float p = pow(1.0 - cosTheta,5.0);
	return F0 + (1.0 - F0) * p;
}

// ---------------------------------------------------------------------------- 

float CalcAtt(float distance, float range, float a, float b)
{
	return 1.0 / (1.0 + a * distance + b * distance * distance);
}

// ---------------------------------------------------------------------------- 

vec2 ParallaxOcclusionMapping(vec2 texCoords, vec3 viewDir)
{
    // number of depth layers 
    float numLayers = mix(POmax, POmin, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)));
	
    // calculate the size of each layer 
    float layerDepth = 1.0 / numLayers;

    // depth of current layer 
    float currentLayerDepth = 0.0;

    // the amount to shift the texture coordinates per layer (from vector P) 
    vec2 P = viewDir.xy / viewDir.z * POscale * POmulti;
    vec2 deltaTexCoords = P / numLayers;

    // get initial values 
    vec2  currentTexCoords     = texCoords;
    float currentDepthMapValue = texture(bumpMap, currentTexCoords).r;

    //while(currentLayerDepth < currentDepthMapValue)
    for (int i = 0; i < 32; i++)
    {
        if (currentLayerDepth >= currentDepthMapValue) break;

        // shift texture coordinates along direction of P 
        currentTexCoords -= deltaTexCoords;

        // get depthmap value at current texture coordinates 
        currentDepthMapValue = texture(bumpMap, currentTexCoords).r;

        // get depth of next layer 
        currentLayerDepth += layerDepth; 
    }

    // get texture coordinates before collision (reverse operations) 
    vec2 prevTexCoords = currentTexCoords + deltaTexCoords;

    // get depth after and before collision for linear interpolation 
    float afterDepth  = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = texture(bumpMap, prevTexCoords).r - currentLayerDepth + layerDepth;

    // interpolation of texture coordinates 
    float weight = afterDepth / (afterDepth - beforeDepth);
    vec2 finalTexCoords = prevTexCoords * weight + currentTexCoords * (1.0 - weight);

    return finalTexCoords;
}

// ---------------------------------------------------------------------------- 

mat3 computeTBN(vec2 tempUv, vec3 worldPos, vec3 worldNormal)
{

    vec3 Q1  = dFdx(worldPos);
    vec3 Q2  = dFdy(worldPos);
    vec2 st1 = dFdx(tempUv);
    vec2 st2 = dFdy(tempUv);

	// normal and tangent 
    vec3 n   = normalize(worldNormal);
    vec3 t  = normalize(Q1*st2.t - Q2*st1.t);

    // bitangent 
    vec3 b = normalize(-Q1*st2.s + Q2*st1.s);

    return mat3(t, b, n);
}


// ---------------------------------------------------------------------------- 

void main(void) {
	// Texture coordinates 
	vec2 ts=texscale;
	vec2 uv = Vertex_UV;
	uv = (uv * ts) + texoffset;
	
	// TBN Matrix 
	vec3 VV = -Vertex_Position.xyz;
	vec3 VVN = normalize(VV);
	vec3 N = Vertex_Normal.xyz;
	vec3 VN = normalize(Vertex_Normal);
	mat3 TBN = computeTBN(uv.st,-VV,Vertex_Normal);
	
	// Parallax Occlusion Mapping 
	if(flagPM > 0)
	{
		uv = ParallaxOcclusionMapping(uv, normalize(-VV * TBN));
	}	

	// Albedo Texture (sRGB, with gamma correction) 
	vec4 albedo = vec4(0.5, 0.5, 0.5, 1.0);
	if(texAL > 0)
	{
		albedo = texture(albedoMap, uv);
		albedo.rgb = pow(albedo.rgb, vec3(2.2));
	}

	// Normalmap Texture 
	vec3 nrm = Vertex_Normal;
	if(texNM > 0)
	{
		nrm = texture(normalMap, uv).rgb;
	}
		
	// 3. Perturbated Normals 
	vec3 PN = N;
	if(texNM > 0)
	{
		PN = perturb_normal(VN, VVN, nrm, uv);
	}	

	// PBR Texture 
	float ao = 1.0;
	float roughness = 0.5;
	float metallic = 0.5;
	if(texOC > 0)
	{
		ao = texture(occlusionMap, uv).r;
	}
	if(texRO > 0)
	{
		roughness = texture(roughnessMap, uv).r;
	}
	if(texME > 0)
	{
		metallic = texture(metallicMap, uv).r;
	}
				
	// Emissive 
	vec3 emission = vec3(0.0);
	if(texEM > 0 && flagEM > 0)
	{
		emission = texture(emissionMap, uv).rgb * (1.0+cos(float(timer)/30.0));
	}

	// Ambient 
	vec3 ambient = ambientlight * albedo.rgb;

	// PBR Lighting 
	vec3 Lo = vec3(0.0);
	vec3 irradiance;
	vec3 diffuse=albedo.rgb;
	
	// Reflection 
	vec3 NormalizedRSTVD = normalize(Vertex_Surface_to_Viewer_Direction);

	if(flagPB > 0)
	{
		// calculate reflectance at normal incidence; if dia-electric (like plastic) use F0  
		// of 0.04 and if it's a metal, use the albedo color as F0 (metallic workflow)     
		vec3 F0 = vec3(0.04);
		F0 = mix(F0, albedo.rgb, metallic);
		
		for(int i = 0; i < NUM_LIGHTS; ++i) 
		{
			// calculate per-light radiance 
			vec3 L = normalize(lightpos[i].xyz - Vertex_Position.xyz);
			vec3 H = normalize(VVN + L);
			
			float distance = length(L);
			float attenuation = CalcAtt(distance, lightradius[i], A, B);
			vec3 radiance = lightcolor[i] * attenuation;
			
			// Cook-Torrance BRDF 
			float NDF = DistributionGGX(PN, H, roughness);
			float G = GeometrySmith(PN, VVN, L, roughness);
			vec3 F = fresnelSchlick(max(dot(H, VVN), 0.0), F0);
	           
			// specularity 
			vec3 nominator = NDF * G * F;
			float denominator = 4.0 * max(dot(PN, VVN), 0.0) * max(dot(PN, L), 0.0) + 0.001;
			vec3 specular = nominator / denominator;
			
			// kS is equal to Fresnel 
			vec3 kS = F;

			// for energy conservation, the diffuse and specular light can't 
			// be above 1.0 (unless the surface emits light); to preserve this 
			// relationship the diffuse component (kD) should equal 1.0 - kS. 
			vec3 kD = vec3(1.0) - kS;

			// multiply kD by the inverse metalness such that only non-metals  
			// have diffuse lighting, or a linear blend if partly metal (pure metals 
			// have no diffuse light). 
			kD *= 1.0-metallic;
				
			// Metallic Reflection 
			if(isMetal==1 && flagEN==1 && setENV==1)
			{
				vec3 v=NormalizedRSTVD;
				irradiance = texture(envMap, vec3(-v.x,v.y,-v.z)).rgb;
				diffuse = (albedo.rgb * (0.0 + (irradiance * 1.0)));
			}
							
			// check backface lighting 
			float NdotL = max(dot(PN, L), 0.0);
			
			// sum all together:  
			Lo += (kD * diffuse.rgb / PI + specular) * lightradius[i] * radiance * NdotL;
		}
	}
	// PBR off 
	else
	{
		for(int i = 0; i < NUM_LIGHTS; ++i) 
		{
			vec3 L = normalize(lightpos[i].xyz - Vertex_Position.xyz);
			//vec3 N = Vertex_Normal.xyz; 

			float distance = length(L);
			float attenuation = CalcAtt(distance, lightradius[i], A, B);
			vec3 radiance = lightcolor[i] * attenuation;		
			
			float NdotL = max(dot(N, L), 0.0);
			Lo += (diffuse.rgb / PI) * lightradius[i] * radiance * NdotL;
		}
	}

	// mix final lighting with ambient 
	vec3 color=(Lo+ambient);
		
	// Ambient Occlusion 
	color *= ao;
	
	// Tonemapping 
	if(flagTM == 1){color = ToneMapPBR(color);}
	if(flagTM == 2){color = ToneMapExposure(color);}
	if(flagTM == 3){color = ToneMapSCurve(color);}
	if(flagTM == 4){color = ToneMapUncharted(color);}
	if(flagTM == 5){color = ToneMapFilmic(color);}
	
	// Final olor plus Emissive with Alpha 
	fragmentColor = vec4(color+emission, albedo.a);

}
