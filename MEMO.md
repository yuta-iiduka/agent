# MEMO
# 環境構築
```
python -m venv .venv
.venv\Script\activate
# 書き出し
# pip freeze > tools\requirements.txt
pip install -r tools\requirements.txt
$env:FLASK_APP="server:create_app()"
flask db init --multidb
flask db migrate
flask db upgrade
```

# Redisサーバを構築する場合
```
# Windows
# Donwload: https://www.memurai.com/get-memurai?version=windows-valkey
# 管理者権限でインストール(Windows版)
Get-Service *memurai*
Start-Service Memurai
Stop-Service Memurai
Restart-Service Memurai
# Linux
# https://rhel.pkgs.org/8/raven-modular-x86_64/redis-7.0.5-1.el8.x86_64.rpm.html
pip install redis,celery
```

# フロントエンドライブラリ
```
# TOAST
https://ui.toast.com/

```