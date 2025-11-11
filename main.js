import { Bodies, Body, Engine, Events, Render, Runner, World } from "matter-js";
import { FRUITS_BASE } from "./fruits";
import "./dark.css";

let FRUITS = FRUITS_BASE;

const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
const WALL = 12;
const INNER_WIDTH = GAME_WIDTH - WALL * 2;

const engine = Engine.create();
const render = Render.create({
  engine,
  element: document.body,
  options: {
    wireframes: false,
    background: "#F7F4C8",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
});

const world = engine.world;

// ✅ 벽, 바닥, 라인
const leftWall = Bodies.rectangle(
  WALL / 2,
  GAME_HEIGHT / 2,
  WALL,
  GAME_HEIGHT,
  {
    isStatic: true,
    render: { fillStyle: "#E6B143" },
  }
);

const rightWall = Bodies.rectangle(
  GAME_WIDTH - WALL / 2,
  GAME_HEIGHT / 2,
  WALL,
  GAME_HEIGHT,
  {
    isStatic: true,
    render: { fillStyle: "#E6B143" },
  }
);

const ground = Bodies.rectangle(
  GAME_WIDTH / 2,
  GAME_HEIGHT - WALL / 2,
  GAME_WIDTH,
  WALL,
  {
    isStatic: true,
    render: { fillStyle: "#E6B143" },
  }
);

const topLine = Bodies.rectangle(
  GAME_WIDTH / 2,
  GAME_HEIGHT * 0.12,
  INNER_WIDTH,
  2,
  {
    name: "topLine",
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#E6B143" },
  }
);

World.add(world, [leftWall, rightWall, ground, topLine]);

Render.run(render);
Runner.run(engine);

// ✅ 상태 변수
let currentBody = null;
let currentFruit = null;
let nextFruit = null;
let disableAction = false;
let isDragging = false;

// ✅ NEXT 미리보기
const nextContainer = document.createElement("div");
nextContainer.style.position = "absolute";
nextContainer.style.top = "16px";
nextContainer.style.left = "16px";
nextContainer.style.display = "flex";
nextContainer.style.flexDirection = "column";
nextContainer.style.alignItems = "center";
nextContainer.style.justifyContent = "center";
nextContainer.style.width = "60px";
nextContainer.style.height = "60px";
nextContainer.style.borderRadius = "12px";
nextContainer.style.background = "rgba(255,255,255,0.7)";
nextContainer.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
nextContainer.style.fontFamily = "Pretendard, sans-serif";
nextContainer.style.fontWeight = "bold";
nextContainer.style.fontSize = "12px";
nextContainer.style.color = "#ff4a4a";

const nextLabel = document.createElement("div");
nextLabel.textContent = "NEXT";

const nextImage = document.createElement("img");
nextImage.style.width = "32px";
nextImage.style.height = "32px";
nextImage.style.marginTop = "4px";
nextImage.alt = "next fruit";

nextContainer.appendChild(nextLabel);
nextContainer.appendChild(nextImage);
document.body.appendChild(nextContainer);

// ✅ ⬇️ 그만두기 버튼 추가
const quitButton = document.createElement("button");
quitButton.textContent = "그만두기";
quitButton.style.position = "absolute";
quitButton.style.top = "16px";
quitButton.style.right = "16px";
quitButton.style.padding = "8px 14px";
quitButton.style.background = "rgba(255,255,255,0.7)";
quitButton.style.border = "none";
quitButton.style.borderRadius = "12px";
quitButton.style.fontFamily = "Pretendard, sans-serif";
quitButton.style.fontWeight = "bold";
quitButton.style.fontSize = "14px";
quitButton.style.color = "#e33";
quitButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
quitButton.style.cursor = "pointer";
quitButton.addEventListener("click", () => {
  if (confirm("게임을 종료하시겠습니까?")) {
    window.location.reload(); // 새로고침으로 초기화
  }
});
document.body.appendChild(quitButton);

// ✅ 과일 생성
function addFruit() {
  const fruit = nextFruit || FRUITS[Math.floor(Math.random() * 5)];
  const body = Bodies.circle(GAME_WIDTH / 2, GAME_HEIGHT * 0.05, fruit.radius, {
    index: FRUITS.indexOf(fruit),
    isSleeping: true,
    render: {
      sprite: { texture: `${fruit.name}.png` },
    },
    restitution: 0.2,
  });

  currentBody = body;
  currentFruit = fruit;
  World.add(world, body);

  nextFruit = FRUITS[Math.floor(Math.random() * 5)];
  nextImage.src = `${nextFruit.name}.png`;
}

// ✅ 드래그 이동
function updateFruitPosition(clientX) {
  if (!currentBody || !currentFruit) return;
  const rect = render.canvas.getBoundingClientRect();
  let x = clientX - rect.left;
  x = Math.max(
    WALL + currentFruit.radius,
    Math.min(x, GAME_WIDTH - WALL - currentFruit.radius)
  );
  Body.setPosition(currentBody, { x, y: currentBody.position.y });
}

// ✅ 드래그 이벤트
window.addEventListener("mousedown", (e) => {
  if (disableAction) return;
  isDragging = true;
  updateFruitPosition(e.clientX);
});
window.addEventListener("mousemove", (e) => {
  if (isDragging && !disableAction) updateFruitPosition(e.clientX);
});
window.addEventListener("mouseup", () => {
  if (!isDragging || disableAction) return;
  isDragging = false;
  dropFruit();
});

window.addEventListener("touchstart", (e) => {
  if (disableAction) return;
  isDragging = true;
  updateFruitPosition(e.touches[0].clientX);
});
window.addEventListener("touchmove", (e) => {
  if (isDragging && !disableAction) updateFruitPosition(e.touches[0].clientX);
});
window.addEventListener("touchend", () => {
  if (!isDragging || disableAction) return;
  isDragging = false;
  dropFruit();
});

// ✅ 과일 떨어뜨리기
function dropFruit() {
  if (!currentBody) return;
  currentBody.isSleeping = false;
  disableAction = true;

  setTimeout(() => {
    addFruit();
    disableAction = false;
  }, 1000);
}

// ✅ 충돌 처리
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    if (collision.bodyA.index === collision.bodyB.index) {
      const index = collision.bodyA.index;
      if (index === FRUITS.length - 1) return;

      World.remove(world, [collision.bodyA, collision.bodyB]);

      const newFruit = FRUITS[index + 1];
      const newBody = Bodies.circle(
        collision.collision.supports[0].x,
        collision.collision.supports[0].y,
        newFruit.radius,
        {
          render: { sprite: { texture: `${newFruit.name}.png` } },
          index: index + 1,
        }
      );
      World.add(world, newBody);
    }

    if (
      !disableAction &&
      (collision.bodyA.name === "topLine" || collision.bodyB.name === "topLine")
    ) {
      alert("Game Over");
    }
  });
});

// ✅ 시작 시 과일 + 미리보기 초기화
nextFruit = FRUITS[Math.floor(Math.random() * 5)];
nextImage.src = `${nextFruit.name}.png`;
addFruit();
