class SmartCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = JSON.parse(localStorage.getItem('calendarEvents')) || {};
        this.savings = JSON.parse(localStorage.getItem('savingsData')) || [];
        this.sobrietyStartDate = localStorage.getItem('sobrietyStartDate');
        this.meditationSessions = JSON.parse(localStorage.getItem('meditationSessions')) || [];
        this.timerState = {
            minutes: 5,
            seconds: 0,
            isRunning: false,
            intervalId: null
        };
        this.init();
    }

    init() {
        this.renderCalendar();
        this.setupEventListeners();
        this.initializeMeditationTimer();
        this.renderSavingsHistory();
        this.updateSavingsStats();
        this.updateSobrietyDisplay();
        this.updateMeditationStats();
    }

    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        document.getElementById('addEventBtn').addEventListener('click', () => {
            this.openEventModal();
        });

        document.getElementById('addSavingBtn').addEventListener('click', () => {
            this.openSavingModal();
        });

        document.getElementById('progressBtn').addEventListener('click', () => {
            this.openProgressModal();
        });

        document.getElementById('sobrietyBtn').addEventListener('click', () => {
            this.openSobrietyModal();
        });

        document.getElementById('saveEvent').addEventListener('click', () => {
            this.saveEvent();
        });

        document.getElementById('saveSaving').addEventListener('click', () => {
            this.saveSaving();
        });

        document.getElementById('setSobrietyStart').addEventListener('click', () => {
            this.setSobrietyStart();
        });

        document.getElementById('resetSobriety').addEventListener('click', () => {
            this.resetSobriety();
        });

        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // 瞑想タイマーのイベントリスナー
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTimerPreset(parseInt(btn.dataset.minutes));
            });
        });

        document.getElementById('startPauseBtn').addEventListener('click', () => {
            this.toggleTimer();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetTimer();
        });

        window.addEventListener('click', (e) => {
            const eventModal = document.getElementById('eventModal');
            const savingModal = document.getElementById('savingModal');
            const progressModal = document.getElementById('progressModal');
            const sobrietyModal = document.getElementById('sobrietyModal');
            if (e.target === eventModal) {
                this.closeEventModal();
            }
            if (e.target === savingModal) {
                this.closeSavingModal();
            }
            if (e.target === progressModal) {
                this.closeProgressModal();
            }
            if (e.target === sobrietyModal) {
                this.closeSobrietyModal();
            }
        });
    }

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const currentMonth = document.getElementById('currentMonth');
        
        calendar.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        currentMonth.textContent = `${year}年 ${month + 1}月`;
        
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        weekdays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-header';
            dayElement.textContent = day;
            calendar.appendChild(dayElement);
        });
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        for (let i = 0; i < 42; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = currentDay.getDate();
            
            const dateKey = this.getDateKey(currentDay);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            currentDay.setHours(0, 0, 0, 0);
            
            if (currentDay.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            // 今日の日付をハイライト
            if (currentDay.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }
            
            if (this.events[dateKey] && this.events[dateKey].length > 0) {
                dayElement.classList.add('has-events');
                const dot = document.createElement('div');
                dot.className = 'event-dot';
                dayElement.appendChild(dot);
            }

            if (this.sobrietyStartDate) {
                const startDate = new Date(this.sobrietyStartDate);
                startDate.setHours(0, 0, 0, 0);
                
                if (currentDay >= startDate) {
                    // 現在表示中の月の日付のみスタイルを適用
                    if (currentDay.getMonth() === month) {
                        dayElement.classList.add('sobriety-day');
                    }
                    
                    const daysDiff = Math.floor((currentDay - startDate) / (1000 * 60 * 60 * 24)) + 1;
                    
                    if (daysDiff > 0 && currentDay <= today) {
                        const counter = document.createElement('div');
                        counter.className = 'sobriety-counter';
                        
                        // 過去・現在・未来で表示を分ける
                        if (currentDay.getTime() < today.getTime()) {
                            // 過去の日付
                            counter.classList.add('past');
                            counter.textContent = daysDiff;
                        } else if (currentDay.getTime() === today.getTime()) {
                            // 今日
                            counter.classList.add('today-counter');
                            counter.textContent = `${daysDiff}日目`;
                        }
                        
                        // 現在表示中の月の日付のみカウンターを表示
                        if (currentDay.getMonth() === month) {
                            dayElement.appendChild(counter);
                        }
                    }
                }
            }
            
            dayElement.addEventListener('click', () => {
                this.selectDate(currentDay);
            });
            
            calendar.appendChild(dayElement);
        }
    }

    selectDate(date) {
        this.selectedDate = date;
        
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        event.target.classList.add('selected');
        
        this.showDayInfo(date);
        this.showDaySavings(date);
    }

    showDayInfo(date) {
        const dayInfo = document.getElementById('dayInfo');
        const selectedDate = document.getElementById('selectedDate');
        const eventsContainer = document.getElementById('events');
        
        const dateKey = this.getDateKey(date);
        const events = this.events[dateKey] || [];
        
        selectedDate.textContent = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        
        eventsContainer.innerHTML = '';
        
        if (events.length === 0) {
            eventsContainer.innerHTML = '<p style="color: #666;">予定はありません</p>';
        } else {
            events.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event-item';
                eventElement.innerHTML = `
                    <div class="event-title">${event.title}</div>
                    <div class="event-description">${event.description}</div>
                `;
                eventsContainer.appendChild(eventElement);
            });
        }
        
        dayInfo.style.display = 'block';
    }

    openEventModal() {
        if (!this.selectedDate) {
            alert('日付を選択してください');
            return;
        }
        document.getElementById('eventModal').style.display = 'flex';
        document.getElementById('eventTitle').focus();
    }

    closeEventModal() {
        document.getElementById('eventModal').style.display = 'none';
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventDescription').value = '';
    }

    saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const description = document.getElementById('eventDescription').value.trim();
        
        if (!title) {
            alert('タイトルを入力してください');
            return;
        }
        
        if (!this.selectedDate) {
            alert('日付を選択してください');
            return;
        }
        
        const dateKey = this.getDateKey(this.selectedDate);
        
        if (!this.events[dateKey]) {
            this.events[dateKey] = [];
        }
        
        this.events[dateKey].push({
            title: title,
            description: description,
            id: Date.now()
        });
        
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        
        this.closeEventModal();
        this.renderCalendar();
        this.showDayInfo(this.selectedDate);
    }

    getDateKey(date) {
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }

    openSavingModal() {
        if (!this.selectedDate) {
            alert('日付を選択してください');
            return;
        }
        document.getElementById('savingModal').style.display = 'flex';
        document.getElementById('savingAmount').focus();
    }

    closeSavingModal() {
        document.getElementById('savingModal').style.display = 'none';
        document.getElementById('savingAmount').value = '';
        document.getElementById('savingCategory').value = '食費';
        document.getElementById('savingDescription').value = '';
    }

    closeAllModals() {
        this.closeEventModal();
        this.closeSavingModal();
        this.closeProgressModal();
        this.closeSobrietyModal();
    }

    openProgressModal() {
        document.getElementById('progressModal').style.display = 'flex';
        this.updateProgressData();
    }

    closeProgressModal() {
        document.getElementById('progressModal').style.display = 'none';
    }

    openSobrietyModal() {
        document.getElementById('sobrietyModal').style.display = 'flex';
        if (this.sobrietyStartDate) {
            document.getElementById('sobrietyStartDate').value = this.sobrietyStartDate;
        }
    }

    closeSobrietyModal() {
        document.getElementById('sobrietyModal').style.display = 'none';
    }

    setSobrietyStart() {
        const startDate = document.getElementById('sobrietyStartDate').value;
        if (!startDate) {
            alert('開始日を選択してください');
            return;
        }
        
        this.sobrietyStartDate = startDate;
        localStorage.setItem('sobrietyStartDate', startDate);
        
        this.closeSobrietyModal();
        this.renderCalendar();
        this.updateSobrietyDisplay();
    }

    resetSobriety() {
        if (confirm('断酒記録をリセットしますか？')) {
            this.sobrietyStartDate = null;
            localStorage.removeItem('sobrietyStartDate');
            this.closeSobrietyModal();
            this.renderCalendar();
            this.updateSobrietyDisplay();
        }
    }

    getDailyEncouragementMessage(daysDiff) {
        // 段階別の基本メッセージ
        let levelMessage = '';
        if (daysDiff >= 365) {
            levelMessage = '🏆 1年以上継続中！';
        } else if (daysDiff >= 100) {
            levelMessage = '🎉 100日以上継続中！';
        } else if (daysDiff >= 30) {
            levelMessage = '👏 1ヶ月以上継続中！';
        } else if (daysDiff >= 7) {
            levelMessage = '✨ 1週間以上継続中！';
        } else {
            levelMessage = '💪 頑張って継続中！';
        }
        
        // 毎日変わる応援メッセージ（日付ベース）
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        
        const encouragementMessages = [
            '今日も一歩前進！',
            '素晴らしい継続力です！',
            'あなたの意志の強さに拍手！',
            '健康への道を歩んでいます！',
            '毎日の積み重ねが力になる！',
            '自分を誇りに思ってください！',
            '新しい習慣が身についてきました！',
            '心も体も軽やかに！',
            '目標に向かって順調です！',
            '明日への希望が輝いています！',
            'あなたの決意は本物です！',
            '健康的な毎日を送っています！',
            '自分らしい生活を楽しんで！',
            '内側から輝いています！',
            '新しい自分に出会えました！',
            '穏やかな心で過ごしています！',
            '体調の変化を感じていますか？',
            '精神的な強さが育っています！',
            '良い選択を続けています！',
            '前向きなエネルギーが溢れています！',
            '自制心が鍛えられています！',
            '健康第一の生活です！',
            '心の平穏を手に入れました！',
            '新しい趣味を見つけるチャンス！',
            '睡眠の質が向上しています！',
            '集中力がアップしています！',
            'お財布にも優しい選択！',
            '家族や友人も応援しています！',
            '自分への投資を続けています！',
            '今日という日を大切に！'
        ];
        
        const messageIndex = dayOfYear % encouragementMessages.length;
        const dailyEncouragement = encouragementMessages[messageIndex];
        
        return `${levelMessage} ${dailyEncouragement}`;
    }

    updateSobrietyDisplay() {
        const sobrietyDisplay = document.getElementById('sobrietyDisplay');
        const sobrietyDays = document.getElementById('sobrietyDays');
        const sobrietyMessage = document.getElementById('sobrietyMessage');
        
        if (this.sobrietyStartDate) {
            const startDate = new Date(this.sobrietyStartDate);
            const today = new Date();
            const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
            
            sobrietyDays.textContent = `断酒${daysDiff}日目`;
            
            // 毎日変わる応援メッセージを取得
            const dailyMessage = this.getDailyEncouragementMessage(daysDiff);
            sobrietyMessage.textContent = dailyMessage;
            
            sobrietyDisplay.style.display = 'block';
        } else {
            sobrietyDisplay.style.display = 'none';
        }
    }

    saveSaving() {
        const amount = parseInt(document.getElementById('savingAmount').value);
        const category = document.getElementById('savingCategory').value;
        const description = document.getElementById('savingDescription').value.trim();
        
        if (!amount || amount <= 0) {
            alert('有効な金額を入力してください');
            return;
        }
        
        if (!this.selectedDate) {
            alert('日付を選択してください');
            return;
        }
        
        const saving = {
            id: Date.now(),
            date: new Date(this.selectedDate),
            amount: amount,
            category: category,
            description: description
        };
        
        this.savings.push(saving);
        this.savings.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        localStorage.setItem('savingsData', JSON.stringify(this.savings));
        
        this.closeSavingModal();
        this.renderSavingsHistory();
        this.updateSavingsStats();
        this.showDaySavings(this.selectedDate);
    }

    showDaySavings(date) {
        const savingsInfo = document.getElementById('savingsInfo');
        const dateKey = this.getDateKey(date);
        
        const daySavings = this.savings.filter(saving => {
            const savingDate = new Date(saving.date);
            return this.getDateKey(savingDate) === dateKey;
        });
        
        savingsInfo.innerHTML = '';
        
        if (daySavings.length > 0) {
            const totalAmount = daySavings.reduce((sum, saving) => sum + saving.amount, 0);
            savingsInfo.innerHTML = `
                <h4 style="color: #28a745; margin-bottom: 10px;">この日の節約: ¥${totalAmount.toLocaleString()}</h4>
            `;
            
            daySavings.forEach(saving => {
                const savingElement = document.createElement('div');
                savingElement.className = 'saving-item';
                savingElement.innerHTML = `
                    <div class="saving-amount">¥${saving.amount.toLocaleString()}</div>
                    <div class="saving-category">${saving.category} - ${saving.description}</div>
                `;
                savingsInfo.appendChild(savingElement);
            });
        }
    }

    renderSavingsHistory() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        
        if (this.savings.length === 0) {
            historyList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">節約記録がありません</p>';
            return;
        }
        
        this.savings.forEach(saving => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(saving.date);
            const formattedDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            
            historyItem.innerHTML = `
                <div class="history-header">
                    <span class="history-amount">¥${saving.amount.toLocaleString()}</span>
                    <span class="history-date">${formattedDate}</span>
                </div>
                <div class="history-category">${saving.category}</div>
                <div class="history-description">${saving.description}</div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    updateSavingsStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyTotal = this.savings.filter(saving => {
            const date = new Date(saving.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).reduce((sum, saving) => sum + saving.amount, 0);
        
        const totalSavings = this.savings.reduce((sum, saving) => sum + saving.amount, 0);
        
        document.getElementById('monthlyTotal').textContent = `¥${monthlyTotal.toLocaleString()}`;
        document.getElementById('totalSavings').textContent = `¥${totalSavings.toLocaleString()}`;
    }

    initializeMeditationTimer() {
        this.updateTimerDisplay();
        this.updateMeditationStats();
    }

    setTimerPreset(minutes) {
        this.timerState.minutes = minutes;
        this.timerState.seconds = 0;
        this.timerState.isRunning = false;
        
        // プリセットボタンのアクティブ状態を更新
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-minutes="${minutes}"]`).classList.add('active');
        
        // 開始ボタンを有効化
        document.getElementById('startPauseBtn').disabled = false;
        document.getElementById('startPauseBtn').textContent = '開始';
        
        this.updateTimerDisplay();
        document.getElementById('timerStatus').textContent = `${minutes}分の瞑想を開始できます`;
    }

    toggleTimer() {
        if (this.timerState.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        this.timerState.isRunning = true;
        document.getElementById('startPauseBtn').textContent = '一時停止';
        document.getElementById('timerStatus').textContent = '瞑想中...';
        
        // プリセットボタンを無効化
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.disabled = true;
        });
        
        this.timerState.intervalId = setInterval(() => {
            if (this.timerState.seconds > 0) {
                this.timerState.seconds--;
            } else if (this.timerState.minutes > 0) {
                this.timerState.minutes--;
                this.timerState.seconds = 59;
            } else {
                this.completeTimer();
                return;
            }
            this.updateTimerDisplay();
        }, 1000);
    }

    pauseTimer() {
        this.timerState.isRunning = false;
        clearInterval(this.timerState.intervalId);
        document.getElementById('startPauseBtn').textContent = '再開';
        document.getElementById('timerStatus').textContent = '一時停止中';
    }

    resetTimer() {
        this.timerState.isRunning = false;
        clearInterval(this.timerState.intervalId);
        this.timerState.minutes = 5;
        this.timerState.seconds = 0;
        
        document.getElementById('startPauseBtn').textContent = '開始';
        document.getElementById('startPauseBtn').disabled = true;
        document.getElementById('timerStatus').textContent = '時間を選択してください';
        
        // プリセットボタンを有効化してリセット
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('active');
        });
        
        this.updateTimerDisplay();
    }

    completeTimer() {
        this.timerState.isRunning = false;
        clearInterval(this.timerState.intervalId);
        
        // 瞑想セッションを記録
        const activePreset = document.querySelector('.preset-btn.active');
        const duration = activePreset ? parseInt(activePreset.dataset.minutes) : 5;
        
        this.recordMeditationSession(duration);
        
        document.getElementById('timerStatus').textContent = '🎉 瞑想完了！お疲れ様でした';
        document.getElementById('startPauseBtn').disabled = true;
        
        // 完了音（ブラウザのbeep音）
        if ('AudioContext' in window || 'webkitAudioContext' in window) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        }
        
        // 3秒後にリセット
        setTimeout(() => {
            this.resetTimer();
        }, 3000);
    }

    updateTimerDisplay() {
        const minutes = this.timerState.minutes.toString().padStart(2, '0');
        const seconds = this.timerState.seconds.toString().padStart(2, '0');
        document.getElementById('timeLeft').textContent = `${minutes}:${seconds}`;
    }

    recordMeditationSession(duration) {
        const session = {
            date: new Date().toDateString(),
            duration: duration,
            timestamp: Date.now()
        };
        
        this.meditationSessions.push(session);
        localStorage.setItem('meditationSessions', JSON.stringify(this.meditationSessions));
        this.updateMeditationStats();
    }

    updateMeditationStats() {
        const today = new Date().toDateString();
        const todayMinutes = this.meditationSessions
            .filter(session => session.date === today)
            .reduce((total, session) => total + session.duration, 0);
        
        const totalMinutes = this.meditationSessions
            .reduce((total, session) => total + session.duration, 0);
        
        document.getElementById('todayMeditation').textContent = `${todayMinutes}分`;
        document.getElementById('totalMeditation').textContent = `${totalMinutes}分`;
    }

    getSavingsThisMonth() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return this.savings.filter(saving => {
            const date = new Date(saving.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).reduce((sum, saving) => sum + saving.amount, 0);
    }

    getTotalSavings() {
        return this.savings.reduce((sum, saving) => sum + saving.amount, 0);
    }

    updateProgressData() {
        const monthlyTotal = this.getSavingsThisMonth();
        const totalSavings = this.getTotalSavings();
        const sobrietyDays = this.getSobrietyDays();
        const sobrietySaved = this.getSobrietySavings();

        document.getElementById('progressMonthlyTotal').textContent = `¥${monthlyTotal.toLocaleString()}`;
        document.getElementById('progressTotalSavings').textContent = `¥${totalSavings.toLocaleString()}`;
        document.getElementById('progressSobrietyDays').textContent = `${sobrietyDays}日`;
        document.getElementById('progressSobrietySaved').textContent = `¥${sobrietySaved.toLocaleString()}`;

        this.renderCategoryChart();
        this.renderProgressHistory();
    }

    getDailyAverage() {
        if (this.savings.length === 0) return 0;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const currentDay = now.getDate();
        
        const monthlyTotal = this.getSavingsThisMonth();
        return Math.round(monthlyTotal / currentDay);
    }

    getBestDay() {
        if (this.savings.length === 0) return 0;
        
        const dailyTotals = {};
        this.savings.forEach(saving => {
            const date = new Date(saving.date);
            const dateKey = this.getDateKey(date);
            dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + saving.amount;
        });
        
        return Math.max(...Object.values(dailyTotals));
    }

    renderCategoryChart() {
        const categoryChart = document.getElementById('categoryChart');
        categoryChart.innerHTML = '';
        
        const categoryTotals = {};
        this.savings.forEach(saving => {
            categoryTotals[saving.category] = (categoryTotals[saving.category] || 0) + saving.amount;
        });
        
        const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
        
        if (totalAmount === 0) {
            categoryChart.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">まだ節約記録がありません</p>';
            return;
        }
        
        Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, amount]) => {
                const percentage = (amount / totalAmount) * 100;
                
                const categoryBar = document.createElement('div');
                categoryBar.className = 'category-bar';
                categoryBar.innerHTML = `
                    <div class="category-name">${category}</div>
                    <div class="category-progress">
                        <div class="category-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="category-amount">¥${amount.toLocaleString()}</div>
                `;
                
                categoryChart.appendChild(categoryBar);
            });
    }

    renderProgressHistory() {
        const progressHistoryList = document.getElementById('progressHistoryList');
        progressHistoryList.innerHTML = '';
        
        if (this.savings.length === 0) {
            progressHistoryList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">まだ節約記録がありません</p>';
            return;
        }
        
        const recentSavings = this.savings.slice(0, 10);
        
        recentSavings.forEach(saving => {
            const date = new Date(saving.date);
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
            
            const historyItem = document.createElement('div');
            historyItem.className = 'progress-history-item';
            historyItem.innerHTML = `
                <div class="progress-history-info">
                    <div class="progress-history-amount">¥${saving.amount.toLocaleString()}</div>
                    <div class="progress-history-details">${saving.category} - ${saving.description}</div>
                </div>
                <div class="progress-history-date">${formattedDate}</div>
            `;
            
            progressHistoryList.appendChild(historyItem);
        });
    }

    getSobrietyDays() {
        if (!this.sobrietyStartDate) return 0;
        
        const startDate = new Date(this.sobrietyStartDate);
        const today = new Date();
        return Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    }

    getSobrietySavings() {
        const days = this.getSobrietyDays();
        const averageDailyCost = 500; // 1日のお酒代を500円と仮定
        return days * averageDailyCost;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SmartCalendar();
});