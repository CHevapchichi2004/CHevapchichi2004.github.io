document.addEventListener('DOMContentLoaded', function () {
    // Элементы DOM
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    const reviewScreen = document.getElementById('review-screen');

    const startBtn = document.getElementById('start-btn');
    const prevBtn = document.getElementById('prev-btn');
    const checkBtn = document.getElementById('check-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const restartBtn = document.getElementById('restart-btn');
    const reviewBtn = document.getElementById('review-btn');
    const backToResultsBtn = document.getElementById('back-to-results-btn');

    const questionElement = document.getElementById('question');
    const optionsContainer = document.getElementById('options-container');
    const selectionInfo = document.getElementById('selection-info');
    const selectedCountElement = document.getElementById('selected-count');
    const totalOptionsElement = document.getElementById('total-options');

    const feedbackContainer = document.getElementById('feedback-container');
    const correctFeedback = document.getElementById('correct-feedback');
    const partialFeedback = document.getElementById('partially-feedback');
    const incorrectFeedback = document.getElementById('incorrect-feedback');
    const partialCorrectCount = document.getElementById('partial-correct-count');
    const totalCorrectCount = document.getElementById('total-correct-count');
    const correctAnswersText = document.getElementById('correct-answers-text');

    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.getElementById('progress-text');

    const scoreElement = document.getElementById('score');
    const percentageElement = document.getElementById('percentage');
    const correctCountElement = document.getElementById('correct-count');
    const partialCountElement = document.getElementById('partial-count');
    const incorrectCountElement = document.getElementById('incorrect-count');
    const reviewContainer = document.getElementById('review-container');

    // Переменные состояния
    let questions = [];
    let shuffledQuestions = [];
    let currentQuestionIndex = 0;
    let userAnswers = []; // Массив массивов выбранных индексов
    let questionStatus = []; // Статус ответа на каждый вопрос: 'unanswered', 'correct', 'partial', 'incorrect'
    let score = 0;
    let letters = ['а', 'б', 'в', 'г', 'д', 'е'];

    // Загрузка вопросов из JSON
    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error('Не удалось загрузить вопросы');
            }
            questions = await response.json();
            console.log('Вопросы загружены:', questions.length);
        } catch (error) {
            console.error('Ошибка загрузки вопросов:', error);
            createDemoQuestions();
        }
    }

    // Создание демо-вопросов, если файл не найден
    function createDemoQuestions() {
        questions = [
            {
                "text": "Составляющие мультимедиа могут быть разбиты на основные группы?",
                "options": [
                    { "text": "Текстовая, визуальная и звуковая информация.", "correct": false },
                    { "text": "Текстовая, визуальная, звуковая информация и данные.", "correct": true },
                    { "text": "Текстовая, визуальная, звуковая информация, данные и графическая информация.", "correct": false },
                    { "text": "Только текстовая и визуальная информация.", "correct": false }
                ]
            },
            {
                "text": "С точки зрения передачи мультимедиа могут быть классифицированы на?",
                "options": [
                    { "text": "Передаваемые в реальном времени.", "correct": true },
                    { "text": "Передаваемые в on-line.", "correct": false },
                    { "text": "Передаваемые в не реальном времени.", "correct": true },
                    { "text": "Только передаваемые по запросу.", "correct": false }
                ]
            }
        ];
        console.log('Созданы демо-вопросы с множественным выбором');
    }

    // Инициализация теста
    function initializeQuiz() {
        // Перемешиваем вопросы
        shuffledQuestions = [...questions];
        shuffleArray(shuffledQuestions);

        // Перемешиваем варианты ответов в каждом вопросе
        shuffledQuestions.forEach(question => {
            shuffleArray(question.options);

            // Находим индексы правильных ответов после перемешивания
            question.correctOptionIndices = [];
            question.options.forEach((option, index) => {
                if (option.correct) {
                    question.correctOptionIndices.push(index);
                }
            });

            // Сохраняем текст правильных ответов для отображения
            question.correctAnswersText = question.correctOptionIndices
                .map(idx => `${letters[idx]}) ${question.options[idx].text}`)
                .join('; ');
        });

        // Инициализируем массивы
        userAnswers = new Array(shuffledQuestions.length).fill(null).map(() => []);
        questionStatus = new Array(shuffledQuestions.length).fill('unanswered');

        // Сбрасываем индекс текущего вопроса и счет
        currentQuestionIndex = 0;
        score = 0;

        // Обновляем UI
        updateProgress();
        showQuestion();
    }

    // Перемешивание массива (алгоритм Фишера-Йетса)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Показать вопрос
    function showQuestion() {
        const question = shuffledQuestions[currentQuestionIndex];
        questionElement.textContent = `${currentQuestionIndex + 1}. ${question.text}`;

        // Обновляем информацию о выборе
        totalOptionsElement.textContent = question.options.length;
        updateSelectionInfo();

        // Скрываем блок обратной связи, если вопрос еще не проверен
        if (questionStatus[currentQuestionIndex] === 'unanswered') {
            feedbackContainer.classList.add('hidden');
        } else {
            showFeedback();
        }

        // Очищаем контейнер с вариантами
        optionsContainer.innerHTML = '';

        // Создаем варианты ответов
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';

            // Проверяем, выбран ли этот вариант
            const isSelected = userAnswers[currentQuestionIndex].includes(index);
            const isChecked = questionStatus[currentQuestionIndex] !== 'unanswered';

            if (isSelected) {
                optionElement.classList.add('selected');
            }

            // Если вопрос проверен, показываем правильность ответов
            if (isChecked) {
                optionElement.classList.add('checked');

                const isCorrectOption = question.correctOptionIndices.includes(index);

                if (isSelected && isCorrectOption) {
                    optionElement.classList.add('correct');
                } else if (isSelected && !isCorrectOption) {
                    optionElement.classList.add('incorrect');
                } else if (!isSelected && isCorrectOption) {
                    optionElement.classList.add('correct');
                }
            }

            optionElement.innerHTML = `
                <div class="option-checkbox"></div>
                <div class="option-text">${letters[index]}) ${option.text}</div>
            `;

            // Если вопрос еще не проверен, добавляем обработчик клика
            if (!isChecked) {
                optionElement.addEventListener('click', () => toggleOption(index));
            }

            optionsContainer.appendChild(optionElement);
        });

        // Обновляем состояние кнопок навигации
        updateNavigationButtons();
    }

    // Переключить выбор варианта
    function toggleOption(optionIndex) {
        const currentAnswers = userAnswers[currentQuestionIndex];
        const index = currentAnswers.indexOf(optionIndex);

        if (index === -1) {
            // Добавляем вариант
            currentAnswers.push(optionIndex);
        } else {
            // Удаляем вариант
            currentAnswers.splice(index, 1);
        }

        // Обновляем отображение
        updateSelectionInfo();
        showQuestion();
    }

    // Обновить информацию о выбранных вариантах
    function updateSelectionInfo() {
        const selectedCount = userAnswers[currentQuestionIndex].length;
        selectedCountElement.textContent = selectedCount;

        // Подсвечиваем информацию в зависимости от количества выбранных ответов
        if (selectedCount === 0) {
            selectionInfo.style.borderColor = '#e0e0e0';
            selectionInfo.style.backgroundColor = '#f0f4ff';
        } else {
            selectionInfo.style.borderColor = '#4a00e0';
            selectionInfo.style.backgroundColor = '#e6f7ff';
        }
    }

    // Обновить кнопки навигации
    function updateNavigationButtons() {
        const isAnswered = questionStatus[currentQuestionIndex] !== 'unanswered';
        const hasSelection = userAnswers[currentQuestionIndex].length > 0;

        prevBtn.disabled = currentQuestionIndex === 0;

        if (isAnswered) {
            checkBtn.classList.add('hidden');
            nextBtn.classList.remove('hidden');
        } else {
            checkBtn.classList.remove('hidden');
            nextBtn.classList.add('hidden');
            checkBtn.disabled = !hasSelection;
        }

        // Показываем кнопку завершения на последнем проверенном вопросе
        const allQuestionsAnswered = questionStatus.every(status => status !== 'unanswered');
        const isLastQuestion = currentQuestionIndex === shuffledQuestions.length - 1;

        if (isLastQuestion && isAnswered) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            submitBtn.classList.add('hidden');
        }
    }

    // Проверить ответ и показать результат
    function checkAnswer() {
        const question = shuffledQuestions[currentQuestionIndex];
        const userSelected = userAnswers[currentQuestionIndex];
        const correctIndices = question.correctOptionIndices;

        // Находим количество правильных выбранных ответов
        const correctSelected = userSelected.filter(idx => correctIndices.includes(idx)).length;
        const incorrectSelected = userSelected.length - correctSelected;
        const missedCorrect = correctIndices.length - correctSelected;

        // Определяем статус ответа
        let status;
        let feedbackType;

        if (incorrectSelected === 0 && missedCorrect === 0) {
            // Все правильные выбраны, ничего лишнего
            status = 'correct';
            feedbackType = 'correct';
            score += 1;
        } else if (correctSelected > 0 && (incorrectSelected > 0 || missedCorrect > 0)) {
            // Частично правильно
            status = 'partial';
            feedbackType = 'partial';
            score += 0.5; // Половина балла за частично правильный ответ
        } else {
            // Полностью неправильно
            status = 'incorrect';
            feedbackType = 'incorrect';
        }

        // Сохраняем статус вопроса
        questionStatus[currentQuestionIndex] = status;

        // Показываем обратную связь
        showFeedback(correctSelected, correctIndices.length);

        // Обновляем навигацию
        updateNavigationButtons();

        // Обновляем отображение вариантов
        showQuestion();
    }

    // Показать обратную связь
    function showFeedback(correctSelected = 0, totalCorrect = 0) {
        const question = shuffledQuestions[currentQuestionIndex];
        const status = questionStatus[currentQuestionIndex];

        // Скрываем все виды обратной связи
        correctFeedback.classList.add('hidden');
        partialFeedback.classList.add('hidden');
        incorrectFeedback.classList.add('hidden');

        // Показываем соответствующий вид обратной связи
        switch (status) {
            case 'correct':
                correctFeedback.classList.remove('hidden');
                break;
            case 'partial':
                partialFeedback.classList.remove('hidden');
                partialCorrectCount.textContent = correctSelected;
                totalCorrectCount.textContent = totalCorrect;
                break;
            case 'incorrect':
                incorrectFeedback.classList.remove('hidden');
                correctAnswersText.textContent = question.correctAnswersText;
                break;
        }

        feedbackContainer.classList.remove('hidden');
    }

    // Обновление прогресса
    function updateProgress() {
        const progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;
        progressBar.style.setProperty('--width', `${progress}%`);
        progressText.textContent = `Вопрос ${currentQuestionIndex + 1} из ${shuffledQuestions.length}`;
    }

    // Переход к следующему вопросу
    function nextQuestion() {
        if (currentQuestionIndex < shuffledQuestions.length - 1) {
            currentQuestionIndex++;
            updateProgress();
            showQuestion();
        }
    }

    // Переход к предыдущему вопросу
    function prevQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            updateProgress();
            showQuestion();
        }
    }

    // Завершение теста и подсчет результатов
    function finishQuiz() {
        // Подсчет детальной статистики
        let correctCount = 0;
        let partialCount = 0;
        let incorrectCount = 0;

        questionStatus.forEach(status => {
            switch (status) {
                case 'correct':
                    correctCount++;
                    break;
                case 'partial':
                    partialCount++;
                    break;
                case 'incorrect':
                    incorrectCount++;
                    break;
            }
        });

        // Обновление экрана результатов
        scoreElement.textContent = Math.round(score * 10) / 10; // Округляем до одного знака после запятой
        const percentage = Math.round((score / shuffledQuestions.length) * 100);
        percentageElement.textContent = `${percentage}%`;
        correctCountElement.textContent = correctCount;
        partialCountElement.textContent = partialCount;
        incorrectCountElement.textContent = incorrectCount;

        // Обновление кругового индикатора
        const circle = document.querySelector('.circle');
        circle.style.background = `conic-gradient(#4a00e0 ${percentage}%, #e0e0e0 ${percentage}%)`;

        // Переключение экранов
        quizScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
    }

    // Показать обзор ответов
    function showReview() {
        reviewContainer.innerHTML = '';

        shuffledQuestions.forEach((question, index) => {
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';

            const status = questionStatus[index];
            const userSelected = userAnswers[index];
            const correctIndices = question.correctOptionIndices;

            // Определяем статус для отображения
            let statusText, statusClass;
            switch (status) {
                case 'correct':
                    statusText = 'Правильно';
                    statusClass = 'status-correct';
                    break;
                case 'partial':
                    statusText = 'Частично правильно';
                    statusClass = 'status-partial';
                    break;
                case 'incorrect':
                    statusText = 'Неправильно';
                    statusClass = 'status-incorrect';
                    break;
                default:
                    statusText = 'Не отвечено';
                    statusClass = 'status-incorrect';
            }

            let optionsHTML = '';
            question.options.forEach((option, optionIndex) => {
                let optionClass = '';
                const isCorrect = correctIndices.includes(optionIndex);
                const isSelected = userSelected.includes(optionIndex);

                if (isCorrect && isSelected) {
                    optionClass = 'user-correct';
                } else if (isCorrect && !isSelected) {
                    optionClass = 'correct-answer';
                } else if (!isCorrect && isSelected) {
                    optionClass = 'user-incorrect';
                } else if (status === 'partial' && isSelected && !isCorrect) {
                    optionClass = 'user-partial';
                }

                optionsHTML += `
                    <div class="review-option ${optionClass}">
                        <strong>${letters[optionIndex]})</strong> ${option.text}
                    </div>
                `;
            });

            reviewItem.innerHTML = `
                <div class="review-question">
                    <span>${index + 1}. ${question.text}</span>
                    <span class="question-status ${statusClass}">${statusText}</span>
                </div>
                <div class="review-options">
                    ${optionsHTML}
                </div>
                <div style="margin-top: 15px; font-style: italic;">
                    Ваши ответы: ${userSelected.length > 0
                    ? userSelected.map(idx => letters[idx]).join(', ')
                    : 'нет ответа'}
                </div>
            `;

            reviewContainer.appendChild(reviewItem);
        });

        resultScreen.classList.add('hidden');
        reviewScreen.classList.remove('hidden');
    }

    // Начало теста
    function startQuiz() {
        startScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        initializeQuiz();
    }

    // События
    startBtn.addEventListener('click', startQuiz);
    prevBtn.addEventListener('click', prevQuestion);
    checkBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', nextQuestion);
    submitBtn.addEventListener('click', finishQuiz);
    restartBtn.addEventListener('click', () => {
        resultScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });
    reviewBtn.addEventListener('click', showReview);
    backToResultsBtn.addEventListener('click', () => {
        reviewScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
    });

    // Загружаем вопросы при загрузке страницы
    loadQuestions();
});