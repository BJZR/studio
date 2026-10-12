package main

import (
	"errors"
	"io"
	"net/http"
)

var errInvalidTarget = errors.New("X-Target-URL inválida: debe ser http(s) con host")

// streamBody copia el cuerpo al cliente haciendo flush en cada bloque.
func streamBody(w http.ResponseWriter, body io.Reader) {
	flusher, _ := w.(http.Flusher)
	buffer := make([]byte, 4096)

	for {
		n, err := body.Read(buffer)
		if n > 0 {
			if _, writeErr := w.Write(buffer[:n]); writeErr != nil {
				return
			}
			if flusher != nil {
				flusher.Flush()
			}
		}
		if err != nil {
			return
		}
	}
}
