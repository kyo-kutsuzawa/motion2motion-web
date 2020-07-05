var bspline = require('b-spline');


const dT = 0.001;

const A = [[1.0, 0.0, 0.0,  dT, 0.0, 0.0],
           [0.0, 1.0, 0.0, 0.0,  dT, 0.0],
           [0.0, 0.0, 1.0, 0.0, 0.0,  dT],
           [0.0, 0.0, 0.0, 1.0, 0.0, 0.0],
           [0.0, 0.0, 0.0, 0.0, 1.0, 0.0],
           [0.0, 0.0, 0.0, 0.0, 0.0, 1.0]];

const B = [[dT*dT*0.5,       0.0,       0.0],
           [      0.0, dT*dT*0.5,       0.0],
           [      0.0,       0.0, dT*dT*0.5],
           [       dT,       0.0,       0.0],
           [      0.0,        dT,       0.0],
           [      0.0,       0.0,        dT]];


function generate_trajectory_test(N) {
    // Generate control points
    let cp = new Array();
    let c;
    for (i=0; i<4; i++) {
        c = new Array(3);
        c[0] = (Math.random() - 0.5) * 2;
        c[1] = (Math.random() - 0.5) * 2;
        c[2] = (Math.random() - 0.5) * 2;
        cp.push(c)
    }

    const degree = 2;
    const delta = 1.0 / N;

    // Generate a B-spline curve of acceleration inputs
    let X = [];
    let x0 = bspline(0, degree, cp);
    let x = 0;
    for (let t=0; t<1; t+=1/N) {
        x = bspline(t, degree, cp);
        for (i=0; i<3; i++) {
            x[i] -= x[0];
        }
        X.push(x);
    }

    return X;
}
        
        
function generate_trajectory(N) {
    // Generate control points
    let cp = new Array();
    let c;
    for (i=0; i<4; i++) {
        c = new Array(3);
        c[0] = (Math.random() - 0.5) * 10;
        c[1] = (Math.random() - 0.5) * 10;
        c[2] = (Math.random() - 0.5) * 10;
        cp.push(c)
    }

    const degree = 2;
    const delta = 1.0 / N;

    // Generate a B-spline curve of acceleration inputs
    let U = [];
    let u = 0;
    for (let t=0; t<1; t+=delta) {
        u = bspline(t, degree, cp);
        U.push(u);
    }

    // Calculate a state trajectory
    let X = [];
    let x = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    for (let i=0; i<U.length; i++) {
        X.push(x);
        u = U[i];
        x = state_equation(x, u);
    }

    return X;
}


function state_equation(x, u) {
    let y = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

    for (let i=0; i<6; i++) {
        y[i] = 0.0;

        for (let j=0; j<6; j++) {
            y[i] += A[i][j] * x[j];
        }
        for (let j=0; j<3; j++) {
            y[i] += B[i][j] * u[j];
        }
    }
    return y;
}


exports.generate_trajectory = generate_trajectory_test;
