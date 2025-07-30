export const createSettings = () => {
    //size in meters
    let width = 10;
    let depth = 20;
    let height = 5;
    let tableWidth = 1.5;

    let settings = {
        debug: false,
        wallMode: true,
        width: width,
        height: height,
        depth: depth,
        table: {
            model: "models/table.glb",
            width: tableWidth,
        },

        audio: {
            ball: ["audio/ball1.ogg", "audio/ball2.ogg"]
        },

        mobile: {
            enabled: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            touchSensitivity: 0.8,
            objectScale: 1.6
        }
    };

    return settings;
}
