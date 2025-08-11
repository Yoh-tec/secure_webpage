// AWS API GatewayのエンドポイントURL（デプロイ後に設定）
const API_ENDPOINT = 'YOUR_API_GATEWAY_URL'; // 後で実際のURLに置き換え

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('userForm');
    const successMessage = document.getElementById('successMessage');
    const backToFormBtn = document.getElementById('backToForm');
    const mynumberInput = document.getElementById('mynumber');
    const postalInput = document.getElementById('postal');

    // マイナンバーの入力制限（数字のみ）
    mynumberInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 12) {
            this.value = this.value.slice(0, 12);
        }
    });

    // 郵便番号の自動フォーマット
    postalInput.addEventListener('input', function(e) {
        let value = this.value.replace(/[^\d]/g, '');
        if (value.length >= 3) {
            value = value.slice(0, 3) + '-' + value.slice(3);
        }
        this.value = value.slice(0, 8);
    });

    // フォーム送信処理（AWS API Gateway使用）
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = '送信中...';
        form.classList.add('loading');

        try {
            const formData = new FormData(form);
            const userData = {
                name: formData.get('name'),
                birthdate: formData.get('birthdate'),
                mynumber: formData.get('mynumber'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                postal: formData.get('postal'),
                prefecture: formData.get('prefecture'),
                city: formData.get('city'),
                building: formData.get('building'),
                privacy: formData.get('privacy')
            };

            // AWS API Gatewayにデータを送信
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok) {
                // 成功時の処理
                setTimeout(() => {
                    form.style.display = 'none';
                    successMessage.style.display = 'block';
                    form.reset();
                    submitBtn.disabled = false;
                    submitBtn.textContent = '送信';
                    form.classList.remove('loading');
                }, 1000);
            } else {
                throw new Error(result.error || '送信に失敗しました');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('送信に失敗しました: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = '送信';
            form.classList.remove('loading');
        }
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
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const privacy = document.getElementById('privacy').checked;

        let isValid = true;

        // 名前のバリデーション
        if (name.length < 2) {
            showError('name', '氏名は2文字以上で入力してください');
            isValid = false;
        } else {
            clearError('name');
        }

        // 生年月日のバリデーション
        if (!birthdate) {
            showError('birthdate', '生年月日を入力してください');
            isValid = false;
        } else {
            clearError('birthdate');
        }

        // マイナンバーのバリデーション
        if (!/^\d{12}$/.test(mynumber)) {
            showError('mynumber', 'マイナンバーは12桁の数字で入力してください');
            isValid = false;
        } else {
            clearError('mynumber');
        }

        // メールアドレスのバリデーション
        if (email && !isValidEmail(email)) {
            showError('email', '正しいメールアドレスを入力してください');
            isValid = false;
        } else {
            clearError('email');
        }

        // 電話番号のバリデーション
        if (phone && !/^[\d\-]{10,15}$/.test(phone)) {
            showError('phone', '正しい電話番号を入力してください');
            isValid = false;
        } else {
            clearError('phone');
        }

        // プライバシーポリシーの同意
        if (!privacy) {
            alert('個人情報の取り扱いについて同意してください');
            isValid = false;
        }

        return isValid;
    }

    // エラーメッセージの表示
    function showError(fieldId, message) {
        const errorElement = document.getElementById(fieldId + '-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    // エラーメッセージのクリア
    function clearError(fieldId) {
        const errorElement = document.getElementById(fieldId + '-error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    // メールアドレスの検証
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // リアルタイムバリデーション
    const inputs = form.querySelectorAll('input, select');
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
                if (value.length < 2) {
                    showError(fieldId, '氏名は2文字以上で入力してください');
                } else {
                    clearError(fieldId);
                }
                break;
            case 'birthdate':
                if (!value) {
                    showError(fieldId, '生年月日を入力してください');
                } else {
                    clearError(fieldId);
                }
                break;
            case 'mynumber':
                if (!/^\d{12}$/.test(value)) {
                    showError(fieldId, 'マイナンバーは12桁の数字で入力してください');
                } else {
                    clearError(fieldId);
                }
                break;
            case 'email':
                if (value && !isValidEmail(value)) {
                    showError(fieldId, '正しいメールアドレスを入力してください');
                } else {
                    clearError(fieldId);
                }
                break;
            case 'phone':
                if (value && !/^[\d\-]{10,15}$/.test(value)) {
                    showError(fieldId, '正しい電話番号を入力してください');
                } else {
                    clearError(fieldId);
                }
                break;
        }
    }
}); 