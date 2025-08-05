document.addEventListener('DOMContentLoaded', function() {
    let adminToken = null;
    
    const loginForm = document.getElementById('adminLoginForm');
    const loginFormContainer = document.getElementById('loginForm');
    const dataArea = document.getElementById('dataArea');
    const loginError = document.getElementById('loginError');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const dataTableBody = document.getElementById('dataTableBody');
    const noDataMessage = document.getElementById('noDataMessage');
    const totalCount = document.getElementById('totalCount');
    const todayCount = document.getElementById('todayCount');

    // ログイン処理
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password })
            });

            const result = await response.json();

            if (result.success) {
                // ログイン成功
                adminToken = result.token;
                loginFormContainer.style.display = 'none';
                dataArea.style.display = 'block';
                loginError.style.display = 'none';
                
                // セッション管理
                sessionStorage.setItem('adminLoggedIn', 'true');
                sessionStorage.setItem('adminToken', result.token);
                
                // データを読み込んで表示
                loadAndDisplayData();
            } else {
                // ログイン失敗
                loginError.style.display = 'block';
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
            }
        } catch (error) {
            console.error('ログインエラー:', error);
            loginError.style.display = 'block';
            loginError.textContent = 'ログイン処理中にエラーが発生しました';
        }
    });

    // セッション確認
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        adminToken = sessionStorage.getItem('adminToken');
        if (adminToken) {
            loginFormContainer.style.display = 'none';
            dataArea.style.display = 'block';
            loadAndDisplayData();
        } else {
            sessionStorage.removeItem('adminLoggedIn');
        }
    }

    // データ更新ボタン
    refreshBtn.addEventListener('click', function() {
        loadAndDisplayData();
        showNotification('データを更新しました');
    });

    // エクスポートボタン
    exportBtn.addEventListener('click', function() {
        exportData();
    });

    // ログアウトボタン
    logoutBtn.addEventListener('click', function() {
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminToken');
        adminToken = null;
        location.reload();
    });

    // データの読み込みと表示
    async function loadAndDisplayData() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // 認証エラー
                    sessionStorage.removeItem('adminLoggedIn');
                    sessionStorage.removeItem('adminToken');
                    location.reload();
                    return;
                }
                throw new Error('データの取得に失敗しました');
            }

            const result = await response.json();
            
            if (result.success) {
                displayData(result.data.users);
                updateStats(result.data.users);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            showNotification('データの読み込みに失敗しました', 'error');
        }
    }

    // データの表示
    function displayData(data) {
        if (data.length === 0) {
            dataTableBody.innerHTML = '';
            document.getElementById('dataTable').style.display = 'none';
            noDataMessage.style.display = 'block';
            return;
        }

        document.getElementById('dataTable').style.display = 'table';
        noDataMessage.style.display = 'none';

        let tableHTML = '';
        
        data.forEach((item, index) => {
            const date = new Date(item.createdAt);
            const formattedDate = date.toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            const birthdate = new Date(item.birthdate).toLocaleDateString('ja-JP');

            tableHTML += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${escapeHtml(item.name)}</td>
                    <td>${birthdate}</td>
                    <td class="mynumber-masked">${item.mynumber}</td>
                    <td>${escapeHtml(item.email || '-')}</td>
                    <td>${escapeHtml(item.phone || '-')}</td>
                    <td>${escapeHtml(item.address || '-')}</td>
                </tr>
            `;
        });

        dataTableBody.innerHTML = tableHTML;
    }

    // 統計情報の更新
    async function updateStats(data) {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const stats = result.data;
                    totalCount.textContent = stats.total;
                    todayCount.textContent = stats.today;
                }
            }
        } catch (error) {
            console.error('統計情報の取得に失敗しました:', error);
            // フォールバック: ローカルデータから計算
            const total = data.length;
            const today = new Date().toDateString();
            const todayData = data.filter(item => {
                const itemDate = new Date(item.createdAt).toDateString();
                return itemDate === today;
            });

            totalCount.textContent = total;
            todayCount.textContent = todayData.length;
        }
    }

    // マイナンバーのマスキング
    function maskMyNumber(mynumber) {
        if (!mynumber || mynumber.length !== 12) {
            return '-';
        }
        // 最初の4桁と最後の4桁を表示、中間をマスク
        return mynumber.slice(0, 4) + '****' + mynumber.slice(-4);
    }

    // HTMLエスケープ
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // データのエクスポート
    function exportData() {
        try {
            const userData = localStorage.getItem('userData');
            let data = [];
            
            if (userData) {
                data = JSON.parse(userData);
            }

            if (data.length === 0) {
                showNotification('エクスポートするデータがありません', 'error');
                return;
            }

            // CSV形式でエクスポート
            const csvContent = convertToCSV(data);
            downloadCSV(csvContent, 'user_data_' + new Date().toISOString().slice(0, 10) + '.csv');
            
            showNotification('データをエクスポートしました');
        } catch (error) {
            console.error('エクスポートに失敗しました:', error);
            showNotification('エクスポートに失敗しました', 'error');
        }
    }

    // CSV変換
    function convertToCSV(data) {
        const headers = [
            '登録日時',
            'お名前',
            '生年月日',
            'マイナンバー',
            'メールアドレス',
            '電話番号',
            '住所'
        ];

        const csvRows = [headers.join(',')];

        data.forEach(item => {
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleString('ja-JP');
            
            const row = [
                formattedDate,
                item.name,
                item.birthdate,
                item.mynumber,
                item.email || '',
                item.phone || '',
                item.address || ''
            ].map(field => `"${field}"`).join(',');
            
            csvRows.push(row);
        });

        return csvRows.join('\n');
    }

    // CSVダウンロード
    function downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // 通知表示
    function showNotification(message, type = 'success') {
        // 既存の通知を削除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 通知のスタイル
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background-color: ${type === 'error' ? 'var(--error-color)' : 'var(--success-color)'};
        `;

        document.body.appendChild(notification);

        // 3秒後に自動削除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // キーボードショートカット
    document.addEventListener('keydown', function(e) {
        // Ctrl+R でデータ更新
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            if (sessionStorage.getItem('adminLoggedIn') === 'true') {
                loadAndDisplayData();
                showNotification('データを更新しました');
            }
        }
        
        // Ctrl+E でエクスポート
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            if (sessionStorage.getItem('adminLoggedIn') === 'true') {
                exportData();
            }
        }
    });

    // 定期的なデータ更新（5分間隔）
    setInterval(() => {
        if (sessionStorage.getItem('adminLoggedIn') === 'true' && adminToken) {
            loadAndDisplayData();
        }
    }, 5 * 60 * 1000);

    // スマホでのタッチ体験向上
    if ('ontouchstart' in window) {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('touchstart', function(e) {
                e.preventDefault();
                this.click();
            });
        });
    }
});

// 通知アニメーション用CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style); 