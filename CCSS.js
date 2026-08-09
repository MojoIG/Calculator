(function() {
    'use strict';

    // DOM elements
    const resultDisplay = document.getElementById('resultDisplay');
    const expressionDisplay = document.getElementById('expressionDisplay');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');

    // State
    let currentInput = '0';
    let previousInput = '';
    let operator = null;
    let shouldResetInput = false;
    let justEvaluated = false;
    
    // For repeat operation feature
    let lastOperand = '';
    let lastOperator = null;

    // History
    let history = [];

    // Helper: update display
    function updateDisplay() {
        let displayValue = currentInput;
        if (displayValue.length > 14) {
            if (!isNaN(displayValue) && displayValue !== 'Error' && displayValue !== 'Infinity') {
                const num = parseFloat(displayValue);
                if (!isNaN(num) && isFinite(num)) {
                    if (displayValue.includes('.')) {
                        displayValue = num.toPrecision(10);
                    } else {
                        displayValue = num.toString();
                    }
                }
            }
        }
        resultDisplay.textContent = displayValue || '0';

        if (operator && previousInput) {
            const opSymbol = operator === '*' ? '×' : operator === '/' ? '÷' : operator;
            expressionDisplay.textContent = `${previousInput} ${opSymbol}`;
        } else if (justEvaluated && lastOperator && lastOperand) {
            const opSymbol = lastOperator === '*' ? '×' : lastOperator === '/' ? '÷' : lastOperator;
            expressionDisplay.textContent = `${currentInput} ${opSymbol} ${lastOperand}`;
        } else {
            expressionDisplay.textContent = '';
        }
    }

    // Update history display
    function updateHistory() {
        if (history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
            return;
        }

        historyList.innerHTML = history.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">= ${item.result}</div>
            </div>
        `).join('');

        // Add click listeners to history items
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                loadHistoryItem(index);
            });
        });

        // Scroll to bottom to show latest
        historyList.scrollTop = historyList.scrollHeight;
    }

    // Load a history item into the calculator
    function loadHistoryItem(index) {
        const item = history[index];
        if (!item) return;

        // Set the result as current input
        currentInput = item.result;
        previousInput = '';
        operator = null;
        shouldResetInput = true;
        justEvaluated = false;
        lastOperand = '';
        lastOperator = null;
        updateDisplay();
    }

    // Add entry to history
    function addHistoryEntry(expression, result) {
        history.push({ expression, result });
        // Keep history limited to 50 entries to prevent memory issues
        if (history.length > 50) {
            history.shift();
        }
        updateHistory();
    }

    // Clear all history
    function clearHistory() {
        history = [];
        updateHistory();
    }

    // Core: evaluate expression
    function evaluate(a, op, b) {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (isNaN(numA) || isNaN(numB)) return 'Error';

        let result;
        switch (op) {
            case '+':
                result = numA + numB;
                break;
            case '-':
                result = numA - numB;
                break;
            case '*':
                result = numA * numB;
                break;
            case '/':
                if (numB === 0) return 'Cannot divide by zero';
                result = numA / numB;
                break;
            default:
                return 'Error';
        }

        if (typeof result === 'number' && !Number.isInteger(result)) {
            result = parseFloat(result.toPrecision(12));
        }
        return result.toString();
    }

    // Handle number input
    function inputNumber(value) {
        if (shouldResetInput || justEvaluated) {
            currentInput = '0';
            shouldResetInput = false;
            justEvaluated = false;
            if (!operator) {
                lastOperand = '';
                lastOperator = null;
            }
        }

        if (value === '.' && currentInput.includes('.')) return;
        if (currentInput === '0' && value !== '.') {
            currentInput = value;
        } else {
            currentInput += value;
        }
        updateDisplay();
    }

    // Handle operator
    function handleOperator(op) {
        const currentVal = currentInput;

        if (operator && previousInput && !shouldResetInput) {
            const result = evaluate(previousInput, operator, currentVal);
            if (result === 'Error' || result === 'Cannot divide by zero') {
                currentInput = result;
                operator = null;
                previousInput = '';
                shouldResetInput = true;
                lastOperand = '';
                lastOperator = null;
                updateDisplay();
                return;
            }
            currentInput = result;
        }

        lastOperand = currentInput;
        lastOperator = op;
        
        previousInput = currentInput;
        operator = op;
        shouldResetInput = true;
        justEvaluated = false;
        updateDisplay();
    }

    // Evaluate (equals) with repeat functionality
    function evaluateEquals() {
        let expression = '';
        let result = '';

        // If we have a last operation stored and we're in a state to repeat
        if (justEvaluated && lastOperator && lastOperand) {
            const opSymbol = lastOperator === '*' ? '×' : lastOperator === '/' ? '÷' : lastOperator;
            expression = `${currentInput} ${opSymbol} ${lastOperand}`;
            result = evaluate(currentInput, lastOperator, lastOperand);
            
            if (result === 'Error' || result === 'Cannot divide by zero') {
                currentInput = result;
                operator = null;
                previousInput = '';
                lastOperand = '';
                lastOperator = null;
                shouldResetInput = true;
                justEvaluated = false;
                updateDisplay();
                return;
            }
            
            // Add to history before updating currentInput
            addHistoryEntry(expression, result);
            
            currentInput = result;
            updateDisplay();
            return;
        }

        // Normal evaluation
        if (!operator || !previousInput) {
            justEvaluated = true;
            shouldResetInput = true;
            updateDisplay();
            return;
        }

        const currentVal = currentInput;
        const opSymbol = operator === '*' ? '×' : operator === '/' ? '÷' : operator;
        expression = `${previousInput} ${opSymbol} ${currentVal}`;
        result = evaluate(previousInput, operator, currentVal);
        
        if (result === 'Error' || result === 'Cannot divide by zero') {
            currentInput = result;
            operator = null;
            previousInput = '';
            shouldResetInput = true;
            lastOperand = '';
            lastOperator = null;
            justEvaluated = false;
            updateDisplay();
            return;
        }

        // Store the operation for repeat
        lastOperand = currentInput;
        lastOperator = operator;
        
        // Add to history
        addHistoryEntry(expression, result);
        
        currentInput = result;
        operator = null;
        previousInput = '';
        shouldResetInput = true;
        justEvaluated = true;
        updateDisplay();
    }

    // Clear all
    function clearAll() {
        currentInput = '0';
        previousInput = '';
        operator = null;
        shouldResetInput = false;
        justEvaluated = false;
        lastOperand = '';
        lastOperator = null;
        updateDisplay();
    }

    // Backspace
    function backspace() {
        if (shouldResetInput || justEvaluated) {
            clearAll();
            return;
        }
        if (currentInput.length > 1) {
            currentInput = currentInput.slice(0, -1);
        } else {
            currentInput = '0';
        }
        updateDisplay();
    }

    // Percent
    function percent() {
        const num = parseFloat(currentInput);
        if (isNaN(num)) return;
        currentInput = (num / 100).toString();
        justEvaluated = false;
        shouldResetInput = false;
        updateDisplay();
    }

    // Handle button clicks
    function handleButtonClick(value) {
        if (/^[0-9.]$/.test(value)) {
            inputNumber(value);
            return;
        }

        switch (value) {
            case '+':
            case '-':
            case '×':
            case '÷':
                let op = value === '×' ? '*' : value === '÷' ? '/' : value;
                handleOperator(op);
                break;
            case '=':
                evaluateEquals();
                break;
            case 'clear':
                clearAll();
                break;
            case 'backspace':
                backspace();
                break;
            case 'percent':
                percent();
                break;
            default:
                break;
        }
    }

    // Event listeners
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const value = btn.dataset.value;
            if (value !== undefined) {
                handleButtonClick(value);
            }
        });
    });

    // Clear history button
    clearHistoryBtn.addEventListener('click', clearHistory);

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        const key = e.key;

        if (/^[0-9.]$/.test(key) ||
            ['+', '-', '*', '/', 'Enter', '=', 'Backspace', 'Escape', '%'].includes(key)) {
            e.preventDefault();
        }

        if (/^[0-9.]$/.test(key)) {
            handleButtonClick(key);
            return;
        }

        switch (key) {
            case '+':
            case '-':
                handleButtonClick(key);
                break;
            case '*':
                handleButtonClick('×');
                break;
            case '/':
                handleButtonClick('÷');
                break;
            case 'Enter':
            case '=':
                handleButtonClick('=');
                break;
            case 'Backspace':
                handleButtonClick('backspace');
                break;
            case 'Escape':
            case 'c':
            case 'C':
                handleButtonClick('clear');
                break;
            case '%':
                handleButtonClick('percent');
                break;
            default:
                break;
        }
    });

    // ----- SHOOTING STARS GENERATOR -----
    (function initShootingStars() {
        const container = document.getElementById('starfield');
        if (!container) return;

        const STAR_COUNT = 24;

        const rand = (min, max) => Math.random() * (max - min) + min;

        function createShootingStar() {
            const star = document.createElement('div');
            star.className = 'shooting-star';

            star.style.left = rand(0, 95) + '%';
            star.style.top = rand(0, 90) + '%';

            star.style.animationDuration = rand(4.5, 10) + 's';
            star.style.animationDelay = rand(0, 10) + 's';

            const size = rand(2, 4.5);
            star.style.width = size + 'px';
            star.style.height = size + 'px';

            const tailLength = rand(40, 120);
            star.style.setProperty('--tail-length', tailLength + 'px');

            const glowLength = tailLength * 1.6;
            star.style.setProperty('--glow-length', glowLength + 'px');

            return star;
        }

        const styleTag = document.createElement('style');
        styleTag.textContent = `
            .shooting-star::before {
                width: var(--tail-length, 70px);
            }
            .shooting-star::after {
                width: var(--glow-length, 120px);
            }
        `;
        document.head.appendChild(styleTag);

        const stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            const star = createShootingStar();
            container.appendChild(star);
            stars.push(star);
        }

        for (let i = 0; i < 8; i++) {
            const star = document.createElement('div');
            star.className = 'shooting-star';
            star.style.left = rand(0, 95) + '%';
            star.style.top = rand(0, 90) + '%';
            star.style.animationDuration = rand(2.5, 4.5) + 's';
            star.style.animationDelay = rand(0, 8) + 's';
            star.style.width = '2px';
            star.style.height = '2px';
            star.style.setProperty('--tail-length', rand(30, 70) + 'px');
            star.style.setProperty('--glow-length', rand(50, 110) + 'px');
            container.appendChild(star);
            stars.push(star);
        }

        console.log(`✨ ${stars.length} shooting stars launched`);
    })();

    // Initialize
    updateDisplay();
    updateHistory();
})();