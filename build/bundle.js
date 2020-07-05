require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){


function interpolate(t, degree, points, knots, weights, result) {

  var i,j,s,l;              // function-scoped iteration variables
  var n = points.length;    // points count
  var d = points[0].length; // point dimensionality

  if(degree < 1) throw new Error('degree must be at least 1 (linear)');
  if(degree > (n-1)) throw new Error('degree must be less than or equal to point count - 1');

  if(!weights) {
    // build weight vector of length [n]
    weights = [];
    for(i=0; i<n; i++) {
      weights[i] = 1;
    }
  }

  if(!knots) {
    // build knot vector of length [n + degree + 1]
    var knots = [];
    for(i=0; i<n+degree+1; i++) {
      knots[i] = i;
    }
  } else {
    if(knots.length !== n+degree+1) throw new Error('bad knot vector length');
  }

  var domain = [
    degree,
    knots.length-1 - degree
  ];

  // remap t to the domain where the spline is defined
  var low  = knots[domain[0]];
  var high = knots[domain[1]];
  t = t * (high - low) + low;

  if(t < low || t > high) throw new Error('out of bounds');

  // find s (the spline segment) for the [t] value provided
  for(s=domain[0]; s<domain[1]; s++) {
    if(t >= knots[s] && t <= knots[s+1]) {
      break;
    }
  }

  // convert points to homogeneous coordinates
  var v = [];
  for(i=0; i<n; i++) {
    v[i] = [];
    for(j=0; j<d; j++) {
      v[i][j] = points[i][j] * weights[i];
    }
    v[i][d] = weights[i];
  }

  // l (level) goes from 1 to the curve degree + 1
  var alpha;
  for(l=1; l<=degree+1; l++) {
    // build level l of the pyramid
    for(i=s; i>s-degree-1+l; i--) {
      alpha = (t - knots[i]) / (knots[i+degree+1-l] - knots[i]);

      // interpolate each component
      for(j=0; j<d+1; j++) {
        v[i][j] = (1 - alpha) * v[i-1][j] + alpha * v[i][j];
      }
    }
  }

  // convert back to cartesian and return
  var result = result || [];
  for(i=0; i<d; i++) {
    result[i] = v[s][i] / v[s][d];
  }

  return result;
}


module.exports = interpolate;

},{}],"trajectory":[function(require,module,exports){
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

},{"b-spline":1}]},{},[]);
