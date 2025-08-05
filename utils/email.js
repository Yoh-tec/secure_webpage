const nodemailer = require('nodemailer');

// メールトランスポーターの設定
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// 通知メール送信
const sendNotificationEmail = async (userData) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"個人情報管理システム" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_TO || 'test.test@gmail.com',
            subject: '新しい個人情報が登録されました',
            html: generateEmailHTML(userData)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('メール送信成功:', info.messageId);
        return info;

    } catch (error) {
        console.error('メール送信エラー:', error);
        throw error;
    }
};

// メールHTMLテンプレート生成
const generateEmailHTML = (userData) => {
    const {
        name,
        birthdate,
        mynumber,
        email,
        phone,
        address,
        ipAddress,
        userAgent
    } = userData;

    const formattedDate = new Date(birthdate).toLocaleDateString('ja-JP');
    const currentTime = new Date().toLocaleString('ja-JP');

    return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>新しい個人情報登録</title>
        <style>
            body {
                font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #8B4513;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 0 0 8px 8px;
            }
            .info-row {
                display: flex;
                margin-bottom: 10px;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            .label {
                font-weight: bold;
                width: 120px;
                color: #8B4513;
            }
            .value {
                flex: 1;
            }
            .footer {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 2px solid #8B4513;
                font-size: 0.9em;
                color: #666;
            }
            .alert {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 10px;
                border-radius: 4px;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>新しい個人情報が登録されました</h1>
            <p>登録日時: ${currentTime}</p>
        </div>
        
        <div class="content">
            <div class="alert">
                <strong>注意:</strong> このメールには個人情報が含まれています。適切に管理してください。
            </div>
            
            <h2>登録者情報</h2>
            
            <div class="info-row">
                <div class="label">お名前:</div>
                <div class="value">${name}</div>
            </div>
            
            <div class="info-row">
                <div class="label">生年月日:</div>
                <div class="value">${formattedDate}</div>
            </div>
            
            <div class="info-row">
                <div class="label">マイナンバー:</div>
                <div class="value">${mynumber}</div>
            </div>
            
            ${email ? `
            <div class="info-row">
                <div class="label">メールアドレス:</div>
                <div class="value">${email}</div>
            </div>
            ` : ''}
            
            ${phone ? `
            <div class="info-row">
                <div class="label">電話番号:</div>
                <div class="value">${phone}</div>
            </div>
            ` : ''}
            
            ${address ? `
            <div class="info-row">
                <div class="label">住所:</div>
                <div class="value">${address}</div>
            </div>
            ` : ''}
            
            <h3>システム情報</h3>
            
            <div class="info-row">
                <div class="label">IPアドレス:</div>
                <div class="value">${ipAddress}</div>
            </div>
            
            <div class="info-row">
                <div class="label">ユーザーエージェント:</div>
                <div class="value">${userAgent}</div>
            </div>
            
            <div class="footer">
                <p>このメールは個人情報管理システムから自動送信されました。</p>
                <p>ご不明な点がございましたら、システム管理者までお問い合わせください。</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// 管理者向けレポートメール送信
const sendAdminReport = async (stats) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"個人情報管理システム" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_TO || 'test.test@gmail.com',
            subject: '個人情報管理システム - 日次レポート',
            html: generateReportHTML(stats)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('レポートメール送信成功:', info.messageId);
        return info;

    } catch (error) {
        console.error('レポートメール送信エラー:', error);
        throw error;
    }
};

// レポートメールHTMLテンプレート生成
const generateReportHTML = (stats) => {
    const currentDate = new Date().toLocaleDateString('ja-JP');
    
    return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>日次レポート</title>
        <style>
            body {
                font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #8B4513;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 0 0 8px 8px;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            .stat-card {
                background-color: white;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .stat-number {
                font-size: 2em;
                font-weight: bold;
                color: #8B4513;
            }
            .stat-label {
                font-size: 0.9em;
                color: #666;
                margin-top: 5px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>個人情報管理システム - 日次レポート</h1>
            <p>${currentDate}</p>
        </div>
        
        <div class="content">
            <h2>統計情報</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${stats.total}</div>
                    <div class="stat-label">総登録数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.today}</div>
                    <div class="stat-label">今日の登録</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.last7Days}</div>
                    <div class="stat-label">過去7日間</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.last30Days}</div>
                    <div class="stat-label">過去30日間</div>
                </div>
            </div>
            
            <p>システムは正常に動作しています。</p>
        </div>
    </body>
    </html>
    `;
};

module.exports = {
    sendNotificationEmail,
    sendAdminReport
}; 