// AWS API GatewayのエンドポイントURL（デプロイ後に設定）
const API_ENDPOINT = 'YOUR_API_GATEWAY_URL'; // 後で実際のURLに置き換え

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');
    const dataTable = document.getElementById('dataTable');
    const statsContainer = document.getElementById('statsContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');

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
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        
        // データを読み込み
        loadData();
    });

    // ログアウト処理
    logoutBtn.addEventListener('click', function() {
        isLoggedIn = false;
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminPassword');
        
        adminPanel.style.display = 'none';
        loginForm.style.display = 'block';
        document.getElementById('password').value = '';
    });

    // データ更新ボタン
    refreshBtn.addEventListener('click', function() {
        loadData();
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
            loginForm.style.display = 'none';
            adminPanel.style.display = 'block';
            loadData();
        }
    }

    // AWS API Gatewayからデータを取得
    async function loadData() {
        try {
            const response = await fetch(`${API_ENDPOINT}?password=${encodeURIComponent(adminPassword)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.status === 401) {
                // 認証エラー
                alert('パスワードが正しくありません');
                logout();
                return;
            }

            if (!response.ok) {
                throw new Error('データの取得に失敗しました');
            }

            const result = await response.json();
            displayData(result.data);
            updateStats(result.data);

        } catch (error) {
            console.error('Error:', error);
            alert('データの取得に失敗しました: ' + error.message);
        }
    }

    // データの表示
    function displayData(data) {
        const tbody = dataTable.querySelector('tbody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">データがありません</td></tr>';
            return;
        }

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.birthdate)}</td>
                <td>${escapeHtml(item.mynumber)}</td>
                <td>${escapeHtml(item.email)}</td>
                <td>${escapeHtml(item.phone)}</td>
                <td>${escapeHtml(item.prefecture)}</td>
                <td>${escapeHtml(item.city)}</td>
                <td>${escapeHtml(formatDate(item.timestamp))}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // 統計情報の更新
    function updateStats(data) {
        const totalCount = data.length;
        const today = new Date().toDateString();
        const todayCount = data.filter(item => {
            const itemDate = new Date(item.timestamp).toDateString();
            return itemDate === today;
        }).length;

        statsContainer.innerHTML = `
            <div class="stat-item">
                <h3>総登録数</h3>
                <p>${totalCount}件</p>
            </div>
            <div class="stat-item">
                <h3>今日の登録数</h3>
                <p>${todayCount}件</p>
            </div>
        `;
    }

    // CSVエクスポート
    function exportToCSV() {
        const table = dataTable;
        const rows = table.querySelectorAll('tr');
        
        let csv = '氏名,生年月日,マイナンバー,メールアドレス,電話番号,都道府県,市区町村,登録日時\n';
        
        rows.forEach((row, index) => {
            if (index === 0) return; // ヘッダー行をスキップ
            
            const cells = row.querySelectorAll('td');
            const rowData = [];
            
            cells.forEach(cell => {
                rowData.push(`"${cell.textContent}"`);
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
    }

    // HTMLエスケープ
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 日付フォーマット
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP');
    }

    // ログアウト処理
    function logout() {
        isLoggedIn = false;
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminPassword');
        
        adminPanel.style.display = 'none';
        loginForm.style.display = 'block';
        document.getElementById('password').value = '';
    }

    // 初期化
    restoreSession();
}); 