import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const volume = 1.0;

const createAudioElement = (src, volume, isBounce = false) => {
    return new Promise(resolve => {
        const audio = new Audio();
        audio.src = src;
        audio.preload = 'auto';
        audio.volume = volume;

        const onCanPlayThrough = () => {
            audio.removeEventListener('canplaythrough', onCanPlayThrough);
            audio.removeEventListener('error', onError);
            if (isBounce) {
                //console.log('✅ Loaded bounce sound:', src); // Log only if needed, can be noisy
            }
            resolve(audio);
        };

        const onError = (e) => {
            audio.removeEventListener('canplaythrough', onCanPlayThrough); // Clean up
            audio.removeEventListener('error', onError); // Clean up
            console.warn('❌ Failed to load sound:', src, e);
            resolve(null); // Resolve with null to avoid rejecting the whole batch
        };

        audio.addEventListener('canplaythrough', onCanPlayThrough, { once: true });
        audio.addEventListener('error', onError, { once: true });
        audio.load();
    });
}

export const loadRandomSounds = async () => {
    const soundFiles = [
        '0.wav', '1.wav', '2.wav', '3.wav', '4.wav', '5.wav', '6.wav', '7.wav', '8.wav', '9.wav',
        '10.wav', '11.wav', '12.wav', '13.wav', '14.wav', '15.wav', '16.wav', '17.wav', '18.wav', '19.wav',
        '20.wav', '55.wav', '69.wav', '76.wav', '87.wav', '99.wav', '108.wav', '124.wav', '132.wav',
        '141.wav', '149.wav', '155.wav', '164.wav', '170.wav', '177.wav', '184.wav', '193.wav', '199.wav',
        '206.wav', '220.wav', '229.wav', '249.wav', '257.wav', '268.wav', '279.wav'
    ];

    console.log('🔊 Starting to load all Random Mode sounds...');
    try {
        let randomSounds = await Promise.all(
            soundFiles.map(file => createAudioElement(`./audio/RND/${file}`, volume))
        );
        randomSounds = randomSounds.filter(Boolean);
        console.log('✅ Loaded', randomSounds.length, 'Random Mode sounds');
        return randomSounds;
    } catch (e) {
        console.warn('❌ loadRandomSounds failed to load one or more sounds:', e);
        return [];
    }
}

export const loadBallSounds = async () => {
    const ballSoundFiles = ['1.wav', '2.wav', '3.wav', '4.wav', '5.wav'];

    console.log('🔊 Starting to load all ball sounds...');
    try {
        let ballSounds = await Promise.all(
            ballSoundFiles.map(file => createAudioElement(`./audio/bounces/${file}`, volume * 0.4, true))
        );
        ballSounds = ballSounds.filter(Boolean);
        console.log('✅ Loaded', ballSounds.length, 'ball sounds');
        return ballSounds;
    } catch (e) {
        console.warn('❌ loadBallSounds failed to load one or more sounds:', e);
        return [];
    }
}
export const loadCategorySounds = async (categoryFolder, categoryFiles) => {
    let categorySounds = await Promise.all(
        categoryFiles.map(file => createAudioElement(`./audio/category_sounds/${categoryFolder}/${file}`, volume))
    );
    categorySounds = categorySounds.filter(Boolean);
    console.log('✅ Loaded', categorySounds.length, 'categorySounds ');
    return categorySounds;
}

export const loadLongPressSound = async () => {
    const soundPath = './audio/chg1.wav';
    console.log('🔊 Starting to load long press feedback sound...');
    let longPressSound = await createAudioElement(soundPath, volume * 0.7);
    if (longPressSound) {
        longPressSound.loop = true;
        console.log('✅ Loaded long press feedback sound');
    } else {
        console.warn('❌ Long press feedback sound failed to load!');
    }
    return longPressSound;
}
export const loadModel = (url = '/models/scene.glb') => {
    return new Promise((resolve, reject) => {
      const glbLoader = new GLTFLoader();
  
      glbLoader.load(
        url,
        (gltf) => {
          console.log('✅ GLB model loaded');
          resolve(gltf);
        },
        undefined,
        (error) => {
          console.error('❌ Failed to load GLB model:', error);
          reject(error);
        }
      );
    });
}

export const loadCategoriesMapping = async (jsonUrl = './audio/category_sounds.json') => {
    try {
        const response = await fetch(jsonUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('❌ Error loading random category:', error);
        return null;
    }
}
