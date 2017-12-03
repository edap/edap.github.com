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

export const materials = [materialTrunk, materialFoliage];
