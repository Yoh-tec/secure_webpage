const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendNotificationEmail } = require('../utils/email');

// ユーザーデータの保存
router.post('/', async (req, res) => {
    try {
        const {
            name,
            birthdate,
            mynumber,
            email,
            phone,
            address,
            privacy
        } = req.body;

        // バリデーション
        if (!name || !birthdate || !mynumber || !privacy) {
            return res.status(400).json({
                success: false,
                message: '必須項目が不足しています'
            });
        }

        // マイナンバーの重複チェック
        const existingUser = await User.findOne({ mynumber });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'このマイナンバーは既に登録されています'
            });
        }

        // 新しいユーザーを作成
        const user = new User({
            name,
            birthdate,
            mynumber,
            email,
            phone,
            address,
            privacy,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        });

        await user.save();

        // メール通知を送信
        try {
            await sendNotificationEmail({
                name,
                birthdate,
                mynumber: mynumber.slice(0, 4) + '****' + mynumber.slice(-4),
                email,
                phone,
                address,
                ipAddress: user.ipAddress,
                userAgent: user.userAgent
            });
        } catch (emailError) {
            console.error('メール送信エラー:', emailError);
            // メール送信に失敗してもユーザー登録は成功とする
        }

        res.status(201).json({
            success: true,
            message: 'データが正常に保存されました',
            data: {
                id: user._id,
                name: user.name,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('ユーザー保存エラー:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'バリデーションエラー',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'サーバーエラーが発生しました'
        });
    }
});

// 統計情報の取得
router.get('/stats', async (req, res) => {
    try {
        const total = await User.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await User.countDocuments({
            createdAt: { $gte: today }
        });

        res.json({
            success: true,
            data: {
                total,
                today: todayCount
            }
        });
    } catch (error) {
        console.error('統計情報取得エラー:', error);
        res.status(500).json({
            success: false,
            message: '統計情報の取得に失敗しました'
        });
    }
});

module.exports = router; 