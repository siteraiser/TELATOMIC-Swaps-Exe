package main

import (
	"embed"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

//go:embed index.html
//go:embed buttons.js
//go:embed dero.js
//go:embed derocalls.js
//go:embed eth1.js
//go:embed eth2.js
//go:embed ethcalls.js
//go:embed extras.js
//go:embed helpers.js
//go:embed logic.js
//go:embed mm.js
//go:embed style.css
//go:embed ui.js

var static embed.FS

func main() {
	go func() {
		time.Sleep(200 * time.Millisecond)
		const url = "http://127.0.0.1:8080"
		if err := exec.Command("rundll32", "url.dll", "FileProtocolHandler", url).Start(); err != nil {
			log.Fatal(err)
		}
	}()
	http.HandleFunc("/", loader)
	http.ListenAndServe(":8080", nil)

}

func loader(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/" {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		data, _ := static.ReadFile("index.html")
		fmt.Fprint(w, string(data))
	} else {
		data, _ := static.ReadFile(strings.TrimLeft(r.URL.Path, "/"))
		ext := filepath.Ext(r.URL.Path)
		switch ext {
		case ".js":
			w.Header().Set("Content-Type", "text/javascript; charset=utf-8")
		case ".css":
			w.Header().Set("Content-Type", "text/css; charset=utf-8")
		}
		fmt.Fprint(w, string(data))
	}
}
