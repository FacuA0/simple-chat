let nombre = "";
let chat = [];
let miembros = [];
let titulo, divMiembros, listaMiembros, divChat, campo;
let ws;

window.onload = function() { 
    titulo = document.querySelector("#titulo");
    divMiembros = document.querySelector("#miembros");
    listaMiembros = document.querySelector("#lista-miembros");
    divChat = document.querySelector("#chat");
    campo = document.querySelector("#campo");

    document.querySelector("#abrir-miembros").addEventListener("click", abrirListaMiembros);
    document.querySelector("#cerrar-miembros").addEventListener("click", cerrarListaMiembros);
    document.querySelector("#enviar").addEventListener("click", enviarMensaje);

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
        let datoNombre = JSON.stringify({
            tipo: "entrar",
            nombre
        });
        ws.send(datoNombre);

        titulo.textContent = "Chat";
    });

    ws.addEventListener("message", datos => {
        let json = JSON.parse(datos.data);
        
        let tipo = json.tipo;
        if (tipo == "enviarChat") {
            chat = json.chat;

            actualizarChat();
            mostrarChatAbajo();
        }
        else if (tipo == "nuevoMensaje") {
            sumarMensaje(json.mensaje);
            mostrarChatAbajo();
        }
        else if (tipo == "enviarMiembros") {
            miembros = json.miembros;
            actualizarMiembros();
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

    ws.send(JSON.stringify({
        tipo: "enviarMensaje",
        mensaje: texto
    }));

    campo.value = "";

    sumarMensaje(mensaje);
    mostrarChatAbajo();
}

function cerrarListaMiembros() {
    divMiembros.className = "";
}

function abrirListaMiembros() {
    divMiembros.className = "abierto";

    ws.send(JSON.stringify({
        tipo: "obtenerMiembros"
    }));
}

function actualizarChat() {
    divChat.innerHTML = "";

    chat.forEach(mensaje => {
        sumarMensaje(mensaje);
    });
}

function actualizarMiembros() {
    listaMiembros.innerHTML = "";

    miembros.forEach(miembro => {
        let pMiembro = document.createElement("p");
        pMiembro.textContent = miembro;
        listaMiembros.appendChild(pMiembro);
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