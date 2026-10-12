package main

import (
	"net/http"
	"net/url"
	"strings"
)

// Cabeceras de la petición que no deben reenviarse al destino.
var skipRequestHeaders = map[string]bool{
	"host":            true,
	"origin":          true,
	"referer":         true,
	"x-target-url":    true,
	"connection":      true,
	"content-length":  true,
	"accept-encoding": true,
}

// Cabeceras de la respuesta que no deben copiarse al cliente.
var skipResponseHeaders = map[string]bool{
	"connection":        true,
	"keep-alive":        true,
	"transfer-encoding": true,
}

// proxyHandler reenvía la petición a la URL indicada en X-Target-URL
// y devuelve la respuesta en streaming (necesario para SSE).
func proxyHandler(w http.ResponseWriter, r *http.Request) {
	if !isSameOrigin(r) {
		http.Error(w, "origen no permitido", http.StatusForbidden)
		return
	}

	target, err := parseTarget(r.Header.Get("X-Target-URL"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	req, err := http.NewRequestWithContext(r.Context(), r.Method, target.String(), r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	req.ContentLength = r.ContentLength
	copyHeaders(req.Header, r.Header, skipRequestHeaders)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	defer res.Body.Close()

	copyHeaders(w.Header(), res.Header, skipResponseHeaders)
	w.WriteHeader(res.StatusCode)
	streamBody(w, res.Body)
}

func parseTarget(raw string) (*url.URL, error) {
	target, err := url.Parse(raw)
	if err != nil || target.Host == "" || (target.Scheme != "http" && target.Scheme != "https") {
		return nil, errInvalidTarget
	}
	return target, nil
}

// isSameOrigin evita que otras webs abiertas en el navegador usen el proxy local.
func isSameOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}
	parsed, err := url.Parse(origin)
	return err == nil && strings.EqualFold(parsed.Host, r.Host)
}

func copyHeaders(dst, src http.Header, skip map[string]bool) {
	for key, values := range src {
		if skip[strings.ToLower(key)] {
			continue
		}
		dst[key] = append([]string(nil), values...)
	}
}
