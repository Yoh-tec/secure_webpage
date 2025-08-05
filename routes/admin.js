const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 管理者認証ミドルウェア
const authenticateAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: '認証トークンが必要です'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '管理者権限が必要です'
            });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: '無効なトークンです'
        });
    }
};

// 管理者ログイン
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'パスワードが必要です'
            });
        }

        // パスワード検証
        const adminPassword = process.env.ADMIN_PASSWORD || 'Password';
        const isValidPassword = await bcrypt.compare(password, await bcrypt.hash(adminPassword, 10));

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'パスワードが正しくありません'
            });
        }

        // JWTトークン生成
        const token = jwt.sign(
            { 
                role: 'admin',
                email: process.env.ADMIN_EMAIL || 'admin@example.com'
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'ログインに成功しました',
            token
        });

    } catch (error) {
        console.error('管理者ログインエラー:', error);
        res.status(500).json({
            success: false,
            message: 'ログイン処理中にエラーが発生しました'
        });
    }
});

// ユーザーデータ一覧取得（管理者認証必要）
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('ユーザーデータ取得エラー:', error);
        res.status(500).json({
            success: false,
            message: 'データの取得に失敗しました'
        });
    }
});

// 統計情報取得（管理者認証必要）
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const total = await User.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await User.countDocuments({
            createdAt: { $gte: today }
        });

        // 過去7日間の登録数
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const last7DaysCount = await User.countDocuments({
            createdAt: { $gte: last7Days }
        });

        // 過去30日間の登録数
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        const last30DaysCount = await User.countDocuments({
            createdAt: { $gte: last30Days }
        });

        res.json({
            success: true,
            data: {
                total,
                today: todayCount,
                last7Days: last7DaysCount,
                last30Days: last30DaysCount
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

// ユーザーデータ削除（管理者認証必要）
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findByIdAndDelete(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'ユーザーが見つかりません'
            });
        }

        res.json({
            success: true,
            message: 'ユーザーデータを削除しました'
        });

    } catch (error) {
        console.error('ユーザー削除エラー:', error);
        res.status(500).json({
            success: false,
            message: 'ユーザーの削除に失敗しました'
        });
    }
});

module.exports = router; 