class SmartCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.currentUser = null;
        this.events = {};
        this.savings = [];
        this.sobrietyStartDate = null;
        this.checkLogin();
    }

    checkLogin() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = savedUser;
            this.loadUserData();
            this.hideLoginOverlay();
            this.init();
        } else {
            this.showLoginOverlay();
        }
    }

    showLoginOverlay() {
        document.getElementById('loginOverlay').style.display = 'flex';
        this.renderRecentUsers();
        this.setupLoginListeners();
    }

    hideLoginOverlay() {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('currentUsername').textContent = this.currentUser;
    }

    setupLoginListeners() {
        const loginBtn = document.getElementById('loginBtn');
        const usernameInput = document.getElementById('usernameInput');
        
        loginBtn.addEventListener('click', () => {
            this.login();
        });
        
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.login();
            }
        });
        
        usernameInput.focus();
    }

    login() {
        const username = document.getElementById('usernameInput').value.trim();
        if (username) {
            this.currentUser = username;
            this.saveCurrentUser();
            this.loadUserData();
            this.hideLoginOverlay();
            this.init();
        } else {
            alert('ユーザー名を入力してください');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLoginOverlay();
        document.getElementById('usernameInput').value = '';
    }

    saveCurrentUser() {
        localStorage.setItem('currentUser', this.currentUser);
        this.addToRecentUsers(this.currentUser);
    }

    addToRecentUsers(username) {
        let recentUsers = JSON.parse(localStorage.getItem('recentUsers')) || [];
        recentUsers = recentUsers.filter(user => user !== username);
        recentUsers.unshift(username);
        recentUsers = recentUsers.slice(0, 5);
        localStorage.setItem('recentUsers', JSON.stringify(recentUsers));
    }

    renderRecentUsers() {
        const recentUsersContainer = document.getElementById('recentUsers');
        const recentUsers = JSON.parse(localStorage.getItem('recentUsers')) || [];
        
        if (recentUsers.length === 0) {
            recentUsersContainer.innerHTML = '';
            return;
        }
        
        recentUsersContainer.innerHTML = '<h4>最近使用したユーザー</h4>';
        recentUsers.forEach(username => {
            const btn = document.createElement('button');
            btn.className = 'recent-user-btn';
            btn.textContent = username;
            btn.addEventListener('click', () => {
                document.getElementById('usernameInput').value = username;
                this.login();
            });
            recentUsersContainer.appendChild(btn);
        });
    }

    loadUserData() {
        const userKey = `user_${this.currentUser}`;
        const userData = JSON.parse(localStorage.getItem(userKey)) || {};
        
        this.events = userData.events || {};
        this.savings = userData.savings || [];
        this.sobrietyStartDate = userData.sobrietyStartDate || null;
    }

    saveUserData() {
        const userKey = `user_${this.currentUser}`;
        const userData = {
            events: this.events,
            savings: this.savings,
            sobrietyStartDate: this.sobrietyStartDate
        };
        localStorage.setItem(userKey, JSON.stringify(userData));
    }

    init() {
        this.renderCalendar();
        this.setupEventListeners();
        this.renderSavingsHistory();
        this.updateSavingsStats();
        this.updateSobrietyDisplay();
        this.updateMonthlySummary();
    }

    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
            this.updateMonthlySummary();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
            this.updateMonthlySummary();
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

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeAllModals();
            });
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
            
            // Day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = currentDay.getDate();
            dayElement.appendChild(dayNumber);
            
            // Day info container
            const dayInfoContainer = document.createElement('div');
            dayInfoContainer.className = 'calendar-day-info';
            dayElement.appendChild(dayInfoContainer);
            
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
            
            // Display events count
            if (this.events[dateKey] && this.events[dateKey].length > 0) {
                dayElement.classList.add('has-events');
                const eventsCount = document.createElement('div');
                eventsCount.className = 'day-events-count';
                eventsCount.textContent = `${this.events[dateKey].length}件`;
                dayInfoContainer.appendChild(eventsCount);
            }
            
            // Display savings for this day
            const daySavings = this.savings.filter(saving => {
                const savingDate = new Date(saving.date);
                return this.getDateKey(savingDate) === dateKey;
            });
            
            if (daySavings.length > 0) {
                const totalSavings = daySavings.reduce((sum, saving) => sum + saving.amount, 0);
                const savingsElement = document.createElement('div');
                savingsElement.className = 'day-savings';
                savingsElement.textContent = `¥${totalSavings.toLocaleString()}`;
                dayInfoContainer.appendChild(savingsElement);
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
                    <div class="event-content">
                        <div class="event-title">${event.title}</div>
                        <div class="event-description">${event.description}</div>
                    </div>
                    <div class="event-actions">
                        <button class="edit-btn" onclick="calendar.editEvent('${event.id}')">✏️</button>
                        <button class="delete-btn" onclick="calendar.deleteEvent('${event.id}')">🗑️</button>
                    </div>
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
        delete document.getElementById('eventModal').dataset.editId;
    }

    saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const description = document.getElementById('eventDescription').value.trim();
        const editId = document.getElementById('eventModal').dataset.editId;
        
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
        
        if (editId) {
            // Edit existing event
            const eventIndex = this.events[dateKey].findIndex(e => e.id == editId);
            if (eventIndex !== -1) {
                this.events[dateKey][eventIndex].title = title;
                this.events[dateKey][eventIndex].description = description;
            }
        } else {
            // Add new event
            this.events[dateKey].push({
                title: title,
                description: description,
                id: Date.now()
            });
        }
        
        this.saveUserData();
        
        this.closeEventModal();
        this.renderCalendar();
        this.showDayInfo(this.selectedDate);
        this.updateMonthlySummary();
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
        delete document.getElementById('savingModal').dataset.editId;
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
        this.saveUserData();
        
        this.closeSobrietyModal();
        this.renderCalendar();
        this.updateSobrietyDisplay();
    }

    resetSobriety() {
        if (confirm('断酒記録をリセットしますか？')) {
            this.sobrietyStartDate = null;
            this.saveUserData();
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
        const editId = document.getElementById('savingModal').dataset.editId;
        
        if (!amount || amount <= 0) {
            alert('有効な金額を入力してください');
            return;
        }
        
        if (!this.selectedDate) {
            alert('日付を選択してください');
            return;
        }
        
        if (editId) {
            // Edit existing saving
            const savingIndex = this.savings.findIndex(s => s.id == editId);
            if (savingIndex !== -1) {
                this.savings[savingIndex].amount = amount;
                this.savings[savingIndex].category = category;
                this.savings[savingIndex].description = description;
            }
        } else {
            // Add new saving
            const saving = {
                id: Date.now(),
                date: new Date(this.selectedDate),
                amount: amount,
                category: category,
                description: description
            };
            
            this.savings.push(saving);
        }
        
        this.savings.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.saveUserData();
        
        this.closeSavingModal();
        this.renderCalendar();
        this.renderSavingsHistory();
        this.updateSavingsStats();
        this.showDaySavings(this.selectedDate);
        this.updateMonthlySummary();
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
                    <div class="saving-content">
                        <div class="saving-amount">¥${saving.amount.toLocaleString()}</div>
                        <div class="saving-category">${saving.category} - ${saving.description}</div>
                    </div>
                    <div class="saving-actions">
                        <button class="edit-btn" onclick="calendar.editSaving('${saving.id}')">✏️</button>
                        <button class="delete-btn" onclick="calendar.deleteSaving('${saving.id}')">🗑️</button>
                    </div>
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
                <div class="history-content">
                    <div class="history-header">
                        <span class="history-amount">¥${saving.amount.toLocaleString()}</span>
                        <span class="history-date">${formattedDate}</span>
                    </div>
                    <div class="history-category">${saving.category}</div>
                    <div class="history-description">${saving.description}</div>
                </div>
                <div class="history-actions">
                    <button class="edit-btn" onclick="calendar.editSaving('${saving.id}')">✏️</button>
                    <button class="delete-btn" onclick="calendar.deleteSaving('${saving.id}')">🗑️</button>
                </div>
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

    updateMonthlySummary() {
        const viewedMonth = this.currentDate.getMonth();
        const viewedYear = this.currentDate.getFullYear();
        
        // Calculate monthly savings
        const monthlyTotal = this.savings.filter(saving => {
            const date = new Date(saving.date);
            return date.getMonth() === viewedMonth && date.getFullYear() === viewedYear;
        }).reduce((sum, saving) => sum + saving.amount, 0);
        
        // Calculate monthly events count
        const monthlyEvents = Object.keys(this.events).filter(dateKey => {
            const [year, month] = dateKey.split('-');
            return parseInt(month) === viewedMonth && parseInt(year) === viewedYear;
        }).reduce((count, dateKey) => {
            return count + this.events[dateKey].length;
        }, 0);
        
        // Calculate daily average
        const daysInMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate();
        const isCurrentMonth = viewedMonth === new Date().getMonth() && viewedYear === new Date().getFullYear();
        const daysToUse = isCurrentMonth ? new Date().getDate() : daysInMonth;
        const dailyAverage = monthlyTotal > 0 ? Math.round(monthlyTotal / daysToUse) : 0;
        
        // Update summary elements
        document.getElementById('summaryMonthlyTotal').textContent = `¥${monthlyTotal.toLocaleString()}`;
        document.getElementById('summaryEventCount').textContent = `${monthlyEvents}件`;
        document.getElementById('summaryDailyAverage').textContent = `¥${dailyAverage.toLocaleString()}`;
    }

    deleteEvent(eventId) {
        if (confirm('この予定を削除しますか？')) {
            const dateKey = this.getDateKey(this.selectedDate);
            if (this.events[dateKey]) {
                this.events[dateKey] = this.events[dateKey].filter(event => event.id != eventId);
                if (this.events[dateKey].length === 0) {
                    delete this.events[dateKey];
                }
                this.saveUserData();
                this.renderCalendar();
                this.showDayInfo(this.selectedDate);
                this.updateMonthlySummary();
            }
        }
    }

    editEvent(eventId) {
        const dateKey = this.getDateKey(this.selectedDate);
        const event = this.events[dateKey]?.find(e => e.id == eventId);
        if (event) {
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDescription').value = event.description;
            
            // Store the event ID for editing
            document.getElementById('eventModal').dataset.editId = eventId;
            document.getElementById('eventModal').style.display = 'flex';
            document.getElementById('eventTitle').focus();
        }
    }

    deleteSaving(savingId) {
        if (confirm('この節約記録を削除しますか？')) {
            this.savings = this.savings.filter(saving => saving.id != savingId);
            this.saveUserData();
            this.renderCalendar();
            this.renderSavingsHistory();
            this.updateSavingsStats();
            if (this.selectedDate) {
                this.showDaySavings(this.selectedDate);
            }
            this.updateMonthlySummary();
        }
    }

    editSaving(savingId) {
        const saving = this.savings.find(s => s.id == savingId);
        if (saving) {
            document.getElementById('savingAmount').value = saving.amount;
            document.getElementById('savingCategory').value = saving.category;
            document.getElementById('savingDescription').value = saving.description;
            
            // Store the saving ID for editing
            document.getElementById('savingModal').dataset.editId = savingId;
            document.getElementById('savingModal').style.display = 'flex';
            document.getElementById('savingAmount').focus();
        }
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
    window.calendar = new SmartCalendar();
});