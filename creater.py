import secrets

# 生成 SECRET_KEY
secret_key = secrets.token_hex(16)
print("SECRET_KEY:", secret_key)

# 生成 JWT_SECRET_KEY
jwt_secret_key = secrets.token_hex(16)
print("JWT_SECRET_KEY:", jwt_secret_key)
