import {PointLight, SpotLight, LightShadow, PerspectiveCamera} from 'three';

const SHADOW_MAP_WIDTH = 2048;
const SHADOW_MAP_HEIGHT = 1024;

export function CreatePointLight() {
		let light = new SpotLight( 0xffffff, 1, 0, Math.PI / 2 );
		//light.position.set( 800, 1500, 1300 );
		light.position.set( 800, 800, 800 );
		light.target.position.set( 0, 0, 0 );
		light.castShadow = true;
		light.shadow = new LightShadow( new PerspectiveCamera( 20, 1, 1200, 4500 ) );
		light.shadow.bias = 0.00001;
		light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
		light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    return light;
}


