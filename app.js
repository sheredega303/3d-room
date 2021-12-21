let gl;

let shaderProgram;

let mvMatrix = mat4.create();
let pMatrix = mat4.create();

let mouseDown = false;
let lastMouseX = null;
let lastMouseY = null;
let currentlyPressedKeys = {};
let pitch = 0;
let pitchRate = 0;
let yaw = 0;
let yawRate = 0;
let xPos = 0;
let yPos = 0;
let zPos = 0;
let speed = 0;
let lastTime = 0;
let joggingAngle = 0;
let rotationMatrix = mat4.create();
mat4.identity(rotationMatrix);

let roomVertexPositionBuffer;
let roomVertexColorBuffer;
let roomIndexBuffer;
let facetsIndexBuffer;
let squareVertexPositionBuffer;
let squareVertexColorBuffer;
let squareIndexBuffer;
let sphereVertexPositionBuffer;
let sphereVertexColorBuffer;
let sphereIndexBuffer;
let hexagonalVertexPositionBuffer;
let hexagonalVertexColorBuffer;
let hexagonalIndexBuffer;
let pyramidVertexPositionBuffer;
let pyramidVertexColorBuffer;
let pyramidIndexBuffer;

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function getShader(gl, id) {
    let shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    let str = "";
    let k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    let shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders() {
    let fragmentShader = getShader(gl, "shader-fs");
    let vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}
function handleMouseUp(event) {
    mouseDown = false;
}
function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}
function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}
function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }
    let newX = event.clientX;
    let newY = event.clientY;

    let deltaX = newX - lastMouseX
    let newRotationMatrix = mat4.create();
    mat4.identity(newRotationMatrix);
    mat4.rotate(newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);

    let deltaY = newY - lastMouseY;
    mat4.rotate(newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);

    mat4.multiply(newRotationMatrix, rotationMatrix, rotationMatrix);

    lastMouseX = newX
    lastMouseY = newY;
}
function handleKeys() {
    if (currentlyPressedKeys[33]) { // Page Up
        pitchRate = 0.1;
    } else if (currentlyPressedKeys[34]) { // Page Down
        pitchRate = -0.1;
    } else {
        pitchRate = 0;
    }
    if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) { // A или стрелочки
        yawRate = 0.1;
    } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) { // D или стрелочки
        yawRate = -0.1;
    } else {
        yawRate = 0;
    }
    if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) { // W или стрелоки
        speed = 0.003;
    } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) { // S или стрелочки
        speed = -0.003;
    } else {
        speed = 0;
    }
}

function initBuffers() {
    vertices =[
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0];

    indices = [0, 1, 1, 2, 2, 3, 3, 0, 0, 4, 4, 5, 5, 6, 6,7, 7,4, 1, 5, 2, 6, 3, 7];

    colors = [];
    for (let i=0; i < 8; i++) {
        if (i < 4) {
            colors = colors.concat([0.5, 0.5, 1.0, 1.0]);
        }
        else {
            colors = colors.concat([1, 0, 1, 1.0]);
        }
    }

    roomVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, roomVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    roomVertexPositionBuffer.itemSize = 3;
    roomVertexPositionBuffer.numItems = 8;

    roomIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, roomIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    roomIndexBuffer.numberOfItems = indices.length;

    roomVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, roomVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    roomVertexColorBuffer.itemSize = 4;
    roomVertexColorBuffer.numItems = 8;

    indices = [
        2, 3, 7,
        7, 6, 2,

        2, 1, 6,
        6, 5, 1,

        4, 5, 6,
        6, 7, 4]

    facetsIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, facetsIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    facetsIndexBuffer.numberOfItems = indices.length;

    vertices = [
        -0.2, -0.2, 0.2,
        -0.2, 0.2, 0.2,
        0.2, 0.2, 0.2,
        0.2, -0.2, 0.2,

        -0.2, -0.2, -0.2,
        -0.2, 0.2, -0.2,
        0.2, 0.2, -0.2,
        0.2, -0.2, -0.2
    ];

    indices = [
        0, 1, 2,
        2, 3, 0,

        0, 4, 7,
        7, 3, 0,

        0, 1, 5,
        5, 4, 0,

        2, 3, 7,
        7, 6, 2,

        2, 1, 6,
        6, 5, 1,

        4, 5, 6,
        6, 7, 4];

    colors = []
    for (let i=0; i < 8; i++) {
        if (i < 4) {
            colors = colors.concat([1, 0, 0, 1.0]);
        }
        else {
            colors = colors.concat([0, 0, 1, 1.0]);
        }
    }

    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 8;

    squareIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    squareIndexBuffer.numberOfItems = indices.length;

    squareVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    squareVertexColorBuffer.itemSize = 4;
    squareVertexColorBuffer.numItems = 8;

    let latitudeBands = 30;
    let longitudeBands = 30;
    radius = 0.2;

    vertices = [];
    for (let latNumber=0; latNumber <= latitudeBands; latNumber++) {
        let theta = latNumber * Math.PI / latitudeBands;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);
        for (let longNumber=0; longNumber <= longitudeBands; longNumber++) {
            let phi = longNumber * 2 * Math.PI / longitudeBands;
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);

            let x = cosPhi * sinTheta;
            let y = cosTheta;
            let z = sinPhi * sinTheta;

            vertices.push(radius * x);
            vertices.push(radius * y);
            vertices.push(radius * z);
        }
    }

    indices = [];
    for (let latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (let longNumber=0; longNumber < longitudeBands; longNumber++) {
            let first = (latNumber * (longitudeBands + 1)) + longNumber;
            let second = first + longitudeBands + 1;
            indices.push(first);
            indices.push(second);
            indices.push(first + 1);

            indices.push(second);
            indices.push(second + 1);
            indices.push(first + 1);
        }
    }

    colors = []
    for (let i=0; i < vertices.length / 3; i++) {
        colors = colors.concat([1, 1, 0, 1.0]);
    }

    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = vertices.length / 3;

    sphereIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    sphereIndexBuffer.itemSize = 1;
    sphereIndexBuffer.numItems = indices.length;

    sphereVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    sphereVertexColorBuffer.itemSize = 4;
    sphereVertexColorBuffer.numItems = indices.length;

    vertices = [
        -0.3, 0.6, 0.3, // 0
        0.3, 0.6, 0.3,
        0.6, 0.0, 0.3, // 2
        0.3, -0.6, 0.3,
        -0.3, -0.6, 0.3, // 4
        -0.6, 0.0, 0.3,

        0.0, 0.0, 0.3, // 6

        -0.3, 0.6, -0.3, // 7
        0.3, 0.6, -0.3,
        0.6, 0.0, -0.3, // 9
        0.3, -0.6, -0.3,
        -0.3, -0.6, -0.3, // 11
        -0.6, 0.0, -0.3,

        0.0, 0.0, -0.3];

    indices = [
        0, 1, 6,
        6, 1, 2,
        2, 3, 6,
        6, 3, 4,
        4, 5, 6,
        6, 0, 5,

        5, 11, 7,
        7, 0, 5,

        0, 7, 8,
        8, 1, 0,

        1, 8, 9,
        9, 2, 1,

        2, 9, 10,
        10, 3, 2,

        3, 10, 11,
        11, 4, 3,

        4, 11, 12,
        12, 5, 4,

        7, 8, 13,
        13, 8, 9,
        9, 10, 13,
        13, 10, 11,
        11, 12, 13,
        13, 7, 12];

    colors = [];
    for (let i=0; i < 14; i++) {
        if (i < 14 / 2) {
            colors = colors.concat([0, 1, 0, 1.0]);
        }
        else {
            colors = colors.concat([0.94, 0.90, 0.55, 1.0]);
        }
    }

    hexagonalVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hexagonalVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    hexagonalVertexPositionBuffer.itemSize = 3;
    hexagonalVertexPositionBuffer.numItems = 14;

    hexagonalIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hexagonalIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    hexagonalIndexBuffer.numItems = indices.length;

    hexagonalVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hexagonalVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    hexagonalVertexColorBuffer.itemSize = 4;
    hexagonalVertexColorBuffer.numItems = 14;

    vertices = [
        0.0, 0.0, 0.4,
        0.2, 0.2, 0.0,
        0.2, -0.2, 0.0,
        -0.2, 0.2, 0.0,
        -0.2, -0.2, 0.0];

    indices = [
        0, 1, 2,
        2, 4, 0,
        0, 4, 3,
        3, 1, 0,
        1, 3, 4,
        4, 2, 1];

    colors = [ ];
    for (let i=0; i < 6; i++) {
        colors = colors.concat([1, 0.65, 0, 1.0]);
    }

    pyramidVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,  pyramidVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    pyramidVertexPositionBuffer.itemSize = 3;
    pyramidVertexPositionBuffer.numItems = 5;

    pyramidIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,  pyramidIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    pyramidIndexBuffer.numItems = indices.length;

    pyramidVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,  pyramidVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    pyramidVertexColorBuffer.itemSize = 4;
    pyramidVertexColorBuffer.numItems = 5;
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);

    mat4.rotate(mvMatrix, degToRad(-pitch), [1, 0, 0]);
    mat4.rotate(mvMatrix, degToRad(-yaw), [0, 1, 0]);
    mat4.translate(mvMatrix, [-xPos, -yPos, -zPos]);

    mat4.translate(mvMatrix, [0.0, 0.0, -4.5]);
    mat4.multiply(mvMatrix, rotationMatrix);
    mat4.rotate(mvMatrix, 4.71239 , [1, 0, 0]);
    setMatrixUniforms();

    gl.bindBuffer(gl.ARRAY_BUFFER, roomVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, roomVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, roomIndexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, roomVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, roomVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawElements(gl.LINES, roomIndexBuffer.numberOfItems, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, facetsIndexBuffer);

    gl.drawElements(gl.TRIANGLES, facetsIndexBuffer.numberOfItems, gl.UNSIGNED_SHORT, 0);

    mat4.translate(mvMatrix, [0.79, 0.0, -0.799]);
    setMatrixUniforms();

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawElements(gl.TRIANGLES, squareIndexBuffer.numberOfItems, gl.UNSIGNED_SHORT,0);

    mat4.translate(mvMatrix, [0, 0, 0.4]);
    setMatrixUniforms();

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, sphereVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawElements(gl.TRIANGLES, sphereIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mat4.translate(mvMatrix, [-1.2, 0.3999, -0.3]);
    setMatrixUniforms();

    gl.bindBuffer(gl.ARRAY_BUFFER, hexagonalVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, hexagonalVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hexagonalIndexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, hexagonalVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, hexagonalVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawElements(gl.TRIANGLES, hexagonalIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mat4.translate(mvMatrix, [-0.39, -1.2, -0.3]);
    setMatrixUniforms();

    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pyramidVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramidIndexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, pyramidVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawElements(gl.TRIANGLES, pyramidIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function animate() {
    let timeNow = new Date().getTime();
    if (lastTime != 0) {
        let elapsed = timeNow - lastTime;
        if (speed != 0) {
            xPos -= Math.sin(degToRad(yaw)) * speed * elapsed;
            zPos -= Math.cos(degToRad(yaw)) * speed * elapsed;
            joggingAngle += elapsed * 0.6;
            yPos = Math.sin(degToRad(joggingAngle)) / 20;
        }
        yaw += yawRate * elapsed;
        pitch += pitchRate * elapsed;
    }
    lastTime = timeNow;
}

function tick() {
    requestAnimFrame(tick);
    handleKeys();
    drawScene();
    animate()
}

function webGLStart() {
    let canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders();
    initBuffers();

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    tick();
}