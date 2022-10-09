---
layout      : post
title       : "Grandpa - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Grandpa-HackTheBox/Grandpa.webp
category    : [ htb ]
tags        : [ Windows ]
---

🤖​En esta ocasión estamos ante una máquina Windows de nivel Easy, en la que tendremos que explotar una vulnerabilidad del servidor IIS de Microsoft y escalaremos privielgios a través de un exploit local, y todo usando metasploit. Es una máquina sencilla y perfecta para quienes empiezan en el mundo del CTF y de la Ciberseguridad🤖​.

![](/assets/images/HTB/Grandpa-HackTheBox/Grandpa2.webp)

![](/assets/images/HTB/Grandpa-HackTheBox/Grandpa-rating.webp)

...


**Un pequeño INDICE**

1. [Reconocimiento](#reconocimiento).
    * [Reconocimiento de Puertos](#recon-nmap).
2. [Enumeración](#enumeración).
    * [Enumeración Web](#enum-web).
3. [Explotación](#explotacion).   
    * [Metasploit](#metasploit).
 5. [Escalada de Privilegios](#privesc). 
    * [kitrap0d](#kitrap0d).   


...

# Reconocimiento [#](reconocimiento) {#reconocimiento}

----

## Reconocimiento de Puertos [📌](#recon-nmap) {#recon-nmap}

Como de costumbre comienzo lanzando la utilidad Whichsystem para averiguar ante que sistema operativo me enfrento.

![](/assets/images/HTB/Grandpa-HackTheBox/whichsystem.webp)


Una vez que sabemos que nos enfrentamos a una máquina Windows ya procedo a enumerar puertos.

```nmap
PORT   STATE SERVICE
80/tcp open  http
```

En principio solo encuentro el puerto 80 (http) abierto, pero necesito algo más de información sobre este puerto, para saber que servicio y versión se ejecuta en el mismo.

```nmap
PORT   STATE SERVICE VERSION
80/tcp open  http    Microsoft IIS httpd 6.0
| http-methods: 
|_  Potentially risky methods: TRACE COPY PROPFIND SEARCH LOCK UNLOCK DELETE PUT MOVE MKCOL PROPPATCH
|_http-title: Under Construction
| http-webdav-scan: 
|   Server Type: Microsoft-IIS/6.0
|   Public Options: OPTIONS, TRACE, GET, HEAD, DELETE, PUT, POST, COPY, MOVE, MKCOL, PROPFIND, PROPPATCH, LOCK, UNLOCK, SEARCH
|   WebDAV type: Unknown
|   Server Date: Mon, 03 Oct 2022 20:46:41 GMT
|_  Allowed Methods: OPTIONS, TRACE, GET, HEAD, COPY, PROPFIND, SEARCH, LOCK, UNLOCK
|_http-server-header: Microsoft-IIS/6.0
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

>`Servidor Web IIS httpd 6.0`

# Enumeración [#](enumeración) {#enumeración}

----

## Enumeración Web [📌](#enum-web) {#enum-web}

Sabemos que se ejecuta en el puerto 80 el servuidor web IIS httpd 6.0, asique voy a abrir el navegador para ver que tenemos.

![](/assets/images/HTB/Grandpa-HackTheBox/web.webp)

Por lo que veo el servidor web aún está en desarrollo, pero antes de seguir voy a buscar vulnerabilidades y algún exploit en el servidor web a través de la herramienta searchsploit.

![](/assets/images/HTB/Grandpa-HackTheBox/searchsploit.webp)

Hay una vulnerabilidad que me interesa.

> `Microsoft IIS 6.0 - WebDAV 'ScStoragePathFromUrl' Remote Buffer Overflow`

Tenemos un exploit en python o podemos explotarla a través de metasploit.

# Explotación [#](explotacion) {#explotacion}

----

## Metasploit [🔥](#metasploit) {#metasploit}

En mi caso esta vez voy a usar metasploit.

![](/assets/images/HTB/Grandpa-HackTheBox/msf1.webp)


![](/assets/images/HTB/Grandpa-HackTheBox/msf2.webp)

Ya tenemos acceso al sistema.

Una vez dentro enumero procesos para intentar migrarme a algún proceso que se ejecute por parte de otro usuario y así intentar escalar privilegios.

![](/assets/images/HTB/Grandpa-HackTheBox/msf3.webp)

Me migro a un proceso ejecutado por NT AUTHORITY\NETWORK SERVICE.

![](/assets/images/HTB/Grandpa-HackTheBox/msf4.webp)

Ahora soy ese usuario, de forma que intentaré leer la flag de usuario.

![](/assets/images/HTB/Grandpa-HackTheBox/msf5.webp)

Al acceder al directorio de Usuario del propio usuario Harry me da error, acceso denegado, asique debemos escalar privilegios.

# Escalada de Privilegios[#](privesc) {#privesc}

----

## kitrap0d [👽](kitrap0d) {#kitrap0d}

En este caso podría probar a usar SharpHound pero voy a lanzar desde metasploit el exploit-suggester para buscar algun exploit que pueda usar para escalar privilegios aprovechándome de alguna vulnerabilidad existente.

![](/assets/images/HTB/Grandpa-HackTheBox/msf5.9.webp)

Lanzo el exploit y me arroja una lista de exploits que a los que el ssistema es vulnerable.

![](/assets/images/HTB/Grandpa-HackTheBox/msf6.webp)

Usaré el siguiente:

> `windows/local/ms10_015_kitrap0d`

![](/assets/images/HTB/Grandpa-HackTheBox/msf7.webp)

Lo lanzo y ya soy Administrador, puedo leer las flag user y root.

Una máquina sencilla para quien comienza en el mundo CTF y de ciberseguridad.

![](/assets/images/HTB/Grandpa-HackTheBox/fin.gif)

