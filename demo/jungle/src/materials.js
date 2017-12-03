import * as THREE from 'THREE';

const materialTrunk = new THREE.MeshStandardMaterial({
	color: 0xffffff,
	emissive: 0x000000,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: THREE.NoColors
});

const materialFoliage = new THREE.MeshStandardMaterial({
	color: 0xffffff,
	emissive: 0x000000,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: THREE.NoColors
});

const materialTrunkB = new THREE.MeshStandardMaterial({
	color: 0x00ffe1,
	emissive: 0x00192a,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: THREE.NoColors
});

const materialFoliageB = new THREE.MeshStandardMaterial({
	color: 0xf1db174,
	emissive: 0x370013,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: THREE.NoColors
});

const materialTrunkC = new THREE.MeshStandardMaterial({
	color: 0xff00a5,
	emissive: 0x0f4129,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: THREE.NoColors
});

const materialFoliageC = new THREE.MeshStandardMaterial({
	color: 0x0077ff,
	emissive: 0xe84444,
	roughness: 0.55,
	metalness: 0.89,
	vertexColors: THREE.NoColors
});

export const materials = [materialTrunk, materialFoliage, materialTrunkB, materialFoliageB, materialTrunkC, materialFoliageC];
export function makeMaterialBrighter(material, inc){
	const color = material.color;
	const emissive = material.emissive;
	if (color.r < 1){
		color.r += inc;
	}
	if (color.g < 1){
		color.g += inc;
	}
	if (color.b < 1){
		color.b += inc;
	}

	if (emissive.r < 1){
		emissive.r += inc;
	}
	if (emissive.g < 1){
		emissive.g += inc;
	}
	if (emissive.b < 1){
		emissive.b += inc;
	}
}
