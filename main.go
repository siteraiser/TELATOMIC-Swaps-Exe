package main

import (
	"embed"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
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

	portFlag := flag.Int("port", 8080, "string")
	flag.Parse()
	port := strconv.Itoa(*portFlag)
	go func() {
		time.Sleep(200 * time.Millisecond)
		log.Println("Server listening on port " + port)
		var url = "http://localhost:" + port
		if err := func(url string) error {
			var cmd *exec.Cmd
			switch runtime.GOOS {
			case "windows":
				cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
			case "darwin":
				cmd = exec.Command("open", url)
			default:
				cmd = exec.Command("xdg-open", url)
			}
			return cmd.Start()
		}(url); err != nil {
			log.Fatal(err)
		}
	}()
	http.HandleFunc("/", loader)
	http.ListenAndServe("localhost:"+port, nil)

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
