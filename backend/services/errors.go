package services

import "errors"

var (
	ErrDatabase            = errors.New("database not initialized")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrTurnstile           = errors.New("turnstile verification failed")
	ErrUpload              = errors.New("upload failed")
)