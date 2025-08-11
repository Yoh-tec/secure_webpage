const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    // CORSヘッダーの設定
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    };

    // OPTIONSリクエスト（プリフライト）の処理
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: headers,
            body: ''
        };
    }

    try {
        // POSTリクエストの処理
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            
            // データの検証
            if (!body.name || !body.birthdate || !body.mynumber) {
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({ error: '必須項目が不足しています' })
                };
            }

            // マイナンバーの検証（12桁の数字）
            if (!/^\d{12}$/.test(body.mynumber)) {
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({ error: 'マイナンバーは12桁の数字で入力してください' })
                };
            }

            // DynamoDBに保存するデータ
            const item = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: body.name,
                birthdate: body.birthdate,
                mynumber: body.mynumber, // 実際の運用では暗号化が必要
                email: body.email || '',
                phone: body.phone || '',
                postal: body.postal || '',
                prefecture: body.prefecture || '',
                city: body.city || '',
                building: body.building || '',
                timestamp: new Date().toISOString()
            };

            // DynamoDBに保存
            await dynamodb.put({
                TableName: process.env.DYNAMODB_TABLE,
                Item: item
            }).promise();

            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({ 
                    message: 'データが正常に保存されました',
                    id: item.id 
                })
            };
        }

        // GETリクエストの処理（管理者用）
        if (event.httpMethod === 'GET') {
            const params = event.queryStringParameters || {};
            
            // 管理者認証（実際の運用ではJWT等を使用）
            if (params.password !== process.env.ADMIN_PASSWORD) {
                return {
                    statusCode: 401,
                    headers: headers,
                    body: JSON.stringify({ error: '認証に失敗しました' })
                };
            }

            // データの取得
            const result = await dynamodb.scan({
                TableName: process.env.DYNAMODB_TABLE
            }).promise();

            // マイナンバーのマスキング処理
            const maskedData = result.Items.map(item => ({
                ...item,
                mynumber: item.mynumber ? 
                    item.mynumber.substring(0, 4) + '****' + item.mynumber.substring(8) : 
                    ''
            }));

            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({
                    data: maskedData,
                    total: maskedData.length
                })
            };
        }

        return {
            statusCode: 405,
            headers: headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}; 