let nombre = "";
let chat = [];
let miembros = [];
let reintentoConexion = -1;
let modoOscuro = false;
let html;
let ws;

window.onload = function() { 
    html = {
        titulo: document.querySelector("#titulo"),
        miembros: document.querySelector("#miembros"),
        listaMiembros: document.querySelector("#lista-miembros"),
        tituloMiembros: document.querySelector("#titulo-miembros"),
        chat: document.querySelector("#chat"),
        campo: document.querySelector("#campo"),
        botonOscuro: document.querySelector("#modo-oscuro"),
        botonMiembros: document.querySelector("#abrir-miembros"),
        cerrarMiembros: document.querySelector("#cerrar-miembros"),
        enviar: document.querySelector("#enviar")
    };

    html.botonOscuro.addEventListener("click", cambiarModoOscuro);
    html.botonMiembros.addEventListener("click", abrirListaMiembros);
    html.cerrarMiembros.addEventListener("click", cerrarListaMiembros);
    html.enviar.addEventListener("click", enviarMensaje);

    html.campo.addEventListener("keypress", evt => {
        if (evt.key == "Enter") {
            enviarMensaje();
        }
    });

    document.body.lang = navigator.language;
    html.tituloMiembros.textContent = traducir("title.participants");
    html.botonOscuro.title = traducir("tooltip.darkMode");
    html.botonMiembros.title = traducir("tooltip.openMembersList");
    html.cerrarMiembros.title = traducir("tooltip.close");
    html.enviar.title = traducir("tooltip.send");
    html.campo.placeholder = traducir("field.writeMessage");

    nombre = localStorage.getItem("nombre");

    if (nombre && !confirm(traducir("alert.reuseName", nombre))) {
        nombre = null;
    }

    while (!nombre) {
        nombre = prompt(traducir("alert.chooseName"));
    }

    localStorage.setItem("nombre", nombre);

    establecerSocket();
};

function establecerSocket() {
    html.titulo.textContent = traducir("chat.connecting");

    let protocolo = location.protocol == "https:" ? "wss://" : "ws://";
    ws = new WebSocket(protocolo + location.host + "/ws");

    ws.addEventListener("open", () => {
        let datoNombre = JSON.stringify({
            tipo: "entrar",
            nombre
        });
        ws.send(datoNombre);

        html.titulo.textContent = "Chat";
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
        html.titulo.textContent = traducir("chat.disconnected");

        setTimeout(establecerSocket, 5000);
    });
}

function enviarMensaje() {
    let texto = html.campo.value;
    if (texto == "") return;

    let mensaje = {
        tipo: "mensaje",
        fecha: new Date().getTime(),
        autor: nombre,
        mensaje: texto
    };

    ws.send(JSON.stringify({
        tipo: "enviarMensaje",
        mensaje: texto
    }));

    html.campo.value = "";

    sumarMensaje(mensaje);
    mostrarChatAbajo();
}

function cambiarModoOscuro(modo) {
    if (typeof modo !== "boolean") {
        cambiarModoOscuro(!modoOscuro);
        return;
    }

    modoOscuro = modo;
    document.body.className = modo ? "oscuro" : "";

    let titulo = modo ? traducir("tooltip.lightMode") : traducir("tooltip.darkMode");
    let icono = modo ? "images/Claro.png" : "images/Oscuro.png";
    
    html.botonOscuro.title = titulo;
    html.botonOscuro.firstElementChild.src = icono;

    let iconoMiembros = modo ? "images/Miembros oscuro.png" : "images/Miembros.png";
    html.botonMiembros.firstElementChild.src = iconoMiembros;

    let iconoCerrar = modo ? "images/Cerrar oscuro.png" : "images/Cerrar.png";
    html.cerrarMiembros.firstElementChild.src = iconoCerrar;

    let iconoEnviar = modo ? "images/Enviar oscuro.png" : "images/Enviar.png";
    html.enviar.firstElementChild.src = iconoEnviar;
}

function cerrarListaMiembros() {
    html.miembros.className = "";
}

function abrirListaMiembros() {
    html.miembros.className = "abierto";

    ws.send(JSON.stringify({
        tipo: "obtenerMiembros"
    }));
}

function actualizarChat() {
    html.chat.innerHTML = "";

    chat.forEach(mensaje => {
        sumarMensaje(mensaje);
    });
}

function actualizarMiembros() {
    html.listaMiembros.innerHTML = "";

    miembros.forEach(miembro => {
        let pMiembro = document.createElement("p");
        pMiembro.textContent = miembro;
        html.listaMiembros.appendChild(pMiembro);
    });
}

function sumarMensaje(mensaje) {
    let msj = document.createElement("div");
    msj.className = "mensaje";

    let ahora = new Date(mensaje.fecha);
    let fechaLarga = ahora.toLocaleString();
    let hora = (ahora.getHours() + "").padStart(2, "0");
    let minutos = (ahora.getMinutes() + "").padStart(2, "0");
    let fecha = `${hora}:${minutos}`;

    let spanFecha = mensaje.fecha ? `&nbsp;<span class="fecha" title="${fechaLarga}">${fecha}</span>` : "";

    if (mensaje.tipo == "mensaje") {
        let cabecera = document.createElement("p");
        cabecera.className = "cabecera";

        let autor = document.createElement("span");
        autor.className = "autor";
        autor.textContent = mensaje.autor;

        cabecera.appendChild(autor);
        cabecera.innerHTML += spanFecha;

        msj.appendChild(cabecera);
    }
    
    let texto = document.createElement("p");
    texto.className = "texto";

    if (mensaje.tipo == "mensaje" || mensaje.tipo == "sistema") {
        texto.textContent = mensaje.mensaje;
    }
    else if (mensaje.tipo == "entrar") {
        texto.textContent = traducir("message.userJoined", mensaje.usuario);
    }
    else if (mensaje.tipo == "salir") {
        texto.textContent = traducir("message.userLeft", mensaje.usuario);
    }

    if (mensaje.tipo != "mensaje") {
        texto.innerHTML += spanFecha;
    }

    msj.appendChild(texto);

    html.chat.appendChild(msj);
}

function mostrarChatAbajo() {
    html.chat.scrollTop = html.chat.scrollHeight - html.chat.clientHeight;
}

function traducir(texto, ...parametros) {
    let usarEspañol = navigator.language.startsWith("es");

    if (texto == "alert.reuseName") {
        if (usarEspañol) return reemplazarPlantilla("¿Deseas volver a usar el nombre \"%s\"?", parametros);
        else return reemplazarPlantilla("Do you want to reuse the name \"%s\"?", parametros);
    }
    if (texto == "alert.chooseName") {
        if (usarEspañol) return reemplazarPlantilla("Escoje tu nombre");
        else return reemplazarPlantilla("Choose your name");
    }
    if (texto == "title.participants") {
        if (usarEspañol) return reemplazarPlantilla("Participantes");
        else return reemplazarPlantilla("Participants");
    }
    if (texto == "field.writeMessage") {
        if (usarEspañol) return reemplazarPlantilla("Escribe un mensaje");
        else return reemplazarPlantilla("Write a message");
    }
    if (texto == "tooltip.openMembersList") {
        if (usarEspañol) return reemplazarPlantilla("Abrir lista de miembros");
        else return reemplazarPlantilla("Open members list");
    }
    if (texto == "tooltip.close") {
        if (usarEspañol) return reemplazarPlantilla("Cerrar");
        else return reemplazarPlantilla("Close");
    }
    if (texto == "tooltip.darkMode") {
        if (usarEspañol) return reemplazarPlantilla("Modo oscuro");
        else return reemplazarPlantilla("Dark mode");
    }
    if (texto == "tooltip.lightMode") {
        if (usarEspañol) return reemplazarPlantilla("Modo claro");
        else return reemplazarPlantilla("Light mode");
    }
    if (texto == "tooltip.send") {
        if (usarEspañol) return reemplazarPlantilla("Enviar");
        else return reemplazarPlantilla("Send");
    }
    if (texto == "message.userJoined") {
        if (usarEspañol) return reemplazarPlantilla("¡%s se ha unido al chat!", parametros);
        else return reemplazarPlantilla("%s joined the chat!", parametros);
    }
    if (texto == "message.userLeft") {
        if (usarEspañol) return reemplazarPlantilla("¡%s ha dejado el chat!", parametros);
        else return reemplazarPlantilla("%s left the chat!", parametros);
    }
    if (texto == "chat.disconnected") {
        if (usarEspañol) return reemplazarPlantilla("Chat (desconectado)");
        else return reemplazarPlantilla("Chat (disconnected)");
    }
    if (texto == "chat.connecting") {
        if (usarEspañol) return reemplazarPlantilla("Chat (conectando)");
        else return reemplazarPlantilla("Chat (connecting)");
    }
}

function reemplazarPlantilla(texto, ...parametros) {
    let partes = texto.split("%s");
    if (partes.length == 1) {
        return texto;
    }

    let nuevoTexto = partes[0];
    for (let i = 1; i < partes.length; i++) {
        nuevoTexto += (parametros[i - 1] ?? "<invalid>") + partes[i];
    }

    return nuevoTexto;
}