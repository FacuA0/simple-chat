let nombre = "";
let chat = [];
let divChat, campo, titulo;
let ws;

window.onload = function() { 
    divChat = document.querySelector("#chat");
    titulo = document.querySelector("#titulo");
    campo = document.querySelector("#campo");

    campo.addEventListener("keypress", evt => {
        if (evt.key == "Enter") {
            enviarMensaje();
        }
    });

    do {
        nombre = prompt("Escoje tu nombre");
    }
    while (!nombre);

    titulo.textContent = "Chat (conectando)";
    ws = new WebSocket("ws://" + location.host + "/ws");
    ws.addEventListener("open", () => {
        let datoNombre = JSON.stringify({ nombre });
        ws.send(datoNombre);
        titulo.textContent = "Chat";
    });

    ws.addEventListener("message", datos => {
        let json = JSON.parse(datos.data);
        
        if (json.chat) {
            chat = json.chat;

            actualizarChat();
            mostrarChatAbajo();
        }
        else if (json.mensaje) {
            sumarMensaje(json.mensaje);
            mostrarChatAbajo();
        }
    });

    ws.addEventListener("error", err => {
        console.error("Hubo un error con la conexión");
        console.error(err);
    });
    
    ws.addEventListener("close", evt => {
        let limpio = evt.wasClean ? " de forma limpia" : "";

        console.error("Conexión cerrada" + limpio + " (" + evt.code + ": " + evt.reason + ")");
        titulo.textContent = "Chat (desconectado)";
    });
};

function enviarMensaje() {
    let texto = campo.value;
    if (texto == "") return;

    let mensaje = {
        autor: nombre,
        mensaje: texto
    };

    ws.send(JSON.stringify({ mensaje: texto }));

    campo.value = "";

    sumarMensaje(mensaje);
    mostrarChatAbajo();
}

function actualizarChat() {
    divChat.innerHTML = "";

    chat.forEach(mensaje => {
        sumarMensaje(mensaje);
    });
}

function sumarMensaje(mensaje) {
    let msj = document.createElement("div");
    msj.className = "mensaje";

    let autor = document.createElement("p");
    autor.className = "autor";
    if (!mensaje.sistema) autor.textContent = mensaje.autor;
    
    let texto = document.createElement("p");
    texto.className = "texto";
    texto.textContent = mensaje.mensaje;

    if (!mensaje.sistema) msj.appendChild(autor);
    msj.appendChild(texto);

    divChat.appendChild(msj);
}

function mostrarChatAbajo() {
    divChat.scrollTop = divChat.scrollHeight - divChat.clientHeight;
}