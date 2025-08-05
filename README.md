# 個人情報入力フォームシステム

シンプルで信頼感のある個人情報入力フォームWebサイトです。カフェのような温かみのあるカラーパレットを使用し、セキュリティを重視した設計になっています。

## 機能

### メインフォーム（index.html）
- 個人情報の入力フォーム
- リアルタイムバリデーション
- マイナンバーの12桁制限
- 電話番号の自動フォーマット
- 送信後の感謝メッセージ表示

### 管理者ページ（admin.html）
- JWT認証によるセキュアなログイン
- 登録データの一覧表示（MongoDBから取得）
- マイナンバーのマスキング表示
- 統計情報（総登録数、今日の登録数、過去7日間、過去30日間）
- CSVエクスポート機能
- セッション管理
- レポートメール送信機能

## セキュリティ機能

- マイナンバーの入力制限（12桁数字のみ）
- 管理者ページでのマイナンバーマスキング表示
- HTMLエスケープ処理
- JWT認証によるセキュアなセッション管理
- MongoDBでのデータ永続化
- bcryptjsによるパスワードハッシュ化
- Helmetによるセキュリティヘッダー
- レート制限によるDDoS攻撃対策
- CORS設定によるクロスオリジン制御

## ファイル構成

```
form_portfolio/
├── server.js           # メインサーバーファイル
├── package.json        # Node.js依存関係
├── env.example         # 環境変数設定例
├── public/             # 静的ファイル
│   ├── index.html      # メインフォームページ
│   ├── admin.html      # 管理者ページ
│   ├── styles.css      # メインフォーム用スタイル
│   ├── admin-styles.css # 管理者ページ用スタイル
│   ├── script.js       # メインフォーム用スクリプト
│   └── admin-script.js # 管理者ページ用スクリプト
├── models/             # データベースモデル
│   └── User.js         # ユーザーモデル
├── routes/             # APIルート
│   ├── users.js        # ユーザー関連API
│   ├── admin.js        # 管理者関連API
│   └── email.js        # メール関連API
├── utils/              # ユーティリティ
│   └── email.js        # メール送信機能
└── README.md           # このファイル
```

## 使用方法

### 1. メインフォームの使用
1. `index.html` をブラウザで開く
2. 必要な情報を入力
   - お名前（必須）
   - 生年月日（必須）
   - マイナンバー（必須、12桁）
   - メールアドレス（任意）
   - 電話番号（任意）
   - 住所（任意）
3. 個人情報の取り扱いについて同意
4. 「送信する」ボタンをクリック
5. 感謝メッセージが表示される

### 2. 管理者ページの使用
1. `admin.html` をブラウザで開く
2. パスワード `Password` を入力
3. ログイン後、登録データを確認
4. 「更新」ボタンでデータを最新化
5. 「エクスポート」ボタンでCSVダウンロード
6. 「ログアウト」ボタンでセッション終了

## カラーパレット

カフェのような温かみのある色合いを使用：
- プライマリカラー: サドルブラウン (#8B4513)
- セカンダリカラー: バーリーウッド (#DEB887)
- アクセントカラー: チョコレート (#D2691E)
- 背景色: ベージュ (#F5F5DC)
- テキスト色: ダークグレー (#2F2F2F)

## 技術仕様

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **バックエンド**: Node.js, Express.js
- **データベース**: MongoDB
- **メール送信**: Nodemailer
- **認証**: JWT (JSON Web Token)
- **セキュリティ**: bcryptjs, helmet, rate-limiting
- **レスポンシブ**: モバイル対応デザイン
- **ブラウザ対応**: モダンブラウザ（Chrome, Firefox, Safari, Edge）

## 新機能

### サーバーサイド機能
- **MongoDBデータベース連携**: データの永続化と管理
- **JWT認証**: セキュアな管理者ログイン
- **メール通知**: 新規登録時にtest.test@gmail.comに通知メール送信
- **レポート機能**: 管理者向け統計レポートメール送信
- **API設計**: RESTful APIによるデータ管理

### セキュリティ強化
- **bcryptjs**: パスワードのハッシュ化
- **Helmet**: セキュリティヘッダーの自動設定
- **Rate Limiting**: DDoS攻撃対策
- **CORS**: クロスオリジン制御
- **入力バリデーション**: サーバーサイドでの厳密な検証

## 環境設定

### 必要な環境変数（.envファイル）
```bash
# サーバー設定
PORT=3000
NODE_ENV=development

# MongoDB設定
MONGODB_URI=mongodb://localhost:27017/secure_webpage

# メール設定（Gmail使用例）
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_TO=test.test@gmail.com

# JWT設定
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 管理者認証
ADMIN_PASSWORD=Password
ADMIN_EMAIL=admin@example.com
```

### Gmail設定
1. Gmailアカウントで2段階認証を有効化
2. アプリパスワードを生成
3. `.env`ファイルの`EMAIL_PASS`にアプリパスワードを設定

## 注意事項

⚠️ **重要**: 本格的な運用では以下の点を考慮してください：

1. **本番環境設定**: 
   - 本番用MongoDB（MongoDB Atlas推奨）
   - HTTPS通信の強制
   - 環境変数の適切な管理

2. **セキュリティ強化**: 
   - 強力なJWT_SECRETの設定
   - 管理者パスワードの変更
   - データベースアクセス制御
   - ログ監視の実装

3. **個人情報保護**: 
   - データの暗号化保存
   - アクセスログの管理
   - データ保持期間の設定
   - 定期的なセキュリティ監査

4. **バックアップ**: 
   - 定期的なデータベースバックアップ
   - 障害復旧計画の策定

## 開発者向け情報

### ローカル開発環境での実行
```bash
# プロジェクトディレクトリに移動
cd form_portfolio

# 依存関係をインストール
npm install

# 環境変数を設定
cp env.example .env
# .envファイルを編集して必要な設定を行ってください

# MongoDBを起動（ローカル環境の場合）
# MongoDBがインストールされていない場合は、MongoDB Atlasなどのクラウドサービスを使用

# サーバーを起動
npm start

# 開発モードで起動（ファイル変更時に自動再起動）
npm run dev

# ブラウザでアクセス
# http://localhost:3000
```

### カスタマイズ
- カラーパレットの変更: `public/styles.css` と `public/admin-styles.css` の `:root` セクション
- 管理者パスワードの変更: `.env` ファイルの `ADMIN_PASSWORD` 設定
- メール設定の変更: `.env` ファイルの `EMAIL_*` 設定
- フォーム項目の追加: `public/index.html` のフォーム部分と `public/script.js` のバリデーション
- データベース設定: `.env` ファイルの `MONGODB_URI` 設定

## ライセンス

このプロジェクトはデモンストレーション目的で作成されています。 