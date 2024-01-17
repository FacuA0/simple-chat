import http from "http";
import fs from "fs";
import ws from "ws";
import internal from "stream";

const tiposMedia = new Map([
    [".html", "text/html"],
    [".css", "text/css"],
    [".js", "text/js"]
]);

/**
 * Maneja las solicitudes del servidor web (por ejemplo, para cargar la página)
 * 
 * @param {http.IncomingMessage} req Solicitud
 * @param {http.ServerResponse} res Respuesta
 */
function manejarSolicitudWeb(req, res) {
    let path = "./pagina" + req.url;
    if (req.url == "/") path = "./pagina/chat.html";

    console.log(`Solicitud de ${req.url}`);

    fs.readFile(path, (err, datos) => {
        if (err) {
            res.writeHead(404);
            res.end("404 Not Found");
            return;
        }

        let extension = path.slice(path.lastIndexOf("."));
        if (tiposMedia.has(extension)) {
            res.setHeader("Content-Type", tiposMedia.get(extension));
        }

        res.setHeader("Content-Length", datos.byteLength);
        res.writeHead(200);
        res.end(datos);
    });
}

export { manejarSolicitudWeb };