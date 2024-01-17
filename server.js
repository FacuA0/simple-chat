import http from "http";
//import fs from "fs";
import { WebSocketServer } from "ws";
import { manejarSolicitudWeb } from "./modulos/http-server.js";

let wsServer = new WebSocketServer({noServer: true});

let conexiones = [];
let chat = [];

let server = http.createServer(manejarSolicitudWeb);
server.on("upgrade", (req, socket, head) => {
    if (req.url == "/ws") {
        wsServer.handleUpgrade(req, socket, head, ws => {
            wsServer.emit("connection", ws);
        });
    }
    else {
        socket.destroy();
    }
});
server.on("error", error => console.error(error));
server.listen(9080, () => console.log("Servidor iniciado"));

wsServer.on("connection", socket => {
    socket.on("error", error => {
        console.log("Error de socket: " + error);
    });

    socket.on("close", () => {
        let conexion = conexiones.findIndex(c => c.socket == socket);
        let nombre = conexiones[conexion].nombre;
        conexiones.splice(conexion, 1);
        
        console.log(nombre + " cerrado");
        
        let mensaje = {
            sistema: true,
            autor: "",
            mensaje: `¡${nombre} ha dejado el chat!`
        };
        
        enviarMensaje(mensaje);
    })

    socket.on("message", datos => nuevoMensaje(socket, datos));

    conexiones.push({
        socket: socket,
        nombre: null
    });
});

function nuevoMensaje(socket, datos) {
    let conexion = conexiones.find(c => c.socket == socket);

    let datosTexto = datos.toString();
    let json = JSON.parse(datosTexto);

    console.log(conexion.nombre + ": " + datosTexto);

    let tipo = json.tipo;
    if (tipo == "entrar") {
        conexion.nombre = json.nombre;

        let datoChat = JSON.stringify({
            tipo: "enviarChat",
            chat
        });
        socket.send(datoChat);

        let mensaje = {
            sistema: true,
            autor: "",
            mensaje: `¡${conexion.nombre} se ha unido al chat!`
        };

        enviarMensaje(mensaje);
    }
    else if (tipo == "enviarMensaje") {
        let nombre = conexion.nombre;
        if (nombre == null) return;

        let mensaje = {
            sistema: false,
            autor: nombre,
            mensaje: json.mensaje
        };

        enviarMensaje(mensaje, socket);
    }
    else if (tipo == "obtenerMiembros") {
        let nombre = conexion.nombre;
        if (nombre == null) return;

        let miembros = conexiones.map(conexion => conexion.nombre).filter(nombre => nombre !== null);
        let datoLista = JSON.stringify({
            tipo: "enviarMiembros",
            miembros
        });

        socket.send(datoLista);
    }
}

function enviarMensaje(mensaje, remitente) {
    chat.push(mensaje);

    let datoMensaje = JSON.stringify({
        tipo: "nuevoMensaje",
        mensaje
    });

    conexiones.forEach(c => {
        if (remitente && c.socket === remitente) return;
        c.socket.send(datoMensaje);
    });
}
