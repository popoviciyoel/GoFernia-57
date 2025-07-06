(function () {
  const scriptTag = document.currentScript;
  const triggersRaw = scriptTag.getAttribute('data-triggers') || 'widget';
  const triggers = triggersRaw.split(',').map(t => t.trim().toLowerCase());

  const gameUrl = scriptTag.getAttribute('data-src');
  const delay = parseInt(scriptTag.getAttribute('data-delay') || '5000');
  const scrollPercent = parseInt(scriptTag.getAttribute('data-scroll') || '50');
  const widgetText = scriptTag.getAttribute('data-widget-text') || 'Play Game';
  const position = scriptTag.getAttribute('data-position') || 'bottom-right';
  const SESSION_KEY = 'game-modal-shown';

  function alreadyShown() {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  }

  function markAsShown() {
    sessionStorage.setItem(SESSION_KEY, 'true');
  }

function showModalIframe() {
  if (document.getElementById('embedded-game-modal')) return;
  markAsShown();

  const overlay = document.createElement('div');
  overlay.id = 'embedded-game-modal';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    opacity: 0;
    animation: fadeIn 0.5s ease forwards;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    transform: scale(0.9);
    animation: popIn 0.5s ease forwards;
    max-width: 90%;
    width: 700px;
    height: 600px;
  `;

  const iframe = document.createElement('iframe');
  iframe.src = gameUrl;
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 16px;
  `;

  modal.appendChild(iframe);
  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove(); // close on outside click
  });

  document.body.appendChild(overlay);

  // Inject keyframe animations once
  if (!document.getElementById('game-modal-animations')) {
    const style = document.createElement('style');
    style.id = 'game-modal-animations';
    style.innerHTML = `
      @keyframes fadeIn {
        to { opacity: 1; }
      }
      @keyframes popIn {
        0% { transform: scale(0.8); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
}


function createWidget() {
  if (document.getElementById('embedded-game-widget')) return;

  const VARIANT_KEY = 'game-widget-variant';
  const variantIndex = parseInt(sessionStorage.getItem(VARIANT_KEY) || '0');
  sessionStorage.setItem(VARIANT_KEY, (variantIndex + 1).toString());

  const variant = variantIndex % 6;
  const button = document.createElement('button');
  button.id = 'embedded-game-widget';
  button.textContent = ''; // will be set below
  button.addEventListener('click', showModalIframe);

  let baseStyle = `
    position: fixed;
    z-index: 9999;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  `;

  // Common placement logic
  const place = () => {
    if (position.includes('bottom')) button.style.bottom = '20px';
    else button.style.top = '20px';

    if (position.includes('right')) button.style.right = '20px';
    else button.style.left = '20px';
  };

  switch (variant) {
    case 0: // 🌀 Pulse Pill
      button.textContent = '🌀 Play Now';
      button.style.cssText = baseStyle + `
        background: #111;
        color: white;
        padding: 14px 28px;
        border-radius: 50px;
        font-size: 16px;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        animation: pulseGlow 2s infinite;
      `;
      break;

    case 1: // 🧃 Gradient Juice
      button.textContent = '🧃 Enter the Drop';
      button.style.cssText = baseStyle + `
        background: linear-gradient(135deg, #ff6ec4, #7873f5);
        color: #fff;
        padding: 12px 26px;
        border-radius: 20px 5px 20px 5px;
        font-size: 15px;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      break;

    case 2: // 🪩 Disco Dot
      button.innerHTML = '🪩';
      button.style.cssText = baseStyle + `
        width: 50px;
        height: 50px;
        font-size: 24px;
        background: linear-gradient(45deg, #00f2ff, #f77062);
        border-radius: 50%;
        animation: bounce 2s infinite ease-in-out;
        box-shadow: 0 0 12px rgba(0,0,0,0.3);
      `;
      break;

    case 3: // 💬 Chat Bubble
      button.textContent = '💬 Got a sec?';
      button.style.cssText = baseStyle + `
        background: #222;
        color: #fff;
        padding: 12px 20px;
        font-size: 15px;
        border-radius: 24px 24px 24px 4px;
        box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
      `;
      break;

    case 4: // 🎲 Game Cube
      button.innerHTML = '🎲<br>Try Now';
      button.style.cssText = baseStyle + `
        width: 60px;
        height: 60px;
        font-size: 14px;
        background: #fff;
        color: #111;
        border-radius: 12px;
        transform-style: preserve-3d;
        animation: cubeSpin 4s linear infinite;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        text-align: center;
        line-height: 1.2;
      `;
      break;

    case 5: // 🧨 Exploding CTA
      button.textContent = '🧨 Blow It Up!';
      button.style.cssText = baseStyle + `
        background: crimson;
        color: white;
        padding: 14px 24px;
        font-size: 16px;
        border-radius: 8px;
        animation: wiggle 0.6s ease-in-out infinite alternate;
        box-shadow: 0 0 10px rgba(255,0,0,0.4);
      `;
      break;
  }

  place();
  document.body.appendChild(button);

  // Add animations
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pulseGlow {
      0% { box-shadow: 0 0 10px rgba(255,255,255,0.2); }
      50% { box-shadow: 0 0 20px rgba(255,255,255,0.6); }
      100% { box-shadow: 0 0 10px rgba(255,255,255,0.2); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    @keyframes cubeSpin {
      0% { transform: rotateY(0deg); }
      100% { transform: rotateY(360deg); }
    }
    @keyframes wiggle {
      0% { transform: rotate(-2deg); }
      100% { transform: rotate(2deg); }
    }
  `;
  document.head.appendChild(style);
}


  function setupTriggers() {
    createWidget(); // Always show widget

    if (alreadyShown()) return; // Skip all other triggers if game already shown

    if (triggers.includes('delay')) {
      console.log('Trigger: delay');
      setTimeout(() => {
        if (!alreadyShown()) showModalIframe();
      }, delay);
    }

    if (triggers.includes('scroll')) {
      console.log('Trigger: scroll');
      const onScroll = () => {
        const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
        if (scrolled >= scrollPercent && !alreadyShown()) {
          showModalIframe();
          window.removeEventListener('scroll', onScroll);
        }
      };
      window.addEventListener('scroll', onScroll);
    }

    if (triggers.includes('exit')) {
      console.log('Trigger: exit');
      const onExit = (e) => {
        if (e.clientY <= 0 && !alreadyShown()) {
          showModalIframe();
          document.removeEventListener('mouseleave', onExit);
        }
      };
      document.addEventListener('mouseleave', onExit);
    }
  }

  document.addEventListener('DOMContentLoaded', setupTriggers);
})();
