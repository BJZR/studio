package main

import (
	"flag"
	"log"
	"net/http"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:8787", "dirección de escucha")
	web := flag.String("web", "../web", "carpeta con los archivos estáticos")
	flag.Parse()

	mux := http.NewServeMux()
	mux.HandleFunc("/proxy", proxyHandler)
	mux.Handle("/", http.FileServer(http.Dir(*web)))

	log.Printf("Studio disponible en http://%s", *addr)
	log.Fatal(http.ListenAndServe(*addr, mux))
}
