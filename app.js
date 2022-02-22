let bgSound = new Audio('./sounds/bgMusic.mp3');
bgSound.loop = true;
bgSound.volume = 0.05;
bgSound.play();

let container, camera, renderer, scene, object, light, validSides, validBoxes, boxes,
    loader, unselectedSides, selectedSides, users, user, currentPlayer, box1, box2, target,
    cursorMesh;
let sideClickSound = new Audio('./sounds/gettingSide.wav'),
    fullBoxSound = new Audio('./sounds/gettingFullBox.mp3'),
    zoomSound = new Audio('./sounds/zoom.mp3'),
    winningSound = new Audio(),
    SoundeffectsVolume = .1;

sideClickSound.volume = SoundeffectsVolume;
fullBoxSound.volume = SoundeffectsVolume;
winningSound.volume = SoundeffectsVolume;

let players = document.querySelectorAll('.players .player');
let winner = document.querySelector('.winner'),
    winnerChildren = document.querySelectorAll('.winner div'),
    winPlayer = winnerChildren[0],
    score = winnerChildren[1];

let controlsChildren = document.querySelectorAll('.controls .selector');
let up = controlsChildren[0],
    right = controlsChildren[1],
    left = controlsChildren[2],
    down = controlsChildren[3];
let viewer = document.querySelector('.viewer');

container = document.querySelector('.container');

target = {
    x: 0,
    y: 0,
    z: 0,
    zoom: 45
};

let fullScreen = document.querySelector('.fullScreen');
fullScreen.addEventListener('click', () => {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    }
});


function init() {
    scene = new THREE.Scene();
    scene.position.z = -2;

    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 1000);
    camera.position.set(target.x, target.zoom, target.z);
    camera.lookAt(target.x, target.y, target.z);


    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    window.onresize = () => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
    };


    light = new THREE.PointLight(0xffffff, 1.5);
    light.position.set(target.x, 30, target.z);
    scene.add(light);


    // geometries
    // ex geo
    const exGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 4);
    const mat = new THREE.MeshBasicMaterial();

    function ex(x, z, color) {
        let cylA = new THREE.Mesh(exGeo, mat);
        cylA.material.color.set(color);
        cylA.rotation.x = 1.6;
        cylA.rotation.z = -0.8;
        cylA.position.set(x, .55, z);
        scene.add(cylA);
        let cylB = new THREE.Mesh(exGeo, mat);
        cylB.material.color.set(color);
        cylB.rotation.z = 1.6;
        cylB.rotation.y = .8;
        cylB.position.set(x, .55, z);
        scene.add(cylB);
    };


    //ring geo
    const geometry = new THREE.RingGeometry(.5, .7, 10);
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });

    function ring(x, z, color) {
        let mesh = new THREE.Mesh(geometry, material);
        mesh.material.color.set(color);
        mesh.position.set(x, .55, z);
        mesh.rotation.x = 1.6;
        scene.add(mesh);
    };

    // players

    users = [{
            id: "player 1",
            name: "red",
            color: 0xff0000,
            points: 0
        },
        {
            id: "player 2",
            name: "blue",
            color: 0x0000ff,
            points: 0
        }
    ];

    user = 0;

    for (let i = 0; i < controlsChildren.length; i++) {
        controlsChildren[i].classList.add(users[user].name);
    };
    viewer.classList.add(users[user].name);

    ////////////////////////////////////////////////


    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    loader = new THREE.GLTFLoader();
    loader.load('./3d/scene.gltf', function(gltf) {
        scene.add(gltf.scene);
        object = gltf.scene.children;

        validSides = object[0].children[1].children.filter(obj => obj.material);
        validBoxes = object[0].children[0].children.filter(obj => obj.material);

        unselectedSides = [];
        selectedSides = [];

        boxes = [];

        traversing();
        selectEdges();

        animate();
    });

    const cursorGeo = new THREE.BoxGeometry(1.8, .1, 1.8);
    const cursorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .25 });
    cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
    scene.add(cursorMesh);
    cursorMesh.position.y = .7;


    const textureLoader = new THREE.TextureLoader();
    const baseColor = textureLoader.load("./textures/edge.jpg");
    /* const normalMap = textureLoader.load("./textures/edgenormal.jpg"); */

    let selectEdges = () => {
        for (let i = unselectedSides.length - 1; i >= 0; i--) {
            if (unselectedSides[i].name.length == 5) {

                for (let x = 0; x < boxes.length; x++) {
                    if (boxes[x].name == unselectedSides[i].name.slice(0, -1)) {
                        boxes[x].sides += 1;
                    }
                }

                selectedSides.push(unselectedSides[i]);
                validSides[i].material.map = baseColor;
                /* validSides[i].material.normalMap = normalMap; */
                unselectedSides.splice(i, 1);
                let removeEdges = validSides.splice(i, 1);
            }
        };
    }

    let traversing = () => {
        for (let i = validSides.length - 1; i >= 0; i--) {
            unselectedSides[i] = {
                mesh: validSides[i],
                name: validSides[i].name
            }
        };

        for (let i = 0; i < validBoxes.length; i++) {
            boxes.push({
                name: validBoxes[i].name,
                posx: validBoxes[i].position.x,
                posz: validBoxes[i].position.z,
                full: false,
                sides: 0
            });
        }
    }


    function onMouseMove(event) {
        event.preventDefault();

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components

        mouse.x = (event.clientX / container.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / container.clientHeight) * 2 + 1;

    }

    up.addEventListener('click', upClick);
    down.addEventListener('click', downClick);
    right.addEventListener('click', rightClick);
    left.addEventListener('click', leftClick);

    function upClick() {
        if (cursorMesh.position.z > -8 + Math.abs(cursorMesh.position.x)) {
            cursorMesh.position.z -= 2;
        }
    }

    function downClick() {
        if (cursorMesh.position.z < 8 - Math.abs(cursorMesh.position.x)) {
            cursorMesh.position.z += 2;
        }
    }

    function rightClick() {
        if (cursorMesh.position.x < 8 - Math.abs(cursorMesh.position.z)) {
            cursorMesh.position.x += 2;
        }
    }

    function leftClick() {
        if (cursorMesh.position.x > -8 + Math.abs(cursorMesh.position.z)) {
            cursorMesh.position.x -= 2;
        }
    }

    document.addEventListener('click', (e) => {
        if (e.target.className.includes('zoomIn')) {
            scene.position.z = 0;
            target.x = cursorMesh.position.x;
            target.z = cursorMesh.position.z;
            target.zoom = 15;
            zoomSound.play();
            e.target.classList.replace('zoomIn', 'zoomOut');
        } else if (e.target.className.includes('zoomOut')) {
            scene.position.z = -2;
            target.x = 0;
            target.z = 0;
            target.zoom = 45;
            zoomSound.play();
            e.target.classList.replace('zoomOut', 'zoomIn');
        }
    });

    function click() {
        raycaster.setFromCamera(mouse, camera);

        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(validSides, true);

        currentPlayer = users[user];

        if (intersects.length > 0) {
            let xPositive = intersects[0].object.position.x == cursorMesh.position.x + 1,
                xNegative = intersects[0].object.position.x == cursorMesh.position.x - 1,
                xStable = intersects[0].object.position.x == cursorMesh.position.x,
                zPositive = intersects[0].object.position.z == cursorMesh.position.z + 1,
                zNegative = intersects[0].object.position.z == cursorMesh.position.z - 1,
                zStable = intersects[0].object.position.z == cursorMesh.position.z;
            if (((xPositive || xNegative) && zStable) || ((zPositive || zNegative) && xStable)) {
                intersects[0].object.material.color.set(currentPlayer.color);
                sideClickSound.play();

                for (let i = 0; i < controlsChildren.length; i++) {
                    if (controlsChildren[i].className.includes(users[0].name)) {
                        controlsChildren[i].classList.add(users[1].name);
                        controlsChildren[i].classList.remove(users[0].name);
                    } else if (controlsChildren[i].className.includes(users[1].name)) {
                        controlsChildren[i].classList.add(users[0].name);
                        controlsChildren[i].classList.remove(users[1].name);
                    }
                };
                if (viewer.className.includes(users[0].name)) {
                    viewer.classList.add(users[1].name);
                    viewer.classList.remove(users[0].name);
                } else if (viewer.className.includes(users[1].name)) {
                    viewer.classList.add(users[0].name);
                    viewer.classList.remove(users[1].name);
                }

                scene.position.z = -2;
                target.x = 0;
                target.z = 0;
                target.zoom = 45;
                viewer.classList.replace('zoomOut', 'zoomIn');

                box1 = intersects[0].object.name.slice(0, 4);
                box2 = intersects[0].object.name.slice(5, 9);

                for (let x = 0; x < boxes.length; x++) {
                    if (boxes[x].name == box1) {
                        boxes[x].sides += 1;
                        if (boxes[x].sides == 4) {
                            fullBoxSound.play();
                            boxes[x].full = true;
                            if (user == 0) {
                                ex(boxes[x].posx, boxes[x].posz, currentPlayer.color)
                            } else {
                                ring(boxes[x].posx, boxes[x].posz, currentPlayer.color)
                            };
                            currentPlayer.points += 1;
                            ////////
                            players[user].querySelector(".points").innerHTML = currentPlayer.points;
                        }
                    } else if (boxes[x].name == box2) {
                        boxes[x].sides += 1;
                        if (boxes[x].sides == 4) {
                            fullBoxSound.play();
                            boxes[x].full = true;
                            if (user == 0) {
                                ex(boxes[x].posx, boxes[x].posz, currentPlayer.color)
                            } else {
                                ring(boxes[x].posx, boxes[x].posz, currentPlayer.color)
                            };
                            currentPlayer.points += 1;
                            ////////
                            players[user].querySelector(".points").innerHTML = currentPlayer.points;
                        }
                    }
                };
                user = user == 0 ? 1 : 0;

                let removed = validSides.splice(validSides.indexOf(intersects[0].object), 1);
                for (let i = 0; i < unselectedSides.length; i++) {
                    if (unselectedSides[i].name == removed[0].name) {
                        selectedSides.push(unselectedSides[i]);
                        unselectedSides.splice(i, 1);
                    }
                }
            }
        }

        if (unselectedSides.length == 0) {
            if (users[0].points > users[1].points) {
                winPlayer.innerHTML = `the winner is ${users[0].id}`;
                score.innerHTML = `your score is ${users[0].points}`;
                winner.classList.add('active');
                winner.classList.add('red');
            } else {
                winPlayer.innerHTML = `the winner is ${users[1].id}`;
                score.innerHTML = `your score is ${users[1].points}`;
                winner.classList.add('active');
                winner.classList.add('blue');
            }
        }

    }

    function animate() {
        requestAnimationFrame(animate);
        camera.position.set(target.x, target.zoom, target.z);
        window.addEventListener('click', click);
        renderer.render(scene, camera);
    }

    window.addEventListener('mousemove', onMouseMove, false);
};
init();