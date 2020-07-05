const trajectory = require("trajectory");
var draw_content = null;
var enc = null;
var dec = null;


async function start() {
    console.log("start");

    if (draw_content != null){
        clearInterval(draw_content);
    }

    // Load models
    if (enc == null) {
        console.log("encoder loading...")
        enc = await tf.loadModel('../result/enc/model.json');
    }
    if (dec == null) {
        console.log("decoder loading...")
        dec = await tf.loadModel('../result/dec/model.json');
    }

    // Generate an input traectory
    const N = 20;
    const X_in = trajectory.generate_trajectory(N);
    console.log(X_in);

    // Convert the trajectory
    const z = encode(enc, X_in);
    const X_out = decode(dec, z, X_in[0], X_in.length);
    console.log(X_out);

    // Draw the trajectories
    draw(X_in, X_out);

    console.log("finished");
}


function encode(enc, X) {
    // Convert the trajectory to a tensor
    let X_tensor = tf.tensor(X);
    X_tensor = X_tensor.reshape([1, X.length, 3]);

    let z = enc.predict(X_tensor);

    return z;
}


function decode(dec, z, y0, length) {
    let Y = [];

    let y = y0;
    y = tf.tensor(y);
    y = y.reshape([1, 3]);
    Y.push(y);

    let dec_in = 0;
    for (i=0; i<length-1; i++) {
        dec_in = tf.concat([y, z], 1);
        dec_in = dec_in.reshape([1, 1, dec_in.shape[1]]);
        y = dec.predict(dec_in)
        Y.push(Array.from(y.dataSync()));
    }

    return Y;
}


function draw(X_in, X_out) {
    console.log("animation starts.");
    t = 0;

    // Load a canvas.
    let canvas = document.getElementById('screen');
    if (!canvas || !canvas.getContext) {
        return false;
    }

    draw_content = setInterval(render, 50, canvas, X_in, X_out);

    console.log("animation finished.");
}


let t = 0;
function render(canvas, X_in, X_out) {
    let ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Setup canvas positional parameters
    const ppm = 200;
    const px0 = canvas.width  / 2.0;
    const py0 = canvas.height / 2.0;

    // Draw original motion
    let sp_x_enc  =  X_in[X_in.length-1][0];
    let sp_y_enc  = -X_in[X_in.length-1][1];
    let sp_th_enc = -X_in[X_in.length-1][2];
    if (t < X_in.length) {
        sp_x_enc  =  X_in[t][0];
        sp_y_enc  = -X_in[t][1];
        sp_th_enc = -X_in[t][2];
    }

    let px = sp_x_enc * ppm;
    let py = sp_y_enc * ppm;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(px+px0, py+py0);
    ctx.rotate(sp_th_enc);
    ctx.fillStyle = "rgba(200, 0, 0, 0.8)";
    ctx.fillRect(-30, -5, 60, 10);

    // Draw original motion
    let sp_x_dec  =  X_out[X_out.length-1][0];
    let sp_y_dec  = -X_out[X_out.length-1][1];
    let sp_th_dec = -X_out[X_out.length-1][2];
    if (t < X_out.length) {
        sp_x_dec  =  X_out[t][0];
        sp_y_dec  = -X_out[t][1];
        sp_th_dec = -X_out[t][2];
    }

    px = sp_x_dec * ppm;
    py = sp_y_dec * ppm;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(px+px0, py+py0);
    ctx.rotate(sp_th_dec);
    ctx.fillStyle = "rgba(0, 0, 200, 0.8)";
    ctx.fillRect(-30, -5, 60, 10);

    t += 1;
}
