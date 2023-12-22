	const AudioContext = window.AudioContext || window.webkitAudioContext;
	const audioCtx = new AudioContext();
	var audio_listener;
	let Source3D_Emits=[];

	function Load3DSound(filename){
		var audio = new Audio(filename);
		return audio;
	}

	function CreateListener(entity, rolloff_factor=1, doppler_scale=1, attenuation=1){
		let Listener3d = {
			ent: 0,
			atDummy: 0,
			upDummy: 0,
			listener: 0,
			rolloff_factor: 1,
			doppler_scale: 1,
			attenuation: 1,
			Update: function() {
				px = EntityX(this.ent,1);
				py = EntityY(this.ent,1);
				pz = EntityZ(this.ent,1);
				if (this.listener.positionX){
					this.listener.positionX.value = px;
					this.listener.positionY.value = py;
					this.listener.positionZ.value = pz;
				}else{
					this.listener.setPosition(px,py,pz);
				}

				atx = px-EntityX(this.atDummy,true);
				aty = py-EntityY(this.atDummy,true);
				atz = pz-EntityZ(this.atDummy,true);
				upx = px-EntityX(this.upDummy,true);
				upy = py-EntityY(this.upDummy,true);
				upz = pz-EntityZ(this.upDummy,true);
				if (this.listener.forwardX){
					this.listener.forwardX.value = atx;
					this.listener.forwardY.value = aty;
					this.listener.forwardZ.value = atz;
					this.listener.upX.value = upx;
					this.listener.upY.value = upy;
					this.listener.upZ.value = upz;
				}else{
					this.listener.setOrientation(atx,aty,atz,upx,upy,upz);
				}

				}
			}
		let new_listener=Object.create(Listener3d);

		new_listener.ent=entity;
		new_listener.atDummy=CreatePivot(0);
		new_listener.upDummy=CreatePivot(0);
		EntityParent(new_listener.atDummy , new_listener.ent);
		EntityParent(new_listener.upDummy,new_listener.ent);
		PositionEntity(new_listener.atDummy , 0 , 0 ,-1);
		PositionEntity(new_listener.upDummy , 0 , 1 , 0);


		new_listener.listener = audioCtx.listener;
		new_listener.rolloff_factor = rolloff_factor;
		new_listener.doppler_scale = doppler_scale;
		new_listener.attenuation = attenuation;
		new_listener.Update();
		audio_listener=new_listener;
		return new_listener;
	}

	function EmitSound(sound , entity, loop=0){
		let Source3d = {
			ent: 0,
			panner: 0,
			Update: function() {
				this.panner.positionX.value = EntityX(this.ent,1);
				this.panner.positionY.value = EntityY(this.ent,1);
				this.panner.positionZ.value = EntityZ(this.ent,1);
			}
			}
		let new_source=Object.create(Source3d);
		let new_sound=sound.cloneNode();

		new_source.ent=entity;
		new_source.panner = new PannerNode(audioCtx, {
					panningModel: "HRTF",
					distanceModel: "inverse",
					refDistance: 1,
					maxDistance: 20_000,
					rolloffFactor: 1
				});
		new_source.Update();

		new_source.panner.rolloffFactor=audio_listener.rolloff_factor;

		track = new MediaElementAudioSourceNode(audioCtx, {
			mediaElement: new_sound,
		});
		track.connect(new_source.panner).connect(audioCtx.destination);

		new_sound.onended = () => {
			track.disconnect();
			const x=Source3D_Emits.splice(Source3D_Emits.indexOf(new_source),1);
		};

		new_sound.play();

		Source3D_Emits.push(new_source);
		//return new_source;

	}

	function RenderAudio(){
		if (audio_listener) audio_listener.Update();
		Source3D_Emits.forEach((element) => element.Update());
	}
