let currentStory = null;
let timerInterval = null;
let remainingSeconds = 60;
let practiceCount = 0;

document.addEventListener('DOMContentLoaded', async () => {
  setupPracticeCounter();
  await loadStories();
});

async function loadStories() {
  try {
    const res = await fetch('/api/stories');
    const stories = await res.json();
    if (stories.length > 0) {
      initGame(stories[0]); // Loads the first available story
    } else {
      document.getElementById('storyPrompt').innerText = '暫無可用故事，請進入管理後台上傳。';
    }
  } catch (err) {
    console.error('Failed to load story sets:', err);
  }
}

function initGame(story) {
  currentStory = story;
  document.getElementById('storyPrompt').innerText = story.prompt || '請按順序排列圖片，然後講述故事。';
  remainingSeconds = story.durationSeconds || 60;

  // Audio setup
  const audioEl = document.getElementById('storyAudio');
  const playBtn = document.getElementById('playAudioBtn');
  if (story.audioUrl) {
    audioEl.src = story.audioUrl;
    playBtn.style.display = 'inline-block';
    playBtn.onclick = () => audioEl.play();
  } else {
    playBtn.style.display = 'none';
  }

  startTimer();
  renderGameBoards(story.cards);
}

function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();
    } else {
      clearInterval(timerInterval);
      alert('時間到！');
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const s = String(remainingSeconds % 60).padStart(2, '0');
  document.getElementById('timerText').innerText = `${m}:${s}`;
}

function renderGameBoards(cards) {
  const sourceCol = document.getElementById('sourceColumn');
  const targetGrid = document.getElementById('targetGrid');

  sourceCol.innerHTML = '';
  targetGrid.innerHTML = '';

  const totalCards = cards.length;

  // 1. Create right-side target boxes (1, 2, 3, 4 ...)
  for (let i = 1; i <= totalCards; i++) {
    const targetSlot = document.createElement('div');
    targetSlot.className = 'target-slot';
    targetSlot.dataset.targetIndex = i;

    const badge = document.createElement('div');
    badge.className = 'slot-badge';
    badge.innerText = i;
    targetSlot.appendChild(badge);

    attachDropListeners(targetSlot);
    targetGrid.appendChild(targetSlot);
  }

  // 2. Shuffle cards randomly for the left source boxes
  const shuffledCards = [...cards].sort(() => Math.random() - 0.5);

  // 3. Create left-side source slots and place shuffled cards in them
  shuffledCards.forEach((card, index) => {
    const sourceSlot = document.createElement('div');
    sourceSlot.className = 'source-slot';
    sourceSlot.dataset.sourceIndex = index;
    attachDropListeners(sourceSlot);

    const cardEl = createCardElement(card);
    sourceSlot.appendChild(cardEl);
    sourceCol.appendChild(sourceSlot);
  });
}

function createCardElement(card) {
  const el = document.createElement('div');
  el.className = 'story-card';
  el.draggable = true;
  el.id = card.id;
  el.dataset.correctOrder = card.correctOrder;

  const img = document.createElement('img');
  img.src = card.imageUrl;
  el.appendChild(img);

  el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', card.id);
  });

  return el;
}

function attachDropListeners(slot) {
  slot.addEventListener('dragover', (e) => {
    e.preventDefault();
    slot.classList.add('drag-over');
  });

  slot.addEventListener('dragleave', () => {
    slot.classList.remove('drag-over');
  });

  slot.addEventListener('drop', (e) => {
    e.preventDefault();
    slot.classList.remove('drag-over');

    const cardId = e.dataTransfer.getData('text/plain');
    const draggedCard = document.getElementById(cardId);
    if (!draggedCard) return;

    const sourceParent = draggedCard.parentElement;
    const existingCardInSlot = slot.querySelector('.story-card');

    if (existingCardInSlot && existingCardInSlot !== draggedCard) {
      // Swap: Move the current card to where the dragged card came from
      sourceParent.appendChild(existingCardInSlot);
    }

    slot.appendChild(draggedCard);
  });
}

// Verification Logic
document.getElementById('verifyBtn').addEventListener('click', () => {
  const targetSlots = document.querySelectorAll('.target-slot');
  let placedCount = 0;
  let allCorrect = true;

  targetSlots.forEach((slot) => {
    const card = slot.querySelector('.story-card');
    const targetIdx = parseInt(slot.dataset.targetIndex, 10);

    if (card) {
      placedCount++;
      const correctIdx = parseInt(card.dataset.correctOrder, 10);
      if (correctIdx !== targetIdx) {
        allCorrect = false;
      }
    }
  });

  if (placedCount < targetSlots.length) {
    alert('請將左側所有圖片拖曳放入右側大框中！');
    return;
  }

  if (allCorrect) {
    alert('恭喜你！排序完全正確！🎉');
  } else {
    alert('排序有誤，請再試一次或播放音頻檢查！');
  }
});

function setupPracticeCounter() {
  const countEl = document.getElementById('practiceCount');
  document.getElementById('incCount').onclick = () => {
    practiceCount++;
    countEl.innerText = practiceCount;
  };
  document.getElementById('decCount').onclick = () => {
    if (practiceCount > 0) practiceCount--;
    countEl.innerText = practiceCount;
  };
}