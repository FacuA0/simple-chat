import http from "node:http";
import fs from "node:fs";
import { WebSocketServer } from "ws";
import { manejarSolicitudWeb } from "./modulos/http-server.js";

let guardado = {
    hora: 0,
    guardando: false,
    pendiente: -1
}
let usuarios = [];
let chat = [];

let wsServer = new WebSocketServer({noServer: true});

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
server.listen(9080, () => {
    restaurarChat();

    console.log("Servidor iniciado");
});

function restaurarChat() {
    fs.readFile("chat/historial.json", "utf8", (error, datos) => {
        if (error) {
            console.log("No se restauró el historial de chat (" + error.code + ").");
            return;
        }

        chat = JSON.parse(datos);
        guardado.hora = Date.now();

        console.log("Chat restaurado");
    });
}

wsServer.on("connection", socket => {
    socket.on("error", error => {
        console.log("Error de socket: " + error);
    });

    socket.on("close", () => {
        let usuario = usuarios.findIndex(usuario => usuario.socket == socket);
        let nombre = usuarios[usuario].nombre;
        usuarios.splice(usuario, 1);
        
        console.log(nombre + " cerrado");

        if (nombre == null) return;
        
        let mensaje = {
            tipo: "salir",
            fecha: Date.now(),
            usuario: nombre
        };
        
        enviarMensaje(mensaje);
    })

    socket.on("message", datos => nuevoMensaje(socket, datos));

    usuarios.push({
        socket: socket,
        nombre: null
    });
});

function nuevoMensaje(socket, datos) {
    let usuario = usuarios.find(c => c.socket == socket);

    let datosTexto = datos.toString();
    let json = JSON.parse(datosTexto);

    let tipo = json.tipo;
    if (tipo == "entrar") {
        usuario.nombre = json.nombre;

        enviarChat(socket);

        let mensaje = {
            tipo: "entrar",
            fecha: Date.now(),
            usuario: usuario.nombre
        };

        enviarMensaje(mensaje);
    }
    else if (tipo == "enviarMensaje") {
        let nombre = usuario.nombre;
        if (nombre == null) return;

        let mensaje = {
            tipo: "mensaje",
            fecha: Date.now(),
            autor: nombre,
            mensaje: json.mensaje
        };

        enviarMensaje(mensaje, socket);
    }
    else if (tipo == "obtenerMiembros") {
        if (usuario.nombre == null) return;

        let miembros = usuarios.map(conexion => conexion.nombre).filter(nombre => nombre !== null);
        let datoLista = JSON.stringify({
            tipo: "enviarMiembros",
            miembros
        });

        socket.send(datoLista);
    }

    console.log(usuario.nombre + ": " + datosTexto);
}

function enviarChat(socket) {
    let datoChat = JSON.stringify({
        tipo: "enviarChat",
        chat
    });

    socket.send(datoChat);
}

function enviarMensaje(mensaje, remitente) {
    chat.push(mensaje);
    guardarMensajes();

    let datoMensaje = JSON.stringify({
        tipo: "nuevoMensaje",
        mensaje
    });

    usuarios.forEach(c => {
        if (remitente && c.socket === remitente) return;
        c.socket.send(datoMensaje);
    });
}

function guardarMensajes() {
    clearTimeout(guardado.pendiente);
    guardado.pendiente = -1;

    let now = Date.now();
    if (!guardado.guardando && now - guardado.hora >= 2000) {
        fs.writeFile("chat/historial.json", JSON.stringify(chat), error => {
            guardado.guardando = false;
            if (error) return;

            guardado.hora = now;
        });

        guardado.guardando = true;
    }
    else {
        guardado.pendiente = setTimeout(guardarMensajes, 500);
    }
}
