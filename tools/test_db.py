import psycopg2, uuid, json

DB = "postgresql://postgres:kZioGHNmQijCXdulKroBMuPtCdzWJZCu@ballast.proxy.rlwy.net:33563/railway"
conn = psycopg2.connect(DB)
cur = conn.cursor()

# Clear test data
cur.execute("DELETE FROM gym_users")
cur.execute("DELETE FROM users")
cur.execute("DELETE FROM roles")
cur.execute("DELETE FROM gyms")

now = "2026-05-19T00:00:00Z"
uid = str(uuid.uuid4())
gid = str(uuid.uuid4())

# Insert user
cur.execute(
    "INSERT INTO users (id,email,password_hash,first_name,last_name,status,created_at,updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
    [uid, "test@test.com", "hashed_placeholder", "Test", "Admin", "active", now, now]
)

# Insert gym
cur.execute(
    "INSERT INTO gyms (id,name,slug,owner_user_id,status,timezone,locale,feature_flags,created_at,updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
    [gid, "Test Gym", "test-gym", uid, "active", "America/New_York", "en-US", "[]", now, now]
)

# Insert gym_user linkage
cur.execute(
    "INSERT INTO gym_users (id,gym_id,user_id,joined_at) VALUES (%s,%s,%s,%s)",
    [str(uuid.uuid4()), gid, uid, now]
)

# Insert owner role
rid = str(uuid.uuid4())
perms = [
    "gym:read", "gym:update", "member:read", "member:write",
    "staff:read", "staff:invite", "plan:read", "plan:write",
    "location:read", "location:create", "location:update",
    "class:read", "class:write", "check_in:read", "check_in:write",
    "booking:read", "booking:write"
]
cur.execute(
    "INSERT INTO roles (id,gym_id,name,permissions,is_system,created_at,updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
    [rid, gid, "owner", json.dumps(perms), True, now, now]
)

conn.commit()

# Verify
cur.execute("SELECT count(*) FROM users")
print("Users:", cur.fetchone()[0])
cur.execute("SELECT count(*) FROM gyms")
print("Gyms:", cur.fetchone()[0])
cur.execute("SELECT count(*) FROM roles")
print("Roles:", cur.fetchone()[0])
cur.execute("SELECT count(*) FROM gym_users")
print("GymUsers:", cur.fetchone()[0])

cur.execute("SELECT * FROM gyms")
row = cur.fetchone()
print(f"Gym: {row[1]} (slug={row[2]})")

conn.close()
print("Done!")
