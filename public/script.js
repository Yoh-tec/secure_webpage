document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('userForm');
    const successMessage = document.getElementById('successMessage');
    const backToFormBtn = document.getElementById('backToForm');
    const mynumberInput = document.getElementById('mynumber');

    // マイナンバーの入力制限（数字のみ）
    mynumberInput.addEventListener('input', function(e) {
        // 数字以外の文字を削除
        this.value = this.value.replace(/[^0-9]/g, '');
        
        // 12桁を超えた場合は切り捨て
        if (this.value.length > 12) {
            this.value = this.value.slice(0, 12);
        }
    });

    // フォーム送信処理
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // フォームのバリデーション
        if (!validateForm()) {
            return;
        }

        // 送信ボタンを無効化
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = '送信中...';
        form.classList.add('loading');

        // フォームデータの取得
        const formData = new FormData(form);
        const userData = {
            name: formData.get('name'),
            birthdate: formData.get('birthdate'),
            mynumber: formData.get('mynumber'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            privacy: formData.get('privacy'),
            timestamp: new Date().toISOString()
        };

        // サーバーにデータを送信
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || '送信に失敗しました');
            }

            console.log('データが正常に保存されました');
        } catch (error) {
            console.error('データ送信エラー:', error);
            alert('データの送信に失敗しました。もう一度お試しください。');
            return;
        }

        // 成功メッセージの表示
        setTimeout(() => {
            form.style.display = 'none';
            successMessage.style.display = 'block';
            
            // フォームをリセット
            form.reset();
            
            // ボタンを元に戻す
            submitBtn.disabled = false;
            submitBtn.textContent = '送信する';
            form.classList.remove('loading');
        }, 1000);
    });

    // フォームに戻るボタン
    backToFormBtn.addEventListener('click', function() {
        successMessage.style.display = 'none';
        form.style.display = 'block';
    });

    // フォームバリデーション
    function validateForm() {
        const name = document.getElementById('name').value.trim();
        const birthdate = document.getElementById('birthdate').value;
        const mynumber = document.getElementById('mynumber').value.trim();
        const privacy = document.getElementById('privacy').checked;

        let isValid = true;

        // 名前のバリデーション
        if (name.length < 2) {
            showError('name', 'お名前は2文字以上で入力してください');
            isValid = false;
        } else {
            clearError('name');
        }

        // 生年月日のバリデーション
        if (!birthdate) {
            showError('birthdate', '生年月日を入力してください');
            isValid = false;
        } else {
            const birthDate = new Date(birthdate);
            const today = new Date();
            if (birthDate > today) {
                showError('birthdate', '未来の日付は入力できません');
                isValid = false;
            } else {
                clearError('birthdate');
            }
        }

        // マイナンバーのバリデーション
        if (mynumber.length !== 12) {
            showError('mynumber', 'マイナンバーは12桁で入力してください');
            isValid = false;
        } else if (!/^\d{12}$/.test(mynumber)) {
            showError('mynumber', 'マイナンバーは数字のみで入力してください');
            isValid = false;
        } else {
            clearError('mynumber');
        }

        // プライバシーポリシーの同意
        if (!privacy) {
            showError('privacy', '個人情報の取り扱いについて同意してください');
            isValid = false;
        } else {
            clearError('privacy');
        }

        return isValid;
    }

    // エラーメッセージの表示
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorDiv = field.parentNode.querySelector('.error-message');
        
        if (errorDiv) {
            errorDiv.textContent = message;
        } else {
            const newErrorDiv = document.createElement('div');
            newErrorDiv.className = 'error-message';
            newErrorDiv.textContent = message;
            newErrorDiv.style.color = 'var(--error-color)';
            newErrorDiv.style.fontSize = '0.9rem';
            newErrorDiv.style.marginTop = '5px';
            field.parentNode.appendChild(newErrorDiv);
        }
        
        field.style.borderColor = 'var(--error-color)';
    }

    // エラーメッセージのクリア
    function clearError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorDiv = field.parentNode.querySelector('.error-message');
        
        if (errorDiv) {
            errorDiv.remove();
        }
        
        field.style.borderColor = 'var(--border-color)';
    }



    // リアルタイムバリデーション
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });

    function validateField(field) {
        const fieldId = field.id;
        const value = field.value.trim();

        switch (fieldId) {
            case 'name':
                if (value.length > 0 && value.length < 2) {
                    showError(fieldId, 'お名前は2文字以上で入力してください');
                } else {
                    clearError(fieldId);
                }
                break;
                
            case 'mynumber':
                if (value.length > 0 && value.length !== 12) {
                    showError(fieldId, 'マイナンバーは12桁で入力してください');
                } else if (value.length > 0 && !/^\d{12}$/.test(value)) {
                    showError(fieldId, 'マイナンバーは数字のみで入力してください');
                } else {
                    clearError(fieldId);
                }
                break;
                
            case 'email':
                if (value.length > 0 && !isValidEmail(value)) {
                    showError(fieldId, '有効なメールアドレスを入力してください');
                } else {
                    clearError(fieldId);
                }
                break;
        }
    }

    // メールアドレスのバリデーション
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 電話番号のフォーマット
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        let value = this.value.replace(/[^\d]/g, '');
        
        if (value.length >= 3) {
            value = value.slice(0, 3) + '-' + value.slice(3);
        }
        if (value.length >= 8) {
            value = value.slice(0, 8) + '-' + value.slice(8);
        }
        
        this.value = value.slice(0, 13); // 最大13文字（ハイフン含む）
    });

    // スマホでの入力体験向上
    // フォーカス時に自動スクロール
    const allInputs = document.querySelectorAll('input, textarea');
    allInputs.forEach(input => {
        input.addEventListener('focus', function() {
            // 少し遅延させてスクロール（キーボード表示を待つ）
            setTimeout(() => {
                this.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 300);
        });
    });

    // タッチデバイスでのホバー効果を無効化
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