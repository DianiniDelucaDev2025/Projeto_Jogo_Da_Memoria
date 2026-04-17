// Elementos
const board = document.getElementById("game-board");
const movesDisplay = document.getElementById("moves");
const timerDisplay = document.getElementById("timer");
const restartBtn = document.getElementById("restart");
const startBtn = document.getElementById("startGame");
const showName = document.getElementById("showName");
const phaseDisplay = document.getElementById("phase");
const applyDifficultyBtn = document.getElementById("applyDifficulty");
const rankingDiv = document.getElementById("ranking");
const rankingList = document.getElementById("rankingList");
const clearRankingBtn = document.getElementById("clearRanking");
const backToMenuBtn = document.getElementById("backToMenu");

// Cartas possíveis (vários símbolos para variar por fase)
const allCards = ["🍕","🍔","🍟","🌭","🍩","🍫","🍿","🥤","🍎","🍉","🍇","🍓","🥪","🍪","🥟","🍒","🍍","🥑","🍗","🥨","🥦","🥕","🍌","🍋","🍊","🍈","🍄","🥝","🥥","🍱","🍙","🍤","🍧","🍭","🍷","🍺","🥂","🍵","☕","🥛"];

let deck = [];
let flippedCards = [];
let moves = 0;
let matched = 0;
let timer = 0;
let interval = null;
let phase = 1;
let playerName = "";
let difficulty = "facil";

// Utilitários
function shuffle(array) {
  // Fisher-Yates para melhor aleatoriedade
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setBoardSize(size) {
  // Ajusta colunas conforme tamanho
  if (size === 20) board.style.gridTemplateColumns = "repeat(5, var(--card-size))";
  else if (size === 30) board.style.gridTemplateColumns = "repeat(6, var(--card-size))";
  else if (size === 40) board.style.gridTemplateColumns = "repeat(8, var(--card-size))";
}

// Inicialização do jogo
function startGame() {
  const nameInput = document.getElementById("playerName").value.trim();
  playerName = nameInput || "Jogador";
  difficulty = document.getElementById("difficulty").value;
  showName.textContent = playerName;
  phase = 1;
  phaseDisplay.textContent = phase;
  document.getElementById("menu").style.display = "none";
  document.getElementById("game").style.display = "block";
  rankingDiv.style.display = "block";
  newPhase();
  renderRanking(); // mostra ranking ao iniciar
}

function newPhase() {
  // Limpa estado
  board.innerHTML = "";
  flippedCards = [];
  moves = 0;
  matched = 0;
  timer = 0;
  movesDisplay.textContent = moves;
  timerDisplay.textContent = timer;
  clearInterval(interval);

  // Define tamanho conforme dificuldade
  const size = difficulty === "facil" ? 20 : difficulty === "medio" ? 30 : 40;

  // Seleciona cartas diferentes a cada fase
  const selected = shuffle(allCards).slice(0, size / 2);
  deck = shuffle([...selected, ...selected]);

  // Ajusta layout
  setBoardSize(size);

  // Cria elementos das cartas
  deck.forEach((symbol, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.symbol = symbol;
    card.dataset.index = index;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">${symbol}</div>
        <div class="card-back">❓</div>
      </div>
    `;
    card.addEventListener("click", () => flipCard(card));
    board.appendChild(card);
  });

  // Inicia cronômetro
  interval = setInterval(() => {
    timer++;
    timerDisplay.textContent = timer;
  }, 1000);
}

function flipCard(card) {
  // Bloqueia cliques inválidos
  if (card.classList.contains("flipped")) return;
  if (flippedCards.length === 2) return;

  card.classList.add("flipped");
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    moves++;
    movesDisplay.textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  const [first, second] = flippedCards;
  const sym1 = first.dataset.symbol;
  const sym2 = second.dataset.symbol;

  if (sym1 === sym2) {
    // Par encontrado
    matched += 2;
    flippedCards = [];
    // Se completou a fase
    if (matched === deck.length) {
      clearInterval(interval);
      saveScore(); // salva pontuação ao terminar fase
      if (phase < 30) {
        phase++;
        phaseDisplay.textContent = phase;
        setTimeout(newPhase, 800);
      } else {
        setTimeout(() => {
          alert(`🎉 Parabéns ${playerName}, você concluiu todas as 30 fases!`);
          newPhase();
        }, 400);
      }
    }
  } else {
    // Erro: vira de volta após delay
    setTimeout(() => {
      first.classList.remove("flipped");
      second.classList.remove("flipped");
      flippedCards = [];
    }, 800);
  }
}

// Pontuação e ranking
function computeScore(moves, time) {
  // Fórmula simples: quanto menor moves e tempo, maior a pontuação
  // Ajuste conforme desejar
  const base = 10000;
  const penalty = moves * 50 + time * 20;
  return Math.max(1, base - penalty);
}

function saveScore() {
  const score = computeScore(moves, timer);
  const record = {
    name: playerName,
    score: score,
    moves: moves,
    time: timer,
    date: new Date().toISOString()
  };

  const key = "memory_ranking_v1";
  const ranking = JSON.parse(localStorage.getItem(key)) || [];
  ranking.push(record);

  // Ordena por score decrescente, depois por tempo ascendente
  ranking.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.time - b.time;
  });

  // Mantém apenas top 10
  const top = ranking.slice(0, 10);
  localStorage.setItem(key, JSON.stringify(top));
  renderRanking();
}

function renderRanking() {
  const key = "memory_ranking_v1";
  const ranking = JSON.parse(localStorage.getItem(key)) || [];
  rankingList.innerHTML = "";

  if (ranking.length === 0) {
    rankingList.innerHTML = "<li>Nenhum registro ainda</li>";
    rankingDiv.style.display = "block";
    return;
  }

  ranking.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.name} — ${item.score} pts — ${item.moves} jogadas — ${item.time}s`;
    rankingList.appendChild(li);
  });

  rankingDiv.style.display = "block";
}

function clearRanking() {
  if (confirm("Deseja realmente limpar o ranking?")) {
    localStorage.removeItem("memory_ranking_v1");
    renderRanking();
  }
}

// Eventos
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", () => {
  // Reinicia a fase atual sem alterar fase
  newPhase();
});
applyDifficultyBtn.addEventListener("click", () => {
  difficulty = document.getElementById("changeDifficulty").value;
  // Reinicia fase atual com novo tamanho
  newPhase();
});
clearRankingBtn.addEventListener("click", clearRanking);
backToMenuBtn.addEventListener("click", () => {
  // Volta ao menu principal
  clearInterval(interval);
  document.getElementById("game").style.display = "none";
  document.getElementById("menu").style.display = "block";
});

// Ao carregar a página, mostra ranking salvo (se houver)
document.addEventListener("DOMContentLoaded", () => {
  renderRanking();
});
