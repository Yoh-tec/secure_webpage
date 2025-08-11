// AWS API GatewayのエンドポイントURL
const API_ENDPOINT = 'https://d806hej8g7.execute-api.ap-northeast-1.amazonaws.com/prod/form';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('adminLoginForm');
    const loginFormContainer = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');
    const dataTable = document.getElementById('dataTable');
    const statsContainer = document.getElementById('statsContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const loginError = document.getElementById('loginError');
    const noDataMessage = document.getElementById('noDataMessage');

    let isLoggedIn = false;
    let adminPassword = '';

    // ログインフォームの処理
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        adminPassword = password;
        
        // ログイン状態を設定
        isLoggedIn = true;
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminPassword', password);
        
        // ログインフォームを非表示、管理者パネルを表示
        loginFormContainer.style.display = 'none';
        adminPanel.style.display = 'block';
        loginError.style.display = 'none';
        
        // データを読み込み
        loadData();
    });

    // ログアウト処理
    logoutBtn.addEventListener('click', function() {
        logout();
    });

    // データ更新ボタン
    refreshBtn.addEventListener('click', function() {
        loadData();
        showNotification('データを更新しました');
    });

    // CSVエクスポートボタン
    exportBtn.addEventListener('click', function() {
        exportToCSV();
    });

    // セッション復元
    function restoreSession() {
        const loggedIn = sessionStorage.getItem('adminLoggedIn');
        const password = sessionStorage.getItem('adminPassword');
        
        if (loggedIn === 'true' && password) {
            isLoggedIn = true;
            adminPassword = password;
            loginFormContainer.style.display = 'none';
            adminPanel.style.display = 'block';
            loadData();
        }
    }

    // AWS API Gatewayからデータを取得
    async function loadData() {
        try {
            console.log('データ取得開始...');
            console.log('APIエンドポイント:', API_ENDPOINT);
            console.log('管理者パスワード:', adminPassword ? '設定済み' : '未設定');

            // APIエンドポイントが設定されていない場合の警告
            if (API_ENDPOINT === 'YOUR_API_GATEWAY_URL') {
                showNotification('APIエンドポイントが設定されていません。Terraformでデプロイ後に正しいURLを設定してください。', 'error');
                return;
            }

            const url = `${API_ENDPOINT}?password=${encodeURIComponent(adminPassword)}`;
            console.log('リクエストURL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors' // CORSモードを明示的に設定
            });

            console.log('レスポンスステータス:', response.status);
            console.log('レスポンスヘッダー:', response.headers);

            if (response.status === 401) {
                // 認証エラー
                console.error('認証エラー: パスワードが正しくありません');
                showNotification('パスワードが正しくありません', 'error');
                logout();
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTPエラー:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log('レスポンスデータ:', result);
            
            if (result.success !== undefined && !result.success) {
                showNotification('データの取得に失敗しました: ' + (result.message || '不明なエラー'), 'error');
                return;
            }

            // データが配列でない場合は配列に変換
            const data = Array.isArray(result.data) ? result.data : (result.data ? [result.data] : []);
            console.log('処理済みデータ:', data);
            
            displayData(data);
            updateStats(data);

        } catch (error) {
            console.error('データ取得エラー:', error);
            showNotification('データの取得に失敗しました: ' + error.message, 'error');
        }
    }

    // データの表示
    function displayData(data) {
        const tbody = dataTable.querySelector('tbody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            dataTable.style.display = 'none';
            noDataMessage.style.display = 'block';
            return;
        }

        dataTable.style.display = 'table';
        noDataMessage.style.display = 'none';

        // データを日時順にソート（新しい順）
        data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        data.forEach(item => {
            const row = document.createElement('tr');
            
            // マイナンバーのマスキング（セキュリティ考慮）
            const maskedMyNumber = maskMyNumber(item.mynumber);
            
            // 日付のフォーマット
            const formattedDate = formatDate(item.timestamp);
            
            row.innerHTML = `
                <td>${escapeHtml(item.name || '-')}</td>
                <td>${escapeHtml(item.birthdate || '-')}</td>
                <td class="mynumber-masked">${maskedMyNumber}</td>
                <td>${escapeHtml(item.email || '-')}</td>
                <td>${escapeHtml(item.phone || '-')}</td>
                <td>${escapeHtml(item.prefecture || '-')}</td>
                <td>${escapeHtml(item.city || '-')}</td>
                <td>${formattedDate}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // 統計情報の更新
    function updateStats(data) {
        const total = data.length;
        const today = new Date().toDateString();
        const todayData = data.filter(item => {
            const itemDate = new Date(item.timestamp).toDateString();
            return itemDate === today;
        });

        const totalCountElement = document.getElementById('totalCount');
        const todayCountElement = document.getElementById('todayCount');
        
        if (totalCountElement) totalCountElement.textContent = total;
        if (todayCountElement) todayCountElement.textContent = todayData.length;
    }

    // マイナンバーのマスキング
    function maskMyNumber(mynumber) {
        if (!mynumber || mynumber.length !== 12) {
            return '-';
        }
        // 最初の4桁と最後の4桁を表示、中間をマスク
        return mynumber.slice(0, 4) + '****' + mynumber.slice(-4);
    }

    // CSVエクスポート
    function exportToCSV() {
        try {
            const table = dataTable;
            const rows = table.querySelectorAll('tbody tr');
            
            if (rows.length === 0) {
                showNotification('エクスポートするデータがありません', 'error');
                return;
            }
            
            let csv = 'お名前,生年月日,マイナンバー,メールアドレス,電話番号,都道府県,市区町村,登録日時\n';
            
            rows.forEach((row) => {
                const cells = row.querySelectorAll('td');
                const rowData = [];
                
                cells.forEach(cell => {
                    // マイナンバーのマスキングを解除してエクスポート
                    let cellText = cell.textContent;
                    if (cell.classList.contains('mynumber-masked')) {
                        // マスキングされたマイナンバーを元の値に戻す（実際の実装では元データから取得）
                        cellText = cellText.replace('****', '****');
                    }
                    rowData.push(`"${cellText}"`);
                });
                
                csv += rowData.join(',') + '\n';
            });
            
            // CSVファイルのダウンロード
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `form_data_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('データをエクスポートしました');
        } catch (error) {
            console.error('エクスポートに失敗しました:', error);
            showNotification('エクスポートに失敗しました', 'error');
        }
    }

    // HTMLエスケープ
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 日付フォーマット
    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // ログアウト処理
    function logout() {
        isLoggedIn = false;
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminPassword');
        
        adminPanel.style.display = 'none';
        loginFormContainer.style.display = 'block';
        document.getElementById('password').value = '';
        loginError.style.display = 'none';
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
            background-color: ${type === 'error' ? '#e74c3c' : '#27ae60'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
            if (isLoggedIn) {
                loadData();
                showNotification('データを更新しました');
            }
        }
        
        // Ctrl+E でエクスポート
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            if (isLoggedIn) {
                exportToCSV();
            }
        }
    });

    // 定期的なデータ更新（5分間隔）
    setInterval(() => {
        if (isLoggedIn) {
            loadData();
        }
    }, 5 * 60 * 1000);

    // 初期化
    restoreSession();
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