document.getElementById('destroy-button').addEventListener('click', () => {
    // hide the button
    document.getElementById('destroy-button').style.display = 'none';

    // init the physics engine
    const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Events } = Matter;

    const engine = Engine.create();
    const world = engine.world;
    engine.world.gravity.y = 1;

    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            background: 'transparent',
            wireframes: false,
            pixelRatio: window.devicePixelRatio
        }
    });

    Render.run(render);
    Engine.run(engine);

    // make the canvas stay on top but behind content
    render.canvas.style.position = 'absolute';
    render.canvas.style.top = '0';
    render.canvas.style.left = '0';
    render.canvas.style.zIndex = '0';
    render.canvas.style.pointerEvents = 'none'; // pass clicks through

    // create 'walls' for the physics
    const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth, 100, { isStatic: true });
    const wallLeft = Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true });
    const wallRight = Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true });
    const ceiling = Bodies.rectangle(window.innerWidth / 2, -50, window.innerWidth, 100, { isStatic: true });
    World.add(world, [ground, wallLeft, wallRight, ceiling]);

    // this is where we store our html elements and their physics bodies
    const elementBodies = [];

    // find every element with class 'destroyable'
    document.querySelectorAll('.destroyable').forEach(el => {
        const bounds = el.getBoundingClientRect();
        const body = Bodies.rectangle(
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2,
            bounds.width,
            bounds.height,
            {
                restitution: 0.2, // a little bouncy
                friction: 0.5
            }
        );

        World.add(world, body);
        elementBodies.push({ el, body });

        // hide the original static element
        el.style.visibility = 'hidden';
    });

    // this part updates the html elements to match the physics bodies
    Events.on(engine, 'afterUpdate', () => {
        elementBodies.forEach(item => {
            const { el, body } = item;
            el.style.position = 'absolute';
            el.style.left = `${body.position.x - el.offsetWidth / 2}px`;
            el.style.top = `${body.position.y - el.offsetHeight / 2}px`;
            el.style.transform = `rotate(${body.angle}rad)`;
            el.style.visibility = 'visible'; // show the floating element
        });
    });

    // add the mouse control to fling stuff
    const mouse = Mouse.create(document.body); // use document.body for mouse
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });

    // change mouse to use document.body, not the canvas
    mouse.element = document.body;
    render.canvas.style.pointerEvents = 'auto'; // make canvas clickable
    World.add(world, mouseConstraint);

    // spawn a "ball" to break stuff
    const ball = Bodies.circle(window.innerWidth / 2, 100, 30, {
        restitution: 0.7,
        friction: 0.1,
        render: {
            fillStyle: '#222'
        }
    });
    World.add(world, ball);
});
