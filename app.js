document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('cli-input');
    const historyDiv = document.getElementById('history');
    const clearBtn = document.getElementById('clear-btn');
    const detachBtn = document.getElementById('detach-btn');
    const autocompletePopup = document.getElementById('autocomplete-popup');

    let currentSuggestions = [];
    let selectedSuggestionIndex = -1;
    let typingWord = '';
    let typingWordStart = -1;

    const docs = [
        { name: 'sin', signature: 'sin(x)', desc: 'Sine of a value' },
        { name: 'cos', signature: 'cos(x)', desc: 'Cosine of a value' },
        { name: 'tan', signature: 'tan(x)', desc: 'Tangent of a value' },
        { name: 'sqrt', signature: 'sqrt(x)', desc: 'Square root' },
        { name: 'pow', signature: 'pow(x, y)', desc: 'x to the power of y' },
        { name: 'abs', signature: 'abs(x)', desc: 'Absolute value' },
        { name: 'exp', signature: 'exp(x)', desc: 'Exponent' },
        { name: 'log', signature: 'log(x, [base])', desc: 'Logarithm' },
        { name: 'mean', signature: 'mean(a, b, ...)', desc: 'Average' },
        { name: 'max', signature: 'max(a, b, ...)', desc: 'Maximum' },
        { name: 'min', signature: 'min(a, b, ...)', desc: 'Minimum' },
        { name: 'det', signature: 'det(x)', desc: 'Determinant of a matrix' },
        { name: 'cross', signature: 'cross(x, y)', desc: 'Cross product' },
        { name: 'derivative', signature: 'derivative(expr, var)', desc: 'Calculus derivative' },
        { name: 'simplify', signature: 'simplify(expr)', desc: 'Simplify expression' },
        { name: 'clear', signature: 'clear', desc: 'Clear history' },
        { name: 'help', signature: 'help', desc: 'Show basic help' },
        { name: 'vars', signature: 'vars', desc: 'List defined variables' }
    ];

    // Check if detached mode
    const urlParams = new URLSearchParams(window.location.search);
    const isDetached = urlParams.get('detached') === 'true';
    if (isDetached) {
        document.body.classList.add('detached');
        detachBtn.style.display = 'none'; // hide detach button if already detached
    }

    // Configure math.js to use BigNumbers to avoid precision issues
    const mathObj = math.create(math.all, {
        number: 'BigNumber',
        precision: 14
    });

    let historyLog = [];
    let historyNavIndex = -1;
    let currentInputBuffer = '';
    let currentScope = {};

    // Load history
    chrome.storage.local.get(['calcHistory'], (result) => {
        if (result.calcHistory) {
            historyLog = result.calcHistory;
            
            // Rebuild variable scope from history
            historyLog.forEach(item => {
                if (!item.isError && !item.isHelp) {
                    try {
                        mathObj.evaluate(item.expr, currentScope);
                    } catch(e) {}
                }
            });
            
            renderAllHistory();
        }
    });

    function saveHistory() {
        chrome.storage.local.set({ calcHistory: historyLog });
    }

    function renderHistoryItem(expr, result, isError, isHelp = false) {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const exprDiv = document.createElement('div');
        exprDiv.className = 'history-expr';
        exprDiv.textContent = expr;
        
        const resultDiv = document.createElement('div');
        if (isHelp) {
            resultDiv.className = 'history-info';
        } else {
            resultDiv.className = isError ? 'history-error' : 'history-result';
            
            if (!isError) {
                resultDiv.title = 'Click to copy result';
                resultDiv.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(result);
                        const originalText = resultDiv.textContent;
                        resultDiv.textContent = 'Copied!';
                        resultDiv.style.color = 'var(--accent)';
                        setTimeout(() => {
                            resultDiv.textContent = originalText;
                            resultDiv.style.color = '';
                        }, 800);
                    } catch (err) {
                        console.error('Failed to copy', err);
                    }
                });
            }
        }
        resultDiv.textContent = result;
        
        item.appendChild(exprDiv);
        item.appendChild(resultDiv);
        historyDiv.appendChild(item);
        
        // Auto scroll to bottom
        historyDiv.scrollTop = historyDiv.scrollHeight;
    }

    function renderAllHistory() {
        historyDiv.innerHTML = '';
        historyLog.forEach(item => {
            renderHistoryItem(item.expr, item.result, item.isError, item.isHelp);
        });
    }

    // Autocomplete Logic
    input.addEventListener('input', () => {
        const val = input.value;
        const cursor = input.selectionStart;
        
        const beforeCursor = val.slice(0, cursor);
        const match = beforeCursor.match(/[a-zA-Z]+$/);
        
        if (match) {
            typingWord = match[0].toLowerCase();
            typingWordStart = match.index;
            
            currentSuggestions = docs.filter(d => d.name.startsWith(typingWord));
            
            if (currentSuggestions.length > 0) {
                selectedSuggestionIndex = 0;
                renderAutocomplete();
                return;
            }
        }
        hideAutocomplete();
    });

    function renderAutocomplete() {
        autocompletePopup.innerHTML = '';
        currentSuggestions.forEach((sug, idx) => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item' + (idx === selectedSuggestionIndex ? ' selected' : '');
            
            const sig = document.createElement('div');
            sig.className = 'ac-signature';
            sig.textContent = sug.signature;
            
            const desc = document.createElement('div');
            desc.className = 'ac-desc';
            desc.textContent = sug.desc;
            
            div.appendChild(sig);
            div.appendChild(desc);
            
            // Allow clicking to select
            div.addEventListener('mousedown', (e) => {
                e.preventDefault(); // prevent input blur
                applySuggestion(sug);
            });
            
            autocompletePopup.appendChild(div);
        });
        
        // Auto-scroll to selected item
        const selectedEl = autocompletePopup.querySelector('.selected');
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
        
        autocompletePopup.classList.remove('hidden');
    }

    function hideAutocomplete() {
        autocompletePopup.classList.add('hidden');
        currentSuggestions = [];
        selectedSuggestionIndex = -1;
    }

    function applySuggestion(sug) {
        const val = input.value;
        const before = val.slice(0, typingWordStart);
        const after = val.slice(input.selectionStart);
        
        const isFunc = sug.signature.includes('(');
        const insertText = isFunc ? sug.name + '()' : sug.name;
        
        input.value = before + insertText + after;
        
        if (isFunc) {
            input.selectionStart = input.selectionEnd = before.length + sug.name.length + 1;
        } else {
            input.selectionStart = input.selectionEnd = before.length + insertText.length;
        }
        
        hideAutocomplete();
        input.focus();
    }

    // Handle Input
    input.addEventListener('keydown', (e) => {
        if (!autocompletePopup.classList.contains('hidden')) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedSuggestionIndex = (selectedSuggestionIndex + 1) % currentSuggestions.length;
                renderAutocomplete();
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedSuggestionIndex = (selectedSuggestionIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
                renderAutocomplete();
                return;
            }
            if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (currentSuggestions[selectedSuggestionIndex]) {
                    applySuggestion(currentSuggestions[selectedSuggestionIndex]);
                }
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                hideAutocomplete();
                return;
            }
        }
        
        // Terminal History Navigation
        if (e.key === 'ArrowUp' && autocompletePopup.classList.contains('hidden')) {
            e.preventDefault();
            const exprs = historyLog.filter(h => !h.isHelp).map(h => h.expr);
            if (exprs.length === 0) return;

            if (historyNavIndex === -1) {
                currentInputBuffer = input.value;
                historyNavIndex = exprs.length - 1;
            } else if (historyNavIndex > 0) {
                historyNavIndex--;
            }
            
            input.value = exprs[historyNavIndex];
            setTimeout(() => input.selectionStart = input.selectionEnd = input.value.length, 0);
        }

        if (e.key === 'ArrowDown' && autocompletePopup.classList.contains('hidden')) {
            e.preventDefault();
            const exprs = historyLog.filter(h => !h.isHelp).map(h => h.expr);
            
            if (historyNavIndex !== -1) {
                if (historyNavIndex < exprs.length - 1) {
                    historyNavIndex++;
                    input.value = exprs[historyNavIndex];
                } else {
                    historyNavIndex = -1;
                    input.value = currentInputBuffer;
                }
            }
        }

        if (e.key === 'Enter') {
            const expr = input.value.trim();
            if (!expr) return;
            
            historyNavIndex = -1;
            currentInputBuffer = '';
            
            if (expr.toLowerCase() === 'clear') {
                clearHistory();
                input.value = '';
                return;
            }

            if (expr.toLowerCase() === 'help') {
                const helpText = `Available Functions & Constants:
• Basic: +, -, *, /, %, ^, **
• Constants: pi, e, phi
• Algebra: sqrt(x), pow(x, y), abs(x), exp(x), log(x)
• Trig: sin(x), cos(x), tan(x) (use 'deg' for degrees, e.g. sin(45 deg))
• Rounding: round(x), floor(x), ceil(x)
• Commands: clear, help, help advanced`;
                historyLog.push({ expr, result: helpText, isError: false, isHelp: true });
                renderHistoryItem(expr, helpText, false, true);
                saveHistory();
                input.value = '';
                return;
            }

            if (expr.toLowerCase() === 'vars') {
                const keys = Object.keys(currentScope);
                let text = "Defined Variables:\n";
                if (keys.length === 0) {
                    text += "(None)";
                } else {
                    keys.forEach(k => {
                        let val = currentScope[k];
                        if (typeof val === 'function' || val?.syntax) {
                            text += `• ${k} = [Function]\n`;
                        } else {
                            text += `• ${k} = ${mathObj.format(val, { precision: 14 })}\n`;
                        }
                    });
                }
                historyLog.push({ expr, result: text.trim(), isError: false, isHelp: true });
                renderHistoryItem(expr, text.trim(), false, true);
                saveHistory();
                input.value = '';
                return;
            }

            if (expr.toLowerCase() === 'help advanced') {
                const helpText = `Advanced Math.js Features:
• Variables: x = 5, y = x * 2, f(x) = x^2
• Units: 5 cm to inch, 100 km/h to mph
• Stats: mean([1,2,3]), max(10,20), factorial(5)
• Matrices: det([1,2; 3,4]), cross([1,1,0], [0,1,1])
• Complex: sqrt(-4), (2 + 3i) * 2i
• Calculus: derivative('x^2 + 2x', 'x')
• Logic: 5 & 3 (bitwise AND), true and false`;
                historyLog.push({ expr, result: helpText, isError: false, isHelp: true });
                renderHistoryItem(expr, helpText, false, true);
                saveHistory();
                input.value = '';
                return;
            }

            try {
                // Evaluate using math.js with the current scope
                let evalResult = mathObj.evaluate(expr, currentScope);
                
                // Format the output
                const formattedResult = mathObj.format(evalResult, { precision: 14 });
                
                // Push to history
                historyLog.push({ expr, result: formattedResult, isError: false });
                renderHistoryItem(expr, formattedResult, false);
            } catch (err) {
                historyLog.push({ expr, result: err.message, isError: true });
                renderHistoryItem(expr, err.message, true);
            }

            // Keep history log manageable (last 100 items)
            if (historyLog.length > 100) {
                historyLog.shift();
            }

            saveHistory();
            input.value = '';
        }
        
        // Quick clear with Ctrl+L
        if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            clearHistory();
        }
        
        // Quick copy last result with Ctrl+C (if no text is selected)
        if (e.key === 'c' && (e.ctrlKey || e.metaKey) && input.selectionStart === input.selectionEnd) {
            const lastCalc = historyLog.filter(h => !h.isHelp && !h.isError).pop();
            if (lastCalc) {
                e.preventDefault();
                navigator.clipboard.writeText(lastCalc.result).then(() => {
                    const oldPlaceholder = input.placeholder;
                    input.placeholder = `Copied: ${lastCalc.result}`;
                    setTimeout(() => input.placeholder = oldPlaceholder, 1500);
                }).catch(err => console.error('Failed to copy', err));
            }
        }
    });

    function clearHistory() {
        historyLog = [];
        currentScope = {};
        saveHistory();
        renderAllHistory();
    }

    clearBtn.addEventListener('click', clearHistory);

    detachBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'detach' }, () => {
            // Close the popup only after the background script acknowledges the message
            window.close();
        });
    });

    // Ensure input keeps focus when clicking around
    document.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
            input.focus();
        }
    });
});
