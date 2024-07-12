	const canvas = document.querySelector("#glCanvas");
	GLctx = canvas.getContext("webgl");
	EnvCubeTexture=0;

	const UseFloat = Module.cwrap('UseFloat', null, ['number', 'string', 'number']);
	const UseFloat2 = Module.cwrap('UseFloat2', null, ['number', 'string', 'number', 'number']);
	const UseFloat3 = Module.cwrap('UseFloat3', null, ['number', 'string', 'number', 'number', 'number']);
	const UseFloat4 = Module.cwrap('UseFloat4', null, ['number', 'string', 'number', 'number', 'number', 'number']);
	const UseInteger = Module.cwrap('UseInteger', null, ['number', 'string', 'number']);
	const UseInteger2 = Module.cwrap('UseInteger2', null, ['number', 'string', 'number', 'number']);
	const UseInteger3 = Module.cwrap('UseInteger3', null, ['number', 'string', 'number', 'number', 'number']);
	const UseInteger4 = Module.cwrap('UseInteger4', null, ['number', 'string', 'number', 'number', 'number', 'number']);


function LoadPBRTexture(BaseColor, Normals, Heights, Roughness, Metallic, AO, Emissive){
	let PBRTexture = {
		basecolor:0, 
		normals:0,
		heights:0,
		roughness:0,
		metallic:0,
		ao:0,
		emissive:0
	}
	let tex=Object.create(PBRTexture);

	if(Boolean(BaseColor)) tex.basecolor=CreateTexture(1,1,1,1);
	if(Boolean(Normals)) tex.normals=CreateTexture(1,1,1,1);
	if(Boolean(Heights)) tex.heights=CreateTexture(1,1,1,1);
	if(Boolean(Roughness)) tex.roughness=CreateTexture(1,1,1,1);
	if(Boolean(Metallic)) tex.metallic=CreateTexture(1,1,1,1);
	if(Boolean(AO)) tex.ao=CreateTexture(1,1,1,1);
	if(Boolean(Emissive)) tex.emissive=CreateTexture(1,1,1,1);

	if (tex.basecolor) {
		imageAL = new Image();
		imageAL.addEventListener("load", () => {
			GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[getValue(tex.basecolor,"i32")]);
			GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, imageAL);
			GLctx.generateMipmap(GLctx.TEXTURE_2D);

			});
		imageAL.src = BaseColor;
	}

	if (tex.normals) {
		imageNM = new Image();
		imageNM.addEventListener("load", () => {
			GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[getValue(tex.normals,"i32")]);
			GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, imageNM);
			GLctx.generateMipmap(GLctx.TEXTURE_2D);

			});
		imageNM.src = Normals;
	}

	if (tex.heights) {
		imageBM = new Image();
		imageBM.addEventListener("load", () => {
			GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[getValue(tex.heights,"i32")]);
			GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.LUMINANCE, GLctx.LUMINANCE, GLctx.UNSIGNED_BYTE, imageBM);
			GLctx.generateMipmap(GLctx.TEXTURE_2D);

			});
		imageBM.src = Heights;
	}

	if (tex.roughness) {
		imageRO = new Image();
		imageRO.addEventListener("load", () => {
			GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[getValue(tex.roughness,"i32")]);
			GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.LUMINANCE, GLctx.LUMINANCE, GLctx.UNSIGNED_BYTE, imageRO);
			GLctx.generateMipmap(GLctx.TEXTURE_2D);

			});
		imageRO.src = Roughness;
	}

	if (tex.metallic) {
		imageME = new Image();
		imageME.addEventListener("load", () => {
			GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[getValue(tex.metallic,"i32")]);
			GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.LUMINANCE, GLctx.LUMINANCE, GLctx.UNSIGNED_BYTE, imageME);
			GLctx.generateMipmap(GLctx.TEXTURE_2D);

			});
		imageME.src = Metallic;
	}

	if (tex.ao) {
		imageOC = new Image();
		imageOC.addEventListener("load", () => {
			GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[getValue(tex.ao,"i32")]);
			GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.LUMINANCE, GLctx.LUMINANCE, GLctx.UNSIGNED_BYTE, imageOC);
			GLctx.generateMipmap(GLctx.TEXTURE_2D);

			});
		imageOC.src = AO;
	}

	if (tex.emissive) {
		imageEM = new Image();
		imageEM.addEventListener("load", () => {
			GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[getValue(tex.emissive,"i32")]);
			GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, imageEM);
			GLctx.generateMipmap(GLctx.TEXTURE_2D);

			});
		imageEM.src = Emissive;
	}

	return tex;
}

function AmbientCubeTexture(tex){
	EnvCubeTexture=tex;
}

function EntityPBRTexture(ent, tex){
	EntityTexture (ent, tex.basecolor,0,0);
	EntityTexture (ent, tex.normals,0,1);
	EntityTexture (ent, tex.heights,0,2);
	EntityTexture (ent, tex.ao,0,3);
	EntityTexture (ent, tex.roughness,0,4);
	EntityTexture (ent, tex.metallic,0,5);
	EntityTexture (ent, tex.emissive,0,6);
	if(Boolean(EnvCubeTexture)) {EntityTexture (ent, EnvCubeTexture,0,7);}
}


function CreatePBR(tex, callback){
	AsyncLoadShader("PBR", "PBR1.vert", "PBR1.frag", (shader)=>{
		UseSurface (shader,"position",0,1);
		UseSurface (shader,"multitexcoord",0,2);
		UseSurface (shader,"normal",0,4);
		UseMatrix (shader,"projection",2);
		UseMatrix (shader,"view",1);
		UseMatrix (shader,"model",0);

		if(Boolean(tex)){
			if(Boolean(tex.basecolor)){
				ShaderTexture(shader,tex.basecolor, "albedoMap",0);
				SetInteger(shader, "texAL",1);
			}else{
				SetInteger(shader, "texAL",0);
			}

			if(Boolean(tex.normals)){
				ShaderTexture(shader,tex.normals, "normalMap",1);
				SetInteger(shader, "texNM",1);
			}else{
				SetInteger(shader, "texNM",0);
			}

			if(Boolean(tex.heights)){
				ShaderTexture(shader,tex.heights, "bumpMap",2);
				SetInteger(shader, "texBM",1);
			}else{
				SetInteger(shader, "texBM",0);
			}

			if(Boolean(tex.ao)){
				ShaderTexture(shader,tex.ao, "occlusionMap",3);
				SetInteger(shader, "texOC",1);
			}else{
				SetInteger(shader, "texOC",0);
			}

			if(Boolean(tex.roughness)){
				ShaderTexture(shader,tex.roughness, "roughnessMap",4);
				SetInteger(shader, "texRO",1);
			}else{
				SetInteger(shader, "texRO",0);
			}

			if(Boolean(tex.metallic)){
				ShaderTexture(shader,tex.metallic, "metallicMap",5);
				SetInteger(shader, "texME",1);
			}else{
				SetInteger(shader, "texME",0);
			}

			if(Boolean(tex.emissive)){
				ShaderTexture(shader,tex.emissive, "emissionMap",5);
				SetInteger(shader, "texEM",1);
			}else{
				SetInteger(shader, "texEM",0);
			}


			SetInteger(shader, "envMap",7);
			SetInteger(shader, "setENV",0);

			SetInteger(shader, "texOC",1);
			//SetInteger(shader, "texME",1);
		}else{
			SetInteger(shader,"albedoMap",0);
			SetInteger(shader,"texAL",1);
			SetInteger(shader,"normalMap",1);
			SetInteger(shader,"texNM",1);
			SetInteger(shader,"bumpMap",2);
			SetInteger(shader,"texBM",1);
			SetInteger(shader,"occlusionMap",3);
			SetInteger(shader,"texOC",1);
			SetInteger(shader,"roughnessMap",4);
			SetInteger(shader,"texRO",1);
			SetInteger(shader,"metallicMap",5);
			SetInteger(shader,"texME",1);
			SetInteger(shader,"emissionMap",6);
			SetInteger(shader,"texEM",1);
			SetInteger(shader,"envMap",7);
		}

		SetFloat2(shader, "texscale", 1,1);
		SetFloat2(shader, "texoffset", 0,0);
		SetFloat(shader, "levelscale", 128);
		SetFloat(shader, "POmulti", 1);
		SetFloat(shader, "gamma", 1);


		SetFloat(shader, "lightradius[0]", 10);
		UseFloat3(shader, "ambientlight", __ZN6Global11ambient_redE,__ZN6Global13ambient_greenE, __ZN6Global12ambient_blueE);

		var LP=__ZN5Light14light_matricesE  
		UseFloat3(shader, "lightpos[0]", LP+4*12,LP+4*13, LP+4*14);
		LP+=64;
		UseFloat3(shader, "lightpos[1]", LP+4*12,LP+4*13, LP+4*14);
		LP+=64;
		UseFloat3(shader, "lightpos[2]", LP+4*12,LP+4*13, LP+4*14);
		LP+=64;
		UseFloat3(shader, "lightpos[3]", LP+4*12,LP+4*13, LP+4*14);
		LP+=64;
		UseFloat3(shader, "lightpos[4]", LP+4*12,LP+4*13, LP+4*14);
		LP+=64;
		UseFloat3(shader, "lightpos[5]", LP+4*12,LP+4*13, LP+4*14);
		LP+=64;
		UseFloat3(shader, "lightpos[6]", LP+4*12,LP+4*13, LP+4*14);
		LP+=64;
		UseFloat3(shader, "lightpos[7]", LP+4*12,LP+4*13, LP+4*14);
		LP+=64;

		var LCP=__ZN5Light11light_colorE;
		UseFloat3(shader, "lightcolor[0]", LCP,LCP+4, LCP+8);
		LCP+=12;
		UseFloat3(shader, "lightcolor[1]", LCP,LCP+4, LCP+8);
		LCP+=12;
		UseFloat3(shader, "lightcolor[2]", LCP,LCP+4, LCP+8);
		LCP+=12;
		UseFloat3(shader, "lightcolor[3]", LCP,LCP+4, LCP+8);
		LCP+=12;
		UseFloat3(shader, "lightcolor[4]", LCP,LCP+4, LCP+8);
		LCP+=12;
		UseFloat3(shader, "lightcolor[5]", LCP,LCP+4, LCP+8);
		LCP+=12;
		UseFloat3(shader, "lightcolor[6]", LCP,LCP+4, LCP+8);
		LCP+=12;
		UseFloat3(shader, "lightcolor[7]", LCP,LCP+4, LCP+8);
		LCP+=12;

		callback(shader);

	})
}

GLctx.getExtension("OES_standard_derivatives");
