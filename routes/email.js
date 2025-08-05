const express = require('express');
const router = express.Router();
const { sendAdminReport } = require('../utils/email');
const User = require('../models/User');

// 管理者向けレポートメール送信
router.post('/report', async (req, res) => {
    try {
        // 統計情報を取得
        const total = await User.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await User.countDocuments({
            createdAt: { $gte: today }
        });

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const last7DaysCount = await User.countDocuments({
            createdAt: { $gte: last7Days }
        });

        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        const last30DaysCount = await User.countDocuments({
            createdAt: { $gte: last30Days }
        });

        const stats = {
            total,
            today: todayCount,
            last7Days: last7DaysCount,
            last30Days: last30DaysCount
        };

        // レポートメールを送信
        await sendAdminReport(stats);

        res.json({
            success: true,
            message: 'レポートメールを送信しました',
            data: stats
        });

    } catch (error) {
        console.error('レポートメール送信エラー:', error);
        res.status(500).json({
            success: false,
            message: 'レポートメールの送信に失敗しました'
        });
    }
});

module.exports = router; 