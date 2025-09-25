// js/main.js
// - three.js background (minimal)
// - circular menu improved: final positions to the RIGHT, enter from TOP, exit below
// - larger radius and larger items, no boxed items, hover effect

document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------
     three.js minimal scene
     ----------------------- */
  (function initThree(){
    if(typeof THREE === 'undefined'){
      console.warn('Three.js no cargado — revisa la CDN.');
      return;
    }
    const container = document.querySelector('.site-container');
    if(!container) return;

    let canvas = container.querySelector('.three-canvas');
    if(!canvas){
      canvas = document.createElement('canvas');
      canvas.className = 'three-canvas';
      container.prepend(canvas);
    }

    const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
    renderer.setPixelRatio(window.devicePixelRatio || 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 2.6;

    const geometry = new THREE.BoxGeometry(1.05,1.05,1.05);
    const material = new THREE.MeshStandardMaterial({color:0x0b0b0b, metalness:0.12, roughness:0.7});
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    const point = new THREE.PointLight(0xffffff, 0.6);
    point.position.set(2,2,2);
    scene.add(ambient, point);

    function resize(){
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // ensure html elements are above canvas
    Array.from(container.children).forEach(el=>{
      if(el === canvas) return;
      if(getComputedStyle(el).zIndex === 'auto' || getComputedStyle(el).zIndex === '0'){
        el.style.zIndex = el.style.zIndex || '2';
        if(getComputedStyle(el).position === 'static') el.style.position = 'relative';
      }
    });

    let mouseX = 0, mouseY = 0;
    container.addEventListener('pointermove', (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    });

    function applyPointer(){
      camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.05;
      camera.lookAt(0,0,0);
      requestAnimationFrame(applyPointer);
    }
    requestAnimationFrame(applyPointer);

    function animate(){
      cube.rotation.x += 0.0025;
      cube.rotation.y += 0.004;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    window.__threePlaceholder = { cube, camera, scene, renderer };
  })();


  /* -----------------------
     Circular menu improved
     ----------------------- */
  (function initCircularMenu(){
    const menuBtn = document.querySelector('.menu-btn');
    const circular = document.querySelector('.circular-menu');
    if(!menuBtn || !circular) return;

    const items = Array.from(circular.querySelectorAll('.circular-item'));

    // read CSS radius variable (fallback if missing)
    const css = getComputedStyle(document.documentElement);
    const radiusVar = css.getPropertyValue('--c-menu-radius') || '220';
    const radius = Number(radiusVar.replace('px','')) || 220;

    // Prepare transforms:
    // final: positioned to the RIGHT => rotate(angle) translate(radius,0) rotate(-angle)
    // entry (start): positioned at TOP => rotate(angle) translate(0, -radius) rotate(-angle)
    // exit (below): translate(0, +radius)
    items.forEach((li, idx) => {
      const angleDeg = Number(li.dataset.angle || 0);

      const finalTransform = `rotate(${angleDeg}deg) translate(${radius}px, 0) rotate(${-angleDeg}deg)`;
      const entryTransform = `rotate(${angleDeg}deg) translate(0, -${radius}px) rotate(${-angleDeg}deg)`;
      const exitTransform  = `rotate(${angleDeg}deg) translate(0, ${radius}px) rotate(${-angleDeg}deg)`;

      // store for later use
      li.dataset._final = finalTransform;
      li.dataset._entry = entryTransform;
      li.dataset._exit  = exitTransform;

      // start state = entry (so they will animate FROM top INTO final)
      li.style.transform = entryTransform;
      li.style.opacity = '0';
      li.style.pointerEvents = 'none';

      // stagger via inline delays (ms) for entrance
      const delay = idx * 70;
      li.style.transitionDelay = `${delay}ms`;
    });

    // initial state closed
    circular.classList.add('closed');
    circular.setAttribute('aria-hidden','true');
    menuBtn.setAttribute('aria-expanded','false');

    let isAnimating = false;

    function openMenu(){
      if(isAnimating) return;
      isAnimating = true;

      // rotate container to 0deg (open) so items' final transforms take effect visually
      circular.classList.remove('closed','closing');
      void circular.offsetWidth; // reflow to ensure transitions
      circular.classList.add('open');
      circular.setAttribute('aria-hidden','false');
      menuBtn.setAttribute('aria-expanded','true');
      menuBtn.classList.add('open');

      // animate items from entry -> final (with stagger already set)
      items.forEach((li, idx) => {
        // small per-item delay is already applied via transitionDelay; apply final transform and opacity
        // use setTimeout to ensure CSS transitionDelay lines up with class change
        const delay = idx * 70;
        setTimeout(() => {
          li.style.transform = li.dataset._final;
          li.style.opacity = '1';
          li.style.pointerEvents = 'auto';
        }, 10); // minimal kick-off; the transitionDelay handles the stagger
      });

      // three.js subtle reaction
      if(window.__threePlaceholder && window.__threePlaceholder.cube){
        animateScale(window.__threePlaceholder.cube, 1.06, 220);
      }

      setTimeout(()=>{ isAnimating = false; }, 700 +  (items.length * 70));
    }

    function closeMenu(){
      if(isAnimating) return;
      isAnimating = true;

      // rotate container to +90deg for final spin out
      circular.classList.remove('open');
      circular.classList.add('closing');
      circular.setAttribute('aria-hidden','true');
      menuBtn.setAttribute('aria-expanded','false');
      menuBtn.classList.remove('open');

      // animate items to exit transform (down) with stagger
      items.forEach((li, idx) => {
        const delay = idx * 40; // tighter stagger for exit
        setTimeout(() => {
          li.style.transform = li.dataset._exit;
          li.style.opacity = '0';
          li.style.pointerEvents = 'none';
        }, delay);
      });

      // three.js restore
      if(window.__threePlaceholder && window.__threePlaceholder.cube){
        animateScale(window.__threePlaceholder.cube, 1.0, 260);
      }

      // after closing animation completes, restore items to entry positions (so next open animates from top)
      const total = 700 + (items.length * 40);
      setTimeout(()=>{
        items.forEach(li=>{
          li.style.transform = li.dataset._entry;
          li.style.opacity = '0';
          li.style.pointerEvents = 'none';
        });
        circular.classList.remove('closing');
        circular.classList.add('closed');
        isAnimating = false;
      }, total);
    }

    // Toggle
    menuBtn.addEventListener('click', (e) => {
      const willOpen = !menuBtn.classList.contains('open');
      if(willOpen) openMenu(); else closeMenu();
    });

    // Keyboard accessibility
    menuBtn.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        menuBtn.click();
      }
    });

    window.addEventListener('keydown', (e) => {
      if(e.key === 'Escape'){
        if(menuBtn.classList.contains('open')){
          closeMenu();
          menuBtn.classList.remove('open');
        }
      }
    });

    // click outside to close
    document.addEventListener('click', (ev) => {
      if(!circular.classList.contains('open')) return;
      const inside = circular.contains(ev.target) || menuBtn.contains(ev.target);
      if(!inside){
        closeMenu();
        menuBtn.classList.remove('open');
      }
    });

    // Helper: lightweight scale animation for three.js object
    function animateScale(obj, target, duration){
      if(!obj) return;
      const start = performance.now();
      const from = obj.scale.x;
      const delta = target - from;
      function frame(now){
        const t = Math.min(1, (now - start) / duration);
        const ease = t*(2-t);
        const s = from + delta * ease;
        obj.scale.set(s,s,s);
        if(t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

  })();

});
