const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'お名前は必須です'],
        trim: true,
        maxlength: [100, 'お名前は100文字以内で入力してください']
    },
    birthdate: {
        type: Date,
        required: [true, '生年月日は必須です'],
        validate: {
            validator: function(v) {
                return v <= new Date();
            },
            message: '未来の日付は入力できません'
        }
    },
    mynumber: {
        type: String,
        required: [true, 'マイナンバーは必須です'],
        match: [/^\d{12}$/, 'マイナンバーは12桁の数字で入力してください'],
        unique: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '有効なメールアドレスを入力してください']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\d\-]{10,15}$/, '有効な電話番号を入力してください']
    },
    address: {
        type: String,
        trim: true,
        maxlength: [500, '住所は500文字以内で入力してください']
    },
    privacy: {
        type: Boolean,
        required: [true, '個人情報の取り扱いについて同意が必要です'],
        default: false
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// マイナンバーの暗号化（実際の運用ではbcryptなどで暗号化）
userSchema.pre('save', function(next) {
    // マイナンバーの一部をマスクして保存
    if (this.mynumber && this.mynumber.length === 12) {
        this.mynumber = this.mynumber.slice(0, 4) + '****' + this.mynumber.slice(-4);
    }
    next();
});

// 仮想フィールド：年齢計算
userSchema.virtual('age').get(function() {
    if (!this.birthdate) return null;
    const today = new Date();
    const birthDate = new Date(this.birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// インデックス
userSchema.index({ createdAt: -1 });
userSchema.index({ mynumber: 1 });

module.exports = mongoose.model('User', userSchema); 