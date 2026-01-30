package auth

import (
	"encoding/json"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte("CHANGE_ME_TO_A_LONG_RANDOM_STRING")

// Operator user account
type User struct {
	Username   string `json:"username"`
	Password   string `json:"password_hash"` // bcrypt hash
	UUID       string `json:"id"`            //unique user id
	Email      string `json:"email"`
	Role       string `json:"role"`
	Created_at string `json:"created_at"`
}

var users = make(map[string]User)

// Load users from disk
func LoadUsers() error {
	data, err := os.ReadFile("data/users.json")
	if err != nil {
		return err
	}

	return json.Unmarshal(data, &users)
}

// Save users to disk
func SaveUsers() error {
	data, _ := json.MarshalIndent(users, "", "  ")
	return os.WriteFile("data/users.json", data, 0644)
}

// CreateUser creates a new operator user
func CreateUser(username, password, role_user string) error {
	if _, exists := users[username]; exists {
		return errors.New("user already exists")
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	users[username] = User{
		Username: username,
		Password: string(hash),
	}

	return SaveUsers()
}

// Authenticate checks username/password
func Authenticate(username, password string) bool {
	u, exists := users[username]
	if !exists {
		return false
	}
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	if err == nil {
		return true
	} else {
		return false
	}
}

// GenerateJWT returns signed JWT token
func GenerateJWT(username string) (string, error) {
	claims := jwt.MapClaims{
		"sub": username,
		"exp": time.Now().Add(24 * time.Hour).Unix(),
		"iat": time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ValidateJWT checks token validity
func ValidateJWT(tokenStr string) (string, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return "", errors.New("invalid token")
	}

	claims := token.Claims.(jwt.MapClaims)
	username := claims["sub"].(string)
	return username, nil
}

func GetUser(username string) User {
	return users[username]
}
